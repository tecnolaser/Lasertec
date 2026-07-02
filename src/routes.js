const express = require("express");
const { v4: uuidv4 } = require("uuid");

const { CATEGORIAS, ESPESORES, AGUJEROS, DIAMETROS, MATERIALES, TERMINACIONES, getCategoria } = require("./categories");
const { calcularPrecio } = require("./pricingEngine");
const store = require("./store");
const mp = require("./mercadopago");

const router = express.Router();

// ---------- Categorias ----------

// Lista liviana para el home
router.get("/categorias", (req, res) => {
  res.json(CATEGORIAS.map(c => ({ id: c.id, nombre: c.nombre, icono: c.icono, cantidadFormas: c.formas.length })));
});

// Config completa de una categoria (formas + filtros + listas universales) para armar el formulario
router.get("/categorias/:id", (req, res) => {
  const cat = getCategoria(req.params.id);
  if (!cat) return res.status(404).json({ error: "Categoria no encontrada" });
  res.json({
    ...cat,
    listasUniversales: { espesores: ESPESORES, agujeros: AGUJEROS, diametros: DIAMETROS, materiales: MATERIALES, terminaciones: TERMINACIONES }
  });
});

// ---------- Cotizacion ----------

// Calcula el precio de una pieza segun su seleccion. No guarda nada, es solo consulta.
router.post("/quote", (req, res) => {
  const { categoriaId, seleccion } = req.body;
  const cat = getCategoria(categoriaId);
  if (!cat) return res.status(400).json({ error: "Categoria invalida" });

  const params = store.getPricingParams();
  const resultado = calcularPrecio(params, seleccion || {});
  if (resultado.error) return res.status(400).json(resultado);
  res.json(resultado);
});

// ---------- Parametros de cotizacion (panel simple de administracion) ----------

function requireAdmin(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: "No autorizado. Enviar header x-admin-token valido." });
  }
  next();
}

router.get("/admin/pricing-params", requireAdmin, (req, res) => {
  res.json(store.getPricingParams());
});

router.put("/admin/pricing-params", requireAdmin, (req, res) => {
  const updated = store.savePricingParams({ ...store.getPricingParams(), ...req.body });
  res.json(updated);
});

// ---------- Checkout / Pedidos ----------

// El carrito viaja desde el frontend (localStorage) con las selecciones ya hechas.
// ACA se recalcula el precio server-side con los parametros actuales: nunca confiar
// en el precio que mande el navegador.
router.post("/checkout", async (req, res) => {
  try {
    const { items, cliente } = req.body;
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

    const order = {
      id: uuidv4(),
      fecha: new Date().toISOString(),
      cliente: cliente || {},
      items: itemsRecalculados,
      total,
      estado: "pendiente_pago"
    };
    store.saveOrder(order);

    const pref = await mp.crearPreferencia(order);
    store.updateOrder(order.id, { mercadoPagoPreferenceId: pref.preferenceId });

    res.json({
      orderId: order.id,
      total: order.total,
      initPoint: pref.initPoint,
      sandboxInitPoint: pref.sandboxInitPoint
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Error interno al generar el pago" });
  }
});

router.get("/orders/:id", (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: "Pedido no encontrado" });
  res.json(order);
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
    res.sendStatus(200); // Mercado Pago reintenta si no devolvemos 200
  }
});

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = router;
