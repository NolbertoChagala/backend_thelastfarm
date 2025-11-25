// firebase.js
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";


const isLocal = process.env.NODE_ENV !== "production";

let serviceAccount;

if (isLocal) {

  // ===============================
  // ✔ MODO LOCAL (usa el archivo)
  // ===============================
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const localPath = path.join(__dirname, "config", "serviceAccountKey.json");
  console.log("🔍 Cargando serviceAccount local:", localPath);

  try {
    const raw = fs.readFileSync(localPath, "utf8");
    serviceAccount = JSON.parse(raw);
    console.log("✅ serviceAccountKey.json cargado (LOCAL)");
  } catch (err) {
    console.error("❌ ERROR: No se pudo cargar serviceAccountKey.json");
    throw err;
  }
} else {

  // ============================================
  // ✔ MODO PRODUCCIÓN (Render → variable env)
  // ============================================
  
  console.log("☁️ Usando SERVICE_ACCOUNT_KEY desde variables de entorno");
  serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

export const firestore = admin.firestore();
export const storage = admin.storage();
export const bucket = admin.storage().bucket();

export default admin;
