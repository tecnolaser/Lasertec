async function cargarCategorias() {
  const grid = document.getElementById("cat-grid");
  try {
    const res = await fetch("/api/categorias");
    const categorias = await res.json();
    grid.innerHTML = categorias.map((c, i) => `
      <a class="cat-card" href="/categoria.html?cat=${c.id}">
        <span class="num">${String(i + 1).padStart(2, "0")}</span>
        <span class="icon">${c.icono}</span>
        <h3>${c.nombre}</h3>
        <span class="formas-count">${c.cantidadFormas} formas disponibles</span>
      </a>
    `).join("");
  } catch (err) {
    grid.innerHTML = `<div class="alert error">No se pudieron cargar las categorias. Verifica que el servidor este corriendo.</div>`;
  }
}

cargarCategorias();
