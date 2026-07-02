document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("btn-enviar");
  const alertBox = document.getElementById("alert-box");

  const payload = {
    nombre: document.getElementById("nombre").value.trim(),
    email: document.getElementById("email").value.trim(),
    telefono: document.getElementById("telefono").value.trim(),
    mensaje: document.getElementById("mensaje").value.trim()
  };

  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (!res.ok) {
      alertBox.innerHTML = `<div class="alert error">${data.error || "No se pudo enviar la consulta."}</div>`;
      btn.disabled = false;
      btn.textContent = "Enviar consulta";
      return;
    }

    alertBox.innerHTML = `<div class="alert ok">Gracias, recibimos tu consulta. Te vamos a contactar a la brevedad.</div>`;
    document.getElementById("contact-form").reset();
    btn.textContent = "Enviar consulta";
    btn.disabled = false;
  } catch (err) {
    alertBox.innerHTML = `<div class="alert error">Error de conexion. Intenta de nuevo o escribinos por WhatsApp.</div>`;
    btn.disabled = false;
    btn.textContent = "Enviar consulta";
  }
});
