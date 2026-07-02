function renderCart() {
  const cart = getCart();
  const el = document.getElementById("cart-content");

  if (cart.length === 0) {
    el.innerHTML = `
      <div class="cart-empty">
        <p>Todavia no agregaste ninguna pieza.</p>
        <a href="/#categorias" class="btn btn-outline">Ver categorias</a>
      </div>`;
    return;
  }

  const filas = cart.map(item => `
    <tr>
      <td>
        <strong>${item.categoriaNombre}</strong><br>
        <span class="item-meta">${item.forma} · ${item.espesor} · ${item.seleccion.ancho}x${item.seleccion.largo}mm · ${item.seleccion.agujeros} agujero(s) · ${item.seleccion.terminacion || "Sin proteccion"}</span>
      </td>
      <td class="mono">$${Number(item.precioUnitario).toLocaleString("es-AR")}</td>
      <td><input type="number" min="1" value="${item.cantidad}" data-cart-id="${item.cartId}" class="qty-input" style="width:70px;background:var(--bg-0);border:1px solid var(--line);color:var(--text-0);padding:8px"></td>
      <td class="mono">$${(item.precioUnitario * item.cantidad).toLocaleString("es-AR")}</td>
      <td><button class="btn btn-ghost" data-remove="${item.cartId}">Quitar</button></td>
    </tr>
  `).join("");

  el.innerHTML = `
    <table class="cart-table">
      <thead>
        <tr><th>Pieza</th><th>Precio unit.</th><th>Cant.</th><th>Subtotal</th><th></th></tr>
      </thead>
      <tbody>${filas}</tbody>
    </table>

    <div class="cart-summary blueprint">
      <div class="bp-tr"></div><div class="bp-bl"></div>
      <div class="breakdown-row total"><span>Total</span><span>$${cartTotal().toLocaleString("es-AR")}</span></div>

      <div class="field" style="margin-top:24px">
        <label for="nombre">Nombre / Razon social</label>
        <input type="text" id="nombre" placeholder="Tu empresa S.A.">
      </div>
      <div class="field">
        <label for="email">Email</label>
        <input type="email" id="email" placeholder="compras@tuempresa.com">
      </div>

      <button class="btn btn-primary" id="btn-pagar" style="width:100%;justify-content:center;margin-top:8px">
        Pagar con Mercado Pago
      </button>
      <p class="price-hint">El precio se vuelve a calcular en el servidor antes de generar el pago, con los costos vigentes.</p>
    </div>
  `;

  el.querySelectorAll(".qty-input").forEach(inp => {
    inp.addEventListener("change", () => {
      updateCartQty(inp.dataset.cartId, Number(inp.value));
      renderCart();
    });
  });
  el.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      removeFromCart(btn.dataset.remove);
      renderCart();
    });
  });

  document.getElementById("btn-pagar").addEventListener("click", pagar);
}

async function pagar() {
  const btn = document.getElementById("btn-pagar");
  const alertBox = document.getElementById("alert-box");
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();

  if (!email) {
    alertBox.innerHTML = `<div class="alert error">Ingresa un email de contacto para continuar.</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Generando pago...`;

  const items = getCart().map(i => ({
    categoriaId: i.categoriaId,
    seleccion: i.seleccion,
    cantidad: i.cantidad
  }));

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, cliente: { nombre, email } })
    });
    const data = await res.json();

    if (!res.ok) {
      alertBox.innerHTML = `<div class="alert error">${data.error || "No se pudo generar el pago."}</div>`;
      btn.disabled = false;
      btn.textContent = "Pagar con Mercado Pago";
      return;
    }

    // sandboxInitPoint sirve para probar con un Access Token de TEST-.
    // En produccion, con tu Access Token real, usa initPoint.
    window.location.href = data.sandboxInitPoint || data.initPoint;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert error">Error de conexion con el servidor.</div>`;
    btn.disabled = false;
    btn.textContent = "Pagar con Mercado Pago";
  }
}

renderCart();
