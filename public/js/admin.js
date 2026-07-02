const estadoClase = (e) => e === "pagado" ? "pagado" : e === "rechazado" ? "rechazado" : "pendiente";

async function initAdmin() {
  const auth = getAuth();
  const guard = document.getElementById("guard");
  const panel = document.getElementById("panel");

  if (!auth?.token) {
    guard.innerHTML = `<div class="alert error">Tenes que <a href="/login.html" style="color:var(--beam)">iniciar sesion</a> como administrador.</div>`;
    return;
  }
  if (auth.user.role !== "admin") {
    guard.innerHTML = `<div class="alert error">Tu cuenta no tiene permisos de administrador.</div>`;
    return;
  }

  panel.style.display = "block";
  setupTabs();
  loadPedidos();
  loadPrecios();
  loadContactos();
  loadAdmins();
}

function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      btn.classList.add("active");
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");
    });
  });
}

// ---------- Pedidos ----------
async function loadPedidos() {
  const el = document.getElementById("pedidos-content");
  const res = await authFetch("/api/admin/orders");
  if (!res.ok) { el.innerHTML = `<div class="alert error">No se pudieron cargar los pedidos.</div>`; return; }
  const orders = (await res.json()).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  if (orders.length === 0) { el.innerHTML = `<p style="color:var(--text-1)">Todavia no hay pedidos.</p>`; return; }

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Fecha</th><th>Cliente</th><th>Items</th><th>Metodo</th><th>Estado</th><th>Total</th><th>Accion</th></tr></thead>
      <tbody>
        ${orders.map(o => `
          <tr>
            <td>${new Date(o.fecha).toLocaleString("es-AR")}</td>
            <td>${o.cliente?.nombre || "-"}<br><span style="color:var(--text-2);font-size:.78rem">${o.cliente?.email || ""}</span></td>
            <td>${o.items.map(i => `${i.categoriaNombre} x${i.cantidad}`).join(", ")}</td>
            <td class="mono">${o.metodoPago || "mercadopago"}</td>
            <td><span class="status-pill ${estadoClase(o.estado)}">${o.estado.replace(/_/g," ")}</span>${o.comprobanteInterno ? `<br><span style="color:var(--text-2);font-size:.75rem">Comp: ${o.comprobanteInterno}</span>` : ""}</td>
            <td class="mono">$${o.total.toLocaleString("es-AR")}</td>
            <td>${o.estado !== "pagado" ? `<button class="btn btn-outline" style="padding:8px 12px;font-size:.72rem" data-mark-paid="${o.id}">Marcar pagado</button>` : "—"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  el.querySelectorAll("[data-mark-paid]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const comprobante = prompt("Numero de comprobante / transferencia (opcional):") || "";
      const res = await authFetch(`/api/admin/orders/${btn.dataset.markPaid}/mark-paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comprobante })
      });
      if (res.ok) loadPedidos();
      else alert("No se pudo marcar el pedido como pagado.");
    });
  });
}

