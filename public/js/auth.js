// Autenticacion compartida. El token JWT se guarda en localStorage del navegador
// (es un token de sesion, no datos sensibles como contraseñas).

const AUTH_KEY = "lasertec_auth";

function getAuth() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_KEY));
  } catch {
    return null;
  }
}

function saveAuth(token, user) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ token, user }));
  renderAuthSlot();
}

function logout() {
  localStorage.removeItem(AUTH_KEY);
  location.href = "/";
}

function authHeaders() {
  const auth = getAuth();
  return auth?.token ? { Authorization: `Bearer ${auth.token}` } : {};
}

async function authFetch(url, options = {}) {
  const headers = { ...(options.headers || {}), ...authHeaders() };
  return fetch(url, { ...options, headers });
}

function renderAuthSlot() {
  const slot = document.querySelector("[data-auth-slot]");
  if (!slot) return;
  const auth = getAuth();
  if (!auth?.user) {
    slot.innerHTML = `<a href="/login.html">Iniciar sesion</a>`;
    return;
  }
  const adminLink = auth.user.role === "admin" ? `<a href="/admin.html">Panel admin</a>` : "";
  slot.innerHTML = `
    <a href="/mi-cuenta.html">Hola, ${auth.user.nombre.split(" ")[0]}</a>
    ${adminLink}
    <a href="#" data-logout>Salir</a>
  `;
  slot.querySelector("[data-logout]")?.addEventListener("click", (e) => { e.preventDefault(); logout(); });
}

document.addEventListener("DOMContentLoaded", renderAuthSlot);
