const express = require('express');
const pool = require('./db');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api/services', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

app.get('/api/settings/:key', async (req, res) => {
  const key = req.params.key;
  try {
    const [rows] = await pool.query('SELECT value FROM settings WHERE `key` = ?', [key]);
    if (rows.length) return res.json(JSON.parse(rows[0].value));
    return res.status(404).json({});
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'db_error' });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('API listening on', port));
