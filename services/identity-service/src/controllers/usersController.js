const { Router } = require('express');
const router = Router();
const usersModel = require('../models/usersModel');

// Obtener todos los usuarios
router.get('/users', async (req, res) => {
  try {
    const users = await usersModel.getUsers();
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener los usuarios");
  }
});

// Obtener un usuario por ID
router.get('/users/:id', async (req, res) => {
  try {
    const user = await usersModel.getUserById(req.params.id);
    if (!user) return res.status(404).send("Usuario no encontrado");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al obtener el usuario");
  }
});

// Crear usuario
router.post('/users', async (req, res) => {
  const { name, email, username, password, role } = req.body;

  if (!name || !email || !username || !password) {
    return res.status(400).send("Faltan datos requeridos");
  }

  try {
    await usersModel.createUser(name, email, username, password, role);
    res.status(201).json({ mensaje: "Usuario creado exitosamente" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al crear el usuario");
  }
});

// Actualizar usuario
router.put('/users/:id', async (req, res) => {
  const { name, email, role } = req.body;

  try {
    await usersModel.updateUser(req.params.id, name, email, role);
    res.json({ mensaje: "Usuario actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al actualizar el usuario");
  }
});

// Eliminar usuario
router.delete('/users/:id', async (req, res) => {
  try {
    await usersModel.deleteUser(req.params.id);
    res.json({ mensaje: "Usuario eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al eliminar el usuario");
  }
});

// Login (validar credenciales)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await usersModel.validateUser(username, password);
    if (!user) return res.status(401).send("Credenciales inválidas");

    res.json({
      mensaje: "Login exitoso",
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error al validar las credenciales");
  }
});

module.exports = router;

