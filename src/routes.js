const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { CATEGORIAS, ESPESORES, AGUJEROS, DIAMETROS, MATERIALES, TERMINACIONES, getCategoria } = require("./categories");
const { calcularPrecio } = require("./pricingEngine");
const store = require("./store");
const mp = require("./mercadopago");
const { hashPassword, checkPassword, signToken, requireAuth, requireAdminRole } = require("./auth");

const router = express.Router();

function round2(n) {
  return Math.round(n * 100) / 100;
}

// =========================================================================
// Categorias
// =========================================================================

router.get("/categorias", (req, res) => {
  res.json(CATEGORIAS.map(c => ({ id: c.id, nombre: c.nombre, icono: c.icono, cantidadFormas: c.formas.length })));
});

router.get("/categorias/:id", (req, res) => {
  const cat = getCategoria(req.params.id);
  if (!cat) return res.status(404).json({ error: "Categoria no encontrada" });
  res.json({
    ...cat,
    listasUniversales: { espesores: ESPESORES, agujeros: AGUJEROS, diametros: DIAMETROS, materiales: MATERIALES, terminaciones: TERMINACIONES }
  });
});

// =========================================================================
// Cotizacion
// =========================================================================

router.post("/quote", (req, res) => {
  const { categoriaId, seleccion } = req.body;
  const cat = getCategoria(categoriaId);
  if (!cat) return res.status(400).json({ error: "Categoria invalida" });

  const params = store.getPricingParams();
  const resultado = calcularPrecio(params, seleccion || {});
  if (resultado.error) return res.status(400).json(resultado);
  res.json(resultado);
});

// =========================================================================
// Autenticacion: registro / login / sesion actual
// =========================================================================

router.post("/auth/register", async (req, res) => {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
  }
  if (store.getUserByEmail(email)) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
  }
  const user = {
    id: uuidv4(),
    nombre,
    email: email.toLowerCase(),
    passwordHash: await hashPassword(password),
    role: "cliente",
    createdAt: new Date().toISOString()
  };
  store.createUser(user);
  const token = signToken(user);
  res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = email && store.getUserByEmail(email);
  const ok = user && await checkPassword(password || "", user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Email o contraseña incorrectos." });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } });
});

router.get("/auth/me", requireAuth, (req, res) => {
  const user = store.getUserById(req.user.sub);
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
  res.json({ id: user.id, nombre: user.nombre, email: user.email, role: user.role });
});

// Crea el PRIMER administrador. Requiere el ADMIN_TOKEN del .env (no un login).
// Una vez que exista al menos un admin, esta ruta se desactiva sola por seguridad:
// los admins siguientes se crean desde el panel de administracion (requiere estar
// logueado como admin), no con esta ruta.
router.post("/auth/bootstrap-admin", async (req, res) => {
  if (store.anyAdminExists()) {
    return res.status(403).json({ error: "Ya existe un administrador. Pedile a un admin que te invite desde el panel." });
  }
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "Token de administrador invalido." });
  }
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }
  let user = store.getUserByEmail(email);
  if (user) {
    user = store.updateUser(user.id, { role: "admin" });
  } else {
    user = {
      id: uuidv4(), nombre, email: email.toLowerCase(),
      passwordHash: await hashPassword(password), role: "admin",
      createdAt: new Date().toISOString()
    };
    store.createUser(user);
  }
  const jwtToken = signToken(user);
  res.json({ token: jwtToken, user: { id: user.id, nombre: user.nombre, email: user.email, role: user.role } });
});

// =========================================================================
// Panel de administracion (requiere estar logueado con rol admin)
// =========================================================================

router.get("/admin/pricing-params", requireAdminRole, (req, res) => {
  res.json(store.getPricingParams());
});

router.put("/admin/pricing-params", requireAdminRole, (req, res) => {
  const updated = store.savePricingParams({ ...store.getPricingParams(), ...req.body });
  res.json(updated);
});

router.get("/admin/contacts", requireAdminRole, (req, res) => {
  res.json(store.getContacts());
});

router.get("/admin/orders", requireAdminRole, (req, res) => {
  res.json(store.getOrders());
});

// El admin marca un pedido como pagado (transferencia o efectivo) y deja el
// numero de comprobante como registro interno. Esto NO es una factura fiscal AFIP.
router.post("/admin/orders/:id/mark-paid", requireAdminRole, (req, res) => {
  const { comprobante, notas } = req.body || {};
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  const updated = store.updateOrder(order.id, {
    estado: "pagado",
    comprobanteInterno: comprobante || "",
    notasPago: notas || "",
    marcadoPagadoPor: req.user.email,
    marcadoPagadoEn: new Date().toISOString()
  });
  res.json(updated);
});

router.get("/admin/users", requireAdminRole, (req, res) => {
  res.json(store.getUsers().map(u => ({ id: u.id, nombre: u.nombre, email: u.email, role: u.role, createdAt: u.createdAt })));
});

