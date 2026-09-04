/**
 * Migracion de Firebase Realtime Database -> Cloud Firestore.
 *
 * Uso (elige una forma de pasar la credencial):
 *   cd backend && npm install
 *
 *   # A) apuntando al archivo JSON de la cuenta de servicio:
 *   node migrate-rtdb-to-firestore.js ../abpereira-web-firebase-adminsdk-fbsvc-63eb5a06cf.json
 *
 *   # B) con variables de entorno (.env):
 *   FIREBASE_SERVICE_ACCOUNT_PATH=../ruta/al/serviceAccount.json  (o)
 *   FIREBASE_SERVICE_ACCOUNT={"project_id":...}   JSON en una sola linea
 *   npm run migrate
 *
 * databaseURL se deduce del project_id si no se indica FIREBASE_DATABASE_URL.
 * Es idempotente: usa set() con los mismos ids, se puede correr varias veces.
 */
require('dotenv').config();
const path = require('path');
const admin = require('firebase-admin');

function loadServiceAccount() {
  const filePath = process.argv[2] || process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    return require(path.resolve(process.cwd(), filePath));
  }
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }
  throw new Error(
    'Falta la credencial: pasa la ruta del JSON como argumento, o define ' +
    'FIREBASE_SERVICE_ACCOUNT_PATH / FIREBASE_SERVICE_ACCOUNT en .env'
  );
}

function initializeFirebase() {
  if (admin.apps.length) return;

  const serviceAccount = loadServiceAccount();

  if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('El JSON de la cuenta de servicio no tiene project_id / client_email / private_key');
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL ||
    `https://${serviceAccount.project_id}-default-rtdb.firebaseio.com`;

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }),
    databaseURL,
  });
}

initializeFirebase();

const rtdb = admin.database();
const firestore = admin.firestore();

function likesCount(value) {
  if (typeof value === 'number') return Math.max(0, value);
  if (value && typeof value.count === 'number') return Math.max(0, value.count);
  return 0;
}

async function migrateCollection(node, targetCollection, transform) {
  const snapshot = await rtdb.ref(node).once('value');
  const data = snapshot.val();
  if (!data) {
    console.log(`- ${node}: sin datos, se omite`);
    return 0;
  }

  let count = 0;
  let batch = firestore.batch();
  let ops = 0;

  for (const [key, raw] of Object.entries(data)) {
    const { id, value } = transform(key, raw);
    batch.set(firestore.collection(targetCollection).doc(id), value, { merge: true });
    count += 1;
    ops += 1;
    if (ops === 450) {
      await batch.commit();
      batch = firestore.batch();
      ops = 0;
    }
  }

  if (ops > 0) await batch.commit();
  console.log(`- ${node} -> ${targetCollection}: ${count} documentos`);
  return count;
}

async function migrateSettings() {
  const snapshot = await rtdb.ref('settings/maintenance').once('value');
  const value = snapshot.val();
  if (value === null) {
    console.log('- settings/maintenance: sin datos, se omite');
    return;
  }
  await firestore.collection('settings').doc('config').set(
    { maintenance: value === true },
    { merge: true }
  );
  console.log(`- settings/maintenance -> settings/config: { maintenance: ${value === true} }`);
}

async function run() {
  console.log('Migrando Realtime Database -> Firestore...\n');

  await migrateCollection('likes', 'likes', (key, raw) => ({
    id: key,
    value: { count: likesCount(raw) },
  }));

  await migrateSettings();

  await migrateCollection('services_catalog', 'services_catalog', (key, raw) => ({
    id: key,
    value: raw,
  }));

  await migrateCollection('appointments', 'appointments', (key, raw) => ({
    id: key,
    value: { ...raw, id: raw && raw.id ? raw.id : key },
  }));

  await migrateCollection('contacts', 'contacts', (key, raw) => ({
    id: key,
    value: raw,
  }));

  console.log('\nMigracion completada.');
  process.exit(0);
}

run().catch((error) => {
  console.error('Error en la migracion:', error);
  process.exit(1);
});
