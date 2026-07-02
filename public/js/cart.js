// Carrito guardado en localStorage del navegador.
// Nota: el precio que viaja aca es solo para mostrar en pantalla.
// El backend SIEMPRE recalcula el precio real al momento de pagar (ver /api/checkout),
// asi que nadie puede alterar el precio editando el navegador.

const CART_KEY = "lasertec_cart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  updateCartBadge();
}

function addToCart(item) {
  const cart = getCart();
  cart.push({ ...item, cartId: crypto.randomUUID() });
  saveCart(cart);
}

function removeFromCart(cartId) {
  saveCart(getCart().filter(i => i.cartId !== cartId));
}

function updateCartQty(cartId, cantidad) {
  const cart = getCart().map(i => i.cartId === cartId ? { ...i, cantidad: Math.max(1, cantidad) } : i);
  saveCart(cart);
}

function clearCart() {
  saveCart([]);
}

function cartCount() {
  return getCart().reduce((acc, i) => acc + Number(i.cantidad || 1), 0);
}

function cartTotal() {
  return getCart().reduce((acc, i) => acc + (Number(i.precioUnitario) * Number(i.cantidad || 1)), 0);
}

function updateCartBadge() {
  const el = document.querySelector("[data-cart-count]");
  if (el) el.textContent = cartCount();
}

document.addEventListener("DOMContentLoaded", updateCartBadge);
