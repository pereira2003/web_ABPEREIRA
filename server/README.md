Server + Migration
==================

This folder contains a minimal Node.js API and a migration script to import data
from Firebase Realtime Database into a MySQL database. The API serves `services`
and `settings` so your frontend can request them from a single endpoint.

Quick start
-----------

1. Copy `.env.example` to `.env` and edit MySQL credentials and `FIREBASE_DB_URL`.

2. Create the MySQL schema (run locally or on remote MySQL):

   mysql -u root -p < schema.sql

3. Install dependencies:

   npm install

4. Migrate data from Firebase:

   npm run migrate

   Notes:
   - The migration script will try to fetch `${FIREBASE_DB_URL}/services_catalog.json` and `/settings.json`.
   - If your Firebase DB is protected, enable anonymous auth or provide a local dump JSON and set `FIREBASE_DUMP_PATH` in `.env`.

5. Start API:

   npm start

API

- `GET /api/services` — list services
- `GET /api/settings/:key` — get JSON value for a settings key

Frontend integration
--------------------
Point your frontend to the API (e.g. `https://your-host:3000/api/services`) instead of Firebase. Alternatively you can host this API alongside the frontend and use relative paths.
