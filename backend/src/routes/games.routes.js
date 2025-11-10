//busqueda inteligente
router.get('/search-codes', async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json([]);
  // ejemplo MySQL/MariaDB
  const rows = await db.query(
    'SELECT code, title FROM games WHERE code LIKE CONCAT(?, "%") OR title LIKE CONCAT("%", ?, "%") LIMIT 10',
    [q, q]
  );
  res.json(rows);
});

// en top: const multer = require('multer'); const fs = require('fs'); const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const code = req.params.code;
    const dir = path.join(__dirname, 'uploads', code);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, file.originalname.replace(/\s+/g,'_'))
});
const upload = multer({ storage });

// GET lista
router.get('/:code/images', (req,res) => {
  const dir = path.join(__dirname, 'uploads', req.params.code);
  if (!fs.existsSync(dir)) return res.json([]);
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpe?g|webp)$/i.test(f));
  res.json(files);
});

// POST subir (multi)
router.post('/:code/images', upload.array('images', 12), (req,res) => {
  res.json({ ok:true, files: (req.files||[]).map(f=>f.filename) });
});

// DELETE una imagen
router.delete('/:code/images/:file', (req,res) => {
  const file = path.basename(req.params.file);
  const p = path.join(__dirname, 'uploads', req.params.code, file);
  if (fs.existsSync(p)) fs.unlinkSync(p);
  res.json({ ok:true });
});
