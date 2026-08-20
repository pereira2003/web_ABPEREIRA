require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

function initializeFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Faltan FIREBASE_SERVICE_ACCOUNT o sus credenciales de Firebase Admin');
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

initializeFirebase();
const database = admin.database();

async function initializeDatabase() {
  try {
    await database.ref('contacts').limitToFirst(1).once('value');
    await database.ref('appointments').limitToFirst(1).once('value');
    console.log('Rutas verificadas en Firebase Realtime Database');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await database.ref('.info/connected').once('value');
    res.json({
      ok: true,
      message: 'Conexión a Firebase Realtime Database activa',
      result: { ok: 1 },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'No se pudo conectar a Firebase Realtime Database',
      error: error.message,
    });
  }
});

app.post('/api/contact', async (req, res) => {
  const { fullName, email, phone, message } = req.body;

  if (!fullName || !email || !message) {
    return res.status(400).json({
      ok: false,
      message: 'Faltan campos obligatorios: fullName, email y message',
    });
  }

  try {
    const document = database.ref('contacts').push();
    await document.set({
      full_name: fullName,
      email,
      phone: phone || '',
      message,
      created_at: admin.database.ServerValue.TIMESTAMP,
    });

    res.status(201).json({
      ok: true,
      message: 'Contacto guardado correctamente',
      id: document.id,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al guardar contacto',
      error: error.message,
    });
  }
});

app.post('/api/appointments', async (req, res) => {
  const { firstName, lastName, email, phone, service, date, time, notes } = req.body;

  if (!firstName || !lastName || !email || !date || !time) {
    return res.status(400).json({
      ok: false,
      message: 'Faltan datos obligatorios del turno',
    });
  }

  try {
    const document = database.ref('appointments').push();
    await document.set({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || '',
      service: service || '',
      date,
      time,
      notes: notes || '',
      created_at: admin.database.ServerValue.TIMESTAMP,
    });

    res.status(201).json({
      ok: true,
      message: 'Cita guardada correctamente',
      id: document.id,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'Error al guardar la cita',
      error: error.message,
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'ABPereira API',
    message: 'Backend listo para usar Firebase Realtime Database',
  });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Usa FIREBASE_DATABASE_URL y FIREBASE_SERVICE_ACCOUNT en .env');
  });
}

startServer();
