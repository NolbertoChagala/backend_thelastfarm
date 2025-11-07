import { Router } from 'express';
import axios from 'axios';
import { authAdmin, firestore } from '../firebase.js';
import { verifyFirebaseToken } from '../middlewares/auth.middleware.js';

const router = Router();
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

// 1) Registro: crea el usuario en Firebase Auth y su doc de perfil
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    console.log(req.body);
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const userRecord = await authAdmin.createUser({
      email,
      password,
      displayName: displayName || '',
    });

    // Perfil base en Firestore
    await firestore.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName || '',
      createdAt: new Date().toISOString(),
      profile: { level: 1, xp: 0 }
    });

    return res.status(201).json({
      message: 'Usuario creado',
      uid: userRecord.uid,
      email: userRecord.email,
    });
  } catch (err) {
    return res.status(400).json({ error: 'No se pudo registrar', details: err.message });
  }
});

// 2) Login: usa el endpoint oficial REST de Firebase Auth (email/password)
router.post('/login', async (req, res) => {
  try {
    const { email, password, returnSecureToken = true } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email y password son requeridos' });
    }

    const url =
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`;

    const { data } = await axios.post(url, {
      email, password, returnSecureToken
    });

    // data.idToken (JWT), data.refreshToken, data.localId (uid)
    return res.json({
      uid: data.localId,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn
    });
  } catch (err) {
    const msg = err?.response?.data?.error?.message || err.message;
    return res.status(401).json({ error: 'Credenciales inválidas', details: msg });
  }
});

// 3) Yo (ruta protegida): devuelve info del usuario y su perfil Firestore
router.get('/me', verifyFirebaseToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    const doc = await firestore.collection('users').doc(uid).get();
    const profile = doc.exists ? doc.data() : null;
    return res.json({
      auth: req.user,
      profile
    });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo obtener el perfil', details: err.message });
  }
});

// 4) Logout (opcional): revoca refresh tokens (fuerza re-login en todos los dispositivos)
router.post('/logout', verifyFirebaseToken, async (req, res) => {
  try {
    await authAdmin.revokeRefreshTokens(req.user.uid);
    return res.json({ message: 'Sesión revocada' });
  } catch (err) {
    return res.status(500).json({ error: 'No se pudo cerrar sesión', details: err.message });
  }
});

export default router;