// Un admin logueado invita/crea a otro administrador
router.post("/admin/users", requireAdminRole, async (req, res) => {
  const { nombre, email, password } = req.body || {};
  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Nombre, email y contraseña son obligatorios." });
  }
  if (store.getUserByEmail(email)) {
    return res.status(409).json({ error: "Ya existe una cuenta con ese email." });
  }
  const user = {
    id: uuidv4(), nombre, email: email.toLowerCase(),
    passwordHash: await hashPassword(password), role: "admin",
    createdAt: new Date().toISOString(), invitadoPor: req.user.email
  };
  store.createUser(user);
  res.json({ id: user.id, nombre: user.nombre, email: user.email, role: user.role });
});

// =========================================================================
// Checkout / Pedidos
// =========================================================================

const DATOS_TRANSFERENCIA = {
  banco: "Completar con tu banco real",
  titular: "LaserTec (completar razon social)",
  cbu: "0000000000000000000000",
  alias: "LASERTEC.CORTE.LASER",
  cuit: "00-00000000-0"
};

router.post("/checkout", async (req, res) => {
  try {
    const { items, cliente, metodoPago } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "El carrito esta vacio" });
    }

    const params = store.getPricingParams();
    const itemsRecalculados = [];

    for (const it of items) {
      const cat = getCategoria(it.categoriaId);
      if (!cat) return res.status(400).json({ error: `Categoria invalida: ${it.categoriaId}` });

      const resultado = calcularPrecio(params, it.seleccion);
      if (resultado.error) {
        return res.status(400).json({ error: `Item invalido (${cat.nombre}): ${resultado.error}` });
      }

      itemsRecalculados.push({
        categoriaId: cat.id,
        categoriaNombre: cat.nombre,
        forma: it.seleccion.forma,
        espesor: it.seleccion.espesor,
        ancho: it.seleccion.ancho,
        largo: it.seleccion.largo,
        agujeros: it.seleccion.agujeros,
        terminacion: it.seleccion.terminacion,
        extras: it.seleccion.extras || {},
        cantidad: Number(it.cantidad) || 1,
        precioUnitario: resultado.precioFinal,
        precioTotal: round2(resultado.precioFinal * (Number(it.cantidad) || 1))
      });
    }

    const total = round2(itemsRecalculados.reduce((acc, it) => acc + it.precioTotal, 0));

    // Si hay un usuario logueado (token opcional en este endpoint), asociamos el pedido
    let userId = null;
    const header = req.headers.authorization || "";
    if (header.startsWith("Bearer ")) {
      const { verifyToken } = require("./auth");
      const payload = verifyToken(header.slice(7));
      if (payload) userId = payload.sub;
    }

    const metodo = ["mercadopago", "transferencia", "efectivo"].includes(metodoPago) ? metodoPago : "mercadopago";

    const order = {
      id: uuidv4(),
      fecha: new Date().toISOString(),
      userId,
      cliente: cliente || {},
      items: itemsRecalculados,
      total,
      metodoPago: metodo,
      datosTransferencia: metodo === "transferencia" ? DATOS_TRANSFERENCIA : null,
      estado: metodo === "mercadopago" ? "pendiente_pago" : `pendiente_${metodo}`
    };
    store.saveOrder(order);

    if (metodo === "mercadopago") {
      const pref = await mp.crearPreferencia(order);
      store.updateOrder(order.id, { mercadoPagoPreferenceId: pref.preferenceId });
      return res.json({
        orderId: order.id,
        total: order.total,
        metodoPago: metodo,
        initPoint: pref.initPoint,
        sandboxInitPoint: pref.sandboxInitPoint
      });
    }

    // Transferencia o efectivo: no hay redireccion externa, mostramos instrucciones
    res.json({
      orderId: order.id,
      total: order.total,
      metodoPago: metodo,
      datosTransferencia: metodo === "transferencia" ? DATOS_TRANSFERENCIA : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error interno al generar el pedido" });
  }
});

router.get("/orders/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  res.json(order);
});

// Pedidos del usuario logueado ("Mis pedidos")
router.get("/my/orders", requireAuth, (req, res) => {
  const orders = store.getOrders().filter(o => o.userId === req.user.sub);
  res.json(orders);
});

// Mercado Pago llama aca cuando cambia el estado de un pago
router.post("/payments/webhook", async (req, res) => {
  try {
    const { type, data } = req.body;
    if (type === "payment" && data?.id) {
      const pago = await mp.consultarPago(data.id);
      const orderId = pago.external_reference;
      if (orderId) {
        const estado = pago.status === "approved" ? "pagado"
          : pago.status === "rejected" ? "rechazado"
          : "pendiente_pago";
        store.updateOrder(orderId, { estado, mercadoPagoPaymentId: pago.id });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error("Error en webhook de pagos:", err.message);
    res.sendStatus(200);
  }
});

// =========================================================================
// Formulario de contacto
// =========================================================================

router.post("/contact", (req, res) => {
  const { nombre, email, telefono, mensaje } = req.body || {};
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: "Nombre, email y mensaje son obligatorios." });
  }
  const contact = {
    id: uuidv4(),
    fecha: new Date().toISOString(),
    nombre, email, telefono: telefono || "", mensaje
  };
  store.saveContact(contact);
  res.json({ ok: true });
});

module.exports = router;
