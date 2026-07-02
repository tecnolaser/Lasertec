// Autenticacion: hash de contraseñas (bcrypt) + tokens de sesion (JWT).
//
// JWT_SECRET tiene que estar en el .env (una clave larga e inventada por vos).
// Si no esta configurada, el servidor usa una por defecto SOLO para que no se
// rompa en desarrollo local -- NUNCA uses esa por defecto en produccion real.

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "cambiar-este-secreto-en-produccion";
const TOKEN_EXPIRY = "30d";

async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

async function checkPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, nombre: user.nombre },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Middleware: exige un usuario logueado (cualquier rol)
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const payload = token && verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Sesion invalida o expirada. Inicia sesion de nuevo." });
  req.user = payload;
  next();
}

// Middleware: exige que el usuario logueado sea admin
function requireAdminRole(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Esta accion es solo para administradores." });
    }
    next();
  });
}

module.exports = { hashPassword, checkPassword, signToken, verifyToken, requireAuth, requireAdminRole };
