const express = require('express');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(express.json());

const DB_DIR = path.join(__dirname, '../data');
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
const DB_PATH = path.join(DB_DIR, 'abpereira_new.sqlite');

// Remove any previous DB if present to create a fresh DB from scratch
try {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
    console.log('Removed existing DB to create a fresh one.');
  }
} catch (e) {
  console.warn('Could not remove existing DB file:', e.message);
}

const db = new sqlite3.Database(DB_PATH);

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve(this);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function initDb() {
  await runAsync(`CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    tag TEXT,
    image TEXT,
    description TEXT,
    full_description TEXT,
    pricing_note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Seed from static JSON if available
  const vistasPath = path.join(__dirname, '../../Vistas/services.json');
  const rootPath = path.join(__dirname, '../../services.json');
  let data = null;
  if (fs.existsSync(vistasPath)) data = JSON.parse(fs.readFileSync(vistasPath, 'utf8'));
  else if (fs.existsSync(rootPath)) data = JSON.parse(fs.readFileSync(rootPath, 'utf8'));

  if (Array.isArray(data) && data.length) {
    for (const s of data) {
      const id = s.id || (s.title || '').toLowerCase().replace(/\s+/g, '_');
      await runAsync(`REPLACE INTO services (id, title, tag, image, description, full_description, pricing_note) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
        id, s.title || '', s.tag || '', s.image || '', s.description || '', s.full_description || s.description || '', s.pricing_note || ''
      ]);
    }
    console.log('Seeded services into new DB:', data.length);
  }
}

app.get('/api/health', (req, res) => res.json({ ok: true, db: fs.existsSync(DB_PATH) }));

app.get('/api/services', async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM services ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/services/:id', async (req, res) => {
  try {
    const rows = await allAsync('SELECT * FROM services WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'not_found' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.post('/api/services', async (req, res) => {
  try {
    const s = req.body;
    const id = s.id || (s.title || Date.now().toString()).toLowerCase().replace(/\s+/g, '_');
    await runAsync(`INSERT INTO services (id, title, tag, image, description, full_description, pricing_note) VALUES (?, ?, ?, ?, ?, ?, ?)`, [
      id, s.title || '', s.tag || '', s.image || '', s.description || '', s.full_description || s.description || '', s.pricing_note || ''
    ]);
    res.status(201).json({ id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.put('/api/services/:id', async (req, res) => {
  try {
    const s = req.body;
    const id = req.params.id;
    await runAsync(`UPDATE services SET title = ?, tag = ?, image = ?, description = ?, full_description = ?, pricing_note = ? WHERE id = ?`, [
      s.title || '', s.tag || '', s.image || '', s.description || '', s.full_description || s.description || '', s.pricing_note || '', id
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.delete('/api/services/:id', async (req, res) => {
  try {
    await runAsync('DELETE FROM services WHERE id = ?', [req.params.id]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

const port = process.env.PORT || 3000;
initDb().then(() => {
  app.listen(port, () => console.log('Fresh DB API listening on', port));
}).catch(err => {
  console.error('Failed to init DB', err);
  process.exit(1);
});
