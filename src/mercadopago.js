// Integracion con Mercado Pago - Checkout Pro.
// Documentacion: https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing
//
// Necesitas un Access Token (de prueba o de produccion) en la variable de entorno
// MP_ACCESS_TOKEN. Con un token de TEST (empieza con TEST-) todo el flujo funciona
// en modo sandbox, sin mover dinero real. Cuando tengas tu cuenta de Mercado Pago
// verificada, reemplazas por el Access Token de produccion y no hay que tocar codigo.

const axios = require("axios");

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN || "";
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function crearPreferencia(order) {
  if (!MP_ACCESS_TOKEN) {
    throw new Error("Falta configurar MP_ACCESS_TOKEN en el archivo .env");
  }

  const items = order.items.map(it => ({
    title: `${it.categoriaNombre} - ${it.forma} - ${it.espesor}`,
    quantity: it.cantidad,
    unit_price: Number(it.precioUnitario),
    currency_id: "ARS"
  }));

  const body = {
    items,
    external_reference: order.id,
    back_urls: {
      success: `${BASE_URL}/success.html?order=${order.id}`,
      failure: `${BASE_URL}/failure.html?order=${order.id}`,
      pending: `${BASE_URL}/pending.html?order=${order.id}`
    },
    auto_return: "approved",
    notification_url: `${BASE_URL}/api/payments/webhook`,
    payer: {
      name: order.cliente?.nombre || "",
      email: order.cliente?.email || ""
    }
  };

  const { data } = await axios.post(
    "https://api.mercadopago.com/checkout/preferences",
    body,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
  );

  // init_point = produccion, sandbox_init_point = pruebas con token TEST-
  return {
    preferenceId: data.id,
    initPoint: data.init_point,
    sandboxInitPoint: data.sandbox_init_point
  };
}

async function consultarPago(paymentId) {
  const { data } = await axios.get(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    { headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` } }
  );
  return data;
}

module.exports = { crearPreferencia, consultarPago };
