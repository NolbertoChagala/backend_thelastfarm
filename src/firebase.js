// firebase.js
import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serviceAccountPath = path.join(__dirname, "config", "serviceAccountKey.json");

console.log("Buscando archivo en:", serviceAccountPath);

const serviceAccount = JSON.parse(
  await fs.readFile(serviceAccountPath, "utf8")
);

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
