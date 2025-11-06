import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync(new URL("../config/serviceAccountKey.json", import.meta.url))
);

const app = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const authAdmin = admin.auth();
export const firestore = admin.firestore();
export default app;
