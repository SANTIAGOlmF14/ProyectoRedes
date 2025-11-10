// ruta para borrar generos
router.delete('/:id', async (req, res) => {
  const { id } = req.params; // id numérico o slug
  await db.query('DELETE FROM genres WHERE id=?', [id]);
  res.json({ ok: true });
});
