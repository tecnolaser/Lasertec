const params = new URLSearchParams(location.search);
const catId = params.get("cat");

let categoria = null;
let ultimoPrecio = null;

function selectHTML(id, label, opciones, { placeholder = "Elegir..." } = {}) {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <select id="${id}" name="${id}">
        <option value="">${placeholder}</option>
        ${opciones.map(o => `<option value="${o}">${o}</option>`).join("")}
      </select>
    </div>`;
}

function numberHTML(id, label, placeholder = "") {
  return `
    <div class="field">
      <label for="${id}">${label}</label>
      <input type="number" id="${id}" name="${id}" placeholder="${placeholder}">
    </div>`;
}

async function cargarCategoria() {
  if (!catId) {
    document.getElementById("alert-box").innerHTML = `<div class="alert error">No se indico ninguna categoria.</div>`;
    return;
  }
  const res = await fetch(`/api/categorias/${catId}`);
  if (!res.ok) {
    document.getElementById("alert-box").innerHTML = `<div class="alert error">Categoria no encontrada.</div>`;
    return;
  }
  categoria = await res.json();
  document.getElementById("cat-eyebrow").textContent = `Categoria · ${categoria.formas.length} formas`;
  document.getElementById("cat-titulo").textContent = `${categoria.icono}  ${categoria.nombre}`;
  document.title = `${categoria.nombre} — LaserTec`;
  renderForm();
}

function renderForm() {
  const u = categoria.listasUniversales;
  let html = "";
  html += selectHTML("forma", "Forma", categoria.formas);
  html += `<div class="field-row">`;
  html += selectHTML("espesor", "Espesor", u.espesores);
  html += selectHTML("agujeros", "Cant. de agujeros", u.agujeros);
  html += `</div>`;
  html += `<div class="field-row">`;
  html += numberHTML("ancho", "Ancho (mm)", "Ej: 100");
  html += numberHTML("largo", "Largo (mm)", "Ej: 200");
  html += `</div>`;
  html += `<div class="field-row">`;
  html += selectHTML("diametro", "Diametro de agujero", u.diametros);
  html += selectHTML("material", "Material", u.materiales);
  html += `</div>`;
  html += selectHTML("terminacion", "Terminacion / proteccion", u.terminaciones);

  if (categoria.extras.length) {
    html += `<hr class="cutline" style="margin:32px 0"><p class="mono" style="font-size:.72rem;color:var(--text-2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:16px">Filtros especificos de ${categoria.nombre}</p>`;
    categoria.extras.forEach(ex => {
      if (ex.kind === "list") html += selectHTML(`extra_${ex.key}`, ex.label, ex.options);
      else html += numberHTML(`extra_${ex.key}`, ex.label);
    });
  }

  document.getElementById("form-fields").innerHTML = html;
  document.getElementById("config-form").addEventListener("input", debounce(intentarCotizar, 350));
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

function leerSeleccion() {
  const f = document.getElementById("config-form");
  const get = id => f.querySelector(`#${id}`)?.value || "";
  const extras = {};
  categoria.extras.forEach(ex => extras[ex.key] = get(`extra_${ex.key}`));
  return {
    forma: get("forma"),
    espesor: get("espesor"),
    ancho: get("ancho"),
    largo: get("largo"),
    agujeros: get("agujeros"),
    diametro: get("diametro"),
    material: get("material"),
    terminacion: get("terminacion"),
    extras
  };
}

async function intentarCotizar() {
  const sel = leerSeleccion();
  const box = document.getElementById("breakdown");
  const btn = document.getElementById("btn-add-cart");

  if (!sel.ancho || !sel.largo || !sel.espesor) {
    box.innerHTML = `<p class="price-hint">Completa forma, espesor, ancho, largo y agujeros para ver el precio.</p>`;
    btn.disabled = true;
    ultimoPrecio = null;
    return;
  }

  box.innerHTML = `<p class="price-hint"><span class="spinner"></span> Calculando...</p>`;

  const res = await fetch("/api/quote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ categoriaId: catId, seleccion: sel })
  });
  const data = await res.json();

  if (data.error) {
    box.innerHTML = `<div class="alert error">${data.error}</div>`;
    btn.disabled = true;
    ultimoPrecio = null;
    return;
  }

  ultimoPrecio = data;
  box.innerHTML = `
    <div class="breakdown-row"><span>Material</span><span>$${data.costoMaterial.toLocaleString("es-AR")}</span></div>
    <div class="breakdown-row"><span>Corte laser</span><span>$${data.costoCorte.toLocaleString("es-AR")}</span></div>
    <div class="breakdown-row"><span>Perforado</span><span>$${data.costoPiercing.toLocaleString("es-AR")}</span></div>
    <div class="breakdown-row"><span>Mano de obra</span><span>$${data.costoManoObra.toLocaleString("es-AR")}</span></div>
    <div class="breakdown-row"><span>Terminacion</span><span>$${data.costoTerminacion.toLocaleString("es-AR")}</span></div>
    <div class="breakdown-row total"><span>Precio unitario</span><span>$${data.precioFinal.toLocaleString("es-AR")}</span></div>
    <p class="price-hint">Peso estimado: ${data.peso} kg · Incluye gastos fijos, margen e IVA</p>
  `;
  btn.disabled = false;
}

document.getElementById("btn-add-cart").addEventListener("click", () => {
  if (!ultimoPrecio) return;
  const sel = leerSeleccion();
  const cantidad = Number(document.getElementById("cantidad").value) || 1;
  addToCart({
    categoriaId: catId,
    categoriaNombre: categoria.nombre,
    seleccion: sel,
    forma: sel.forma || "(sin forma)",
    espesor: sel.espesor,
    cantidad,
    precioUnitario: ultimoPrecio.precioFinal
  });
  document.getElementById("alert-box").innerHTML = `<div class="alert ok">Pieza agregada al carrito. <a href="/carrito.html" style="color:var(--beam)">Ver carrito →</a></div>`;
});

cargarCategoria();
