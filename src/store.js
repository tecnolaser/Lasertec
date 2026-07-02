// Almacenamiento basado en archivos JSON (data/*.json).
// Esto es INTENTIONALMENTE simple para que el proyecto corra sin instalar una base
// de datos aparte. Para produccion real con trafico serio, migra esto a Postgres/Mongo
// (la interfaz de estas funciones no cambiaria, solo la implementacion interna).

const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const PARAMS_FILE = path.join(DATA_DIR, "pricing-params.json");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const CONTACTS_FILE = path.join(DATA_DIR, "contacts.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DEFAULT_PARAMS = {
  densidad: 7850,
  precioKg: 1200,
  desperdicio: 0.15,
  velocidadPorEspesor: {
    "3 mm": 3000, "4 mm": 2500, "5 mm": 2200, "6 mm": 1900, "8 mm": 1500,
    "10 mm": 1200, "12 mm": 900, "16 mm": 600, "18 mm": 450
  },
  costoMinMaquina: 150,
  costoConsumiblesM: 80,
  tiempoPiercing: 0.15,
  tiempoSetup: 5,
  costoMinMO: 40,
  terminacionCostoKg: {
    "Sin proteccion": 0, "Antioxido sintetico": 150, "Antioxido epoxi": 220,
    "Esmalte sintetico RAL": 280, "Epoxi bicomponente": 350, "Poliuretanico": 420,
    "Galvanizado en caliente": 500, "Zincado": 300, "Metalizado": 600
  },
  overhead: 0.15,
  margen: 0.30,
  iva: 0.21
};

function getPricingParams() {
  if (!fs.existsSync(PARAMS_FILE)) {
    fs.writeFileSync(PARAMS_FILE, JSON.stringify(DEFAULT_PARAMS, null, 2));
    return DEFAULT_PARAMS;
  }
  return JSON.parse(fs.readFileSync(PARAMS_FILE, "utf-8"));
}

function savePricingParams(params) {
  fs.writeFileSync(PARAMS_FILE, JSON.stringify(params, null, 2));
  return params;
}

function getOrders() {
  if (!fs.existsSync(ORDERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
}

function saveOrder(order) {
  const orders = getOrders();
  orders.push(order);
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return order;
}

function updateOrder(id, patch) {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === id);
  if (idx === -1) return null;
  orders[idx] = { ...orders[idx], ...patch };
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  return orders[idx];
}

function getOrder(id) {
  return getOrders().find(o => o.id === id) || null;
}

function getContacts() {
  if (!fs.existsSync(CONTACTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(CONTACTS_FILE, "utf-8"));
}

function saveContact(contact) {
  const contacts = getContacts();
  contacts.push(contact);
  fs.writeFileSync(CONTACTS_FILE, JSON.stringify(contacts, null, 2));
  return contact;
}

function getUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8"));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserByEmail(email) {
  return getUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function getUserById(id) {
  return getUsers().find(u => u.id === id) || null;
}

function createUser(user) {
  const users = getUsers();
  users.push(user);
  saveUsers(users);
  return user;
}

function updateUser(id, patch) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return null;
  users[idx] = { ...users[idx], ...patch };
  saveUsers(users);
  return users[idx];
}

function anyAdminExists() {
  return getUsers().some(u => u.role === "admin");
}

module.exports = {
  getPricingParams, savePricingParams,
  getOrders, saveOrder, updateOrder, getOrder,
  getContacts, saveContact,
  getUsers, getUserByEmail, getUserById, createUser, updateUser, anyAdminExists,
  DEFAULT_PARAMS
};
