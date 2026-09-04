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
  });
}

initializeFirebase();
const database = admin.firestore();

async function initializeDatabase() {
  try {
    await database.collection('contacts').limit(1).get();
    await database.collection('appointments').limit(1).get();
    console.log('Colecciones verificadas en Cloud Firestore');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error.message);
    process.exit(1);
  }
}

app.get('/api/health', async (req, res) => {
  try {
    await database.collection('contacts').limit(1).get();
    res.json({
      ok: true,
      message: 'Conexión a Cloud Firestore activa',
      result: { ok: 1 },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      message: 'No se pudo conectar a Cloud Firestore',
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
    const document = await database.collection('contacts').add({
      full_name: fullName,
      email,
      phone: phone || '',
      message,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
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
    const document = await database.collection('appointments').add({
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone || '',
      service: service || '',
      date,
      time,
      notes: notes || '',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
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
    message: 'Backend listo para usar Cloud Firestore',
  });
});

async function startServer() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
    console.log('Usa FIREBASE_SERVICE_ACCOUNT en .env');
  });
}

startServer();
