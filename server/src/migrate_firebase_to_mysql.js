const axios = require('axios');
const pool = require('./db');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
const FIREBASE_DUMP_PATH = process.env.FIREBASE_DUMP_PATH;

async function fetchFirebaseJson(path = '/.json') {
  if (FIREBASE_DUMP_PATH && fs.existsSync(FIREBASE_DUMP_PATH)) {
    console.log('Using local dump:', FIREBASE_DUMP_PATH);
    return JSON.parse(fs.readFileSync(FIREBASE_DUMP_PATH, 'utf8'));
  }
  if (!FIREBASE_DB_URL) throw new Error('FIREBASE_DB_URL not set');
  const url = FIREBASE_DB_URL.replace(/\/$/, '') + path;
  const res = await axios.get(url, { timeout: 10000 });
  return res.data;
}

async function migrateServices() {
  console.log('Fetching services from Firebase...');
  const data = await fetchFirebaseJson('/services_catalog.json');
  if (!data) {
    console.log('No services data found');
    return;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const key of Object.keys(data)) {
      const s = data[key] || {};
      const id = key;
      const title = s.title || '';
      const tag = s.tag || '';
      const image = s.image || '';
      const description = s.description || '';
      const full_description = s.full_description || s.description || '';
      const pricing_note = s.pricing_note || '';

      await conn.query(
        'REPLACE INTO services (id, title, tag, image, description, full_description, pricing_note) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, title, tag, image, description, full_description, pricing_note]
      );
    }
    await conn.commit();
    console.log('Services migrated:', Object.keys(data).length);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function migrateSettings() {
  console.log('Fetching settings from Firebase...');
  const data = await fetchFirebaseJson('/settings.json');
  if (!data) return;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const k of Object.keys(data)) {
      const v = data[k];
      await conn.query('REPLACE INTO settings (`key`, value) VALUES (?, ?)', [k, JSON.stringify(v)]);
    }
    await conn.commit();
    console.log('Settings migrated');
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

async function main() {
  try {
    await migrateServices();
    await migrateSettings();
    console.log('Migration finished');
    process.exit(0);
  } catch (e) {
    console.error('Migration failed:', e.message || e);
    process.exit(1);
  }
}

if (require.main === module) main();
