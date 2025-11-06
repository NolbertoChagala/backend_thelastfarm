import { authAdmin } from '../firebase.js';

export async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Token faltante' });

    const decoded = await authAdmin.verifyIdToken(token);
    req.user = decoded; // uid, email, etc.
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido', details: err.message });
  }
}