// ---------- Parametros de precio ----------
async function loadPrecios() {
  const el = document.getElementById("precios-content");
  const res = await authFetch("/api/admin/pricing-params");
  if (!res.ok) { el.innerHTML = `<div class="alert error">No se pudieron cargar los parametros.</div>`; return; }
  const p = await res.json();

  el.innerHTML = `
    <div class="field-row">
      <div class="field"><label>Precio de chapa ($/kg)</label><input type="number" id="p-preciokg" value="${p.precioKg}"></div>
      <div class="field"><label>Densidad (kg/m3)</label><input type="number" id="p-densidad" value="${p.densidad}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>% Desperdicio</label><input type="number" step="0.01" id="p-desperdicio" value="${p.desperdicio}"></div>
      <div class="field"><label>Costo por minuto de maquina ($)</label><input type="number" id="p-costomin" value="${p.costoMinMaquina}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Costo consumibles por metro ($)</label><input type="number" id="p-costoconsm" value="${p.costoConsumiblesM}"></div>
      <div class="field"><label>Tiempo piercing por agujero (min)</label><input type="number" step="0.01" id="p-tiempopiercing" value="${p.tiempoPiercing}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Tiempo de setup (min)</label><input type="number" id="p-tiemposetup" value="${p.tiempoSetup}"></div>
      <div class="field"><label>Costo mano de obra ($/min)</label><input type="number" id="p-costomo" value="${p.costoMinMO}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>% Overhead</label><input type="number" step="0.01" id="p-overhead" value="${p.overhead}"></div>
      <div class="field"><label>% Margen</label><input type="number" step="0.01" id="p-margen" value="${p.margen}"></div>
    </div>
    <div class="field"><label>% IVA</label><input type="number" step="0.01" id="p-iva" value="${p.iva}"></div>
    <button class="btn btn-primary" id="btn-guardar-precios">Guardar cambios</button>
    <p id="precios-msg" style="margin-top:12px"></p>
  `;

  document.getElementById("btn-guardar-precios").addEventListener("click", async () => {
    const body = {
      precioKg: Number(document.getElementById("p-preciokg").value),
      densidad: Number(document.getElementById("p-densidad").value),
      desperdicio: Number(document.getElementById("p-desperdicio").value),
      costoMinMaquina: Number(document.getElementById("p-costomin").value),
      costoConsumiblesM: Number(document.getElementById("p-costoconsm").value),
      tiempoPiercing: Number(document.getElementById("p-tiempopiercing").value),
      tiempoSetup: Number(document.getElementById("p-tiemposetup").value),
      costoMinMO: Number(document.getElementById("p-costomo").value),
      overhead: Number(document.getElementById("p-overhead").value),
      margen: Number(document.getElementById("p-margen").value),
      iva: Number(document.getElementById("p-iva").value)
    };
    const res = await authFetch("/api/admin/pricing-params", {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    document.getElementById("precios-msg").innerHTML = res.ok
      ? `<span style="color:var(--ok)">Guardado. El catalogo ya usa estos valores.</span>`
      : `<span style="color:var(--accent)">Error al guardar.</span>`;
  });
}

// ---------- Consultas de contacto ----------
async function loadContactos() {
  const el = document.getElementById("contactos-content");
  const res = await authFetch("/api/admin/contacts");
  if (!res.ok) { el.innerHTML = `<div class="alert error">No se pudieron cargar las consultas.</div>`; return; }
  const contacts = (await res.json()).sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  if (contacts.length === 0) { el.innerHTML = `<p style="color:var(--text-1)">No hay consultas todavia.</p>`; return; }
  el.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Fecha</th><th>Nombre</th><th>Contacto</th><th>Mensaje</th></tr></thead>
      <tbody>
        ${contacts.map(c => `
          <tr>
            <td>${new Date(c.fecha).toLocaleString("es-AR")}</td>
            <td>${c.nombre}</td>
            <td>${c.email}<br>${c.telefono || ""}</td>
            <td>${c.mensaje}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

// ---------- Administradores ----------
async function loadAdmins() {
  const el = document.getElementById("admins-content");
  const res = await authFetch("/api/admin/users");
  if (!res.ok) { el.innerHTML = `<div class="alert error">No se pudieron cargar los usuarios.</div>`; return; }
  const users = await res.json();
  const admins = users.filter(u => u.role === "admin");

  el.innerHTML = `
    <table class="admin-table">
      <thead><tr><th>Nombre</th><th>Email</th><th>Desde</th></tr></thead>
      <tbody>
        ${admins.map(u => `<tr><td>${u.nombre}</td><td>${u.email}</td><td>${new Date(u.createdAt).toLocaleDateString("es-AR")}</td></tr>`).join("")}
      </tbody>
    </table>
    <hr class="cutline" style="margin:24px 0">
    <h3>Invitar nuevo administrador</h3>
    <div id="invite-msg"></div>
    <div class="field-row">
      <div class="field"><label>Nombre</label><input type="text" id="inv-nombre"></div>
      <div class="field"><label>Email</label><input type="email" id="inv-email"></div>
    </div>
    <div class="field"><label>Contraseña temporal</label><input type="password" id="inv-password"></div>
    <button class="btn btn-primary" id="btn-invitar">Crear administrador</button>
  `;

  document.getElementById("btn-invitar").addEventListener("click", async () => {
    const body = {
      nombre: document.getElementById("inv-nombre").value.trim(),
      email: document.getElementById("inv-email").value.trim(),
      password: document.getElementById("inv-password").value
    };
    const res = await authFetch("/api/admin/users", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const data = await res.json();
    document.getElementById("invite-msg").innerHTML = res.ok
      ? `<div class="alert ok">Administrador creado. Decile que inicie sesion con ese email y contraseña.</div>`
      : `<div class="alert error">${data.error}</div>`;
    if (res.ok) loadAdmins();
  });
}

initAdmin();
