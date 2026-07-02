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

      <div class="field">
        <label>Metodo de pago</label>
        <div class="payment-options" id="payment-options">
          <label class="payment-option selected">
            <input type="radio" name="metodoPago" value="mercadopago" checked>
            <div><h4>Mercado Pago</h4><p>Tarjeta, debito, dinero en cuenta. Acreditacion inmediata.</p></div>
          </label>
          <label class="payment-option">
            <input type="radio" name="metodoPago" value="transferencia">
            <div><h4>Transferencia bancaria</h4><p>Te mostramos los datos y coordinamos el envio al acreditarse.</p></div>
          </label>
          <label class="payment-option">
            <input type="radio" name="metodoPago" value="efectivo">
            <div><h4>Efectivo</h4><p>A coordinar en el retiro o la entrega.</p></div>
          </label>
        </div>
      </div>

      <button class="btn btn-primary" id="btn-pagar" style="width:100%;justify-content:center">
        Confirmar pedido
      </button>
      <p class="price-hint">El precio se vuelve a calcular en el servidor antes de confirmar, con los costos vigentes.</p>
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
  el.querySelectorAll('input[name="metodoPago"]').forEach(radio => {
    radio.addEventListener("change", () => {
      el.querySelectorAll(".payment-option").forEach(o => o.classList.remove("selected"));
      radio.closest(".payment-option").classList.add("selected");
    });
  });

  document.getElementById("btn-pagar").addEventListener("click", confirmarPedido);
}

async function confirmarPedido() {
  const btn = document.getElementById("btn-pagar");
  const alertBox = document.getElementById("alert-box");
  const nombre = document.getElementById("nombre").value.trim();
  const email = document.getElementById("email").value.trim();
  const metodoPago = document.querySelector('input[name="metodoPago"]:checked').value;

  if (!email) {
    alertBox.innerHTML = `<div class="alert error">Ingresa un email de contacto para continuar.</div>`;
    return;
  }

  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Procesando...`;

  const items = getCart().map(i => ({
    categoriaId: i.categoriaId,
    seleccion: i.seleccion,
    cantidad: i.cantidad
  }));

  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(typeof authHeaders === "function" ? authHeaders() : {}) },
      body: JSON.stringify({ items, cliente: { nombre, email }, metodoPago })
    });
    const data = await res.json();

    if (!res.ok) {
      alertBox.innerHTML = `<div class="alert error">${data.error || "No se pudo generar el pedido."}</div>`;
      btn.disabled = false;
      btn.textContent = "Confirmar pedido";
      return;
    }

    if (data.metodoPago === "mercadopago") {
      window.location.href = data.sandboxInitPoint || data.initPoint;
      return;
    }

    // Transferencia o efectivo: no hay pasarela externa, mostramos instrucciones
    clearCart();
    window.location.href = `/orden-confirmada.html?order=${data.orderId}`;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert error">Error de conexion con el servidor.</div>`;
    btn.disabled = false;
    btn.textContent = "Confirmar pedido";
  }
}

renderCart();
