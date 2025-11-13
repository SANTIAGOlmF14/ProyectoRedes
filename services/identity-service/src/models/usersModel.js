
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gamehub' // tu base de datos de pruebas
});

// Obtener todos los usuarios
async function getUsers() {
  const [rows] = await db.query('SELECT id, username, name, email, role, created_at, updated_at FROM users');
  return rows;
}

// Obtener un usuario por ID
async function getUserById(id) {
  const [rows] = await db.query('SELECT id, username, name, email, role, created_at, updated_at FROM users WHERE id = ?', [id]);
  return rows[0];
}

// Crear un usuario
async function createUser(name, email, username, password, role = 'user') {
  const hashedPassword = await bcrypt.hash(password, 10);
  const query = `
    INSERT INTO users (name, email, username, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [name, email, username, hashedPassword, role]);
  return result;
}

// Actualizar datos de usuario
async function updateUser(id, name, email, role) {
  const query = `
    UPDATE users
    SET name = ?, email = ?, role = ?
    WHERE id = ?
  `;
  const [result] = await db.query(query, [name, email, role, id]);
  return result;
}

// Eliminar un usuario
async function deleteUser(id) {
  const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
  return result;
}

// Validar credenciales (login)
async function validateUser(username, password) {
  const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user) return null;

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) return null;

  // No devolvemos el hash
  delete user.password_hash;
  return user;
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  validateUser
};
