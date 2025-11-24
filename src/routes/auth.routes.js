import { Router } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { firestore, storage } from "../firebase.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import admin from "../firebase.js";
import { upload } from "../middlewares/upload.js";



const router = Router();
const JWT_SECRET = process.env.JWT_SECRET;
// ------------------------------
// 1. REGISTRO
// ------------------------------
router.post("/register", async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "email y password son requeridos" });

    const existingUser = await firestore
      .collection("users")
      .where("email", "==", email)
      .get();

    if (!existingUser.empty)
      return res.status(400).json({ error: "El usuario ya existe" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const userRef = await firestore.collection("users").add({
      email,
      password: hashedPassword,
      displayName: displayName || "",
      photoURL: "", // <-- agregamos esto
      createdAt: new Date().toISOString(),
      profile: { level: 1, xp: 0 },
    });

    return res.status(201).json({
      message: "Usuario creado correctamente",
      id: userRef.id,
      email,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error al registrar", details: err.message });
  }
});

// ------------------------------
// 2. LOGIN
// ------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const query = await firestore
      .collection("users")
      .where("email", "==", email)
      .get();

    if (query.empty)
      return res.status(401).json({ error: "Credenciales inválidas" });

    const userDoc = query.docs[0];
    const user = userDoc.data();

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign({ id: userDoc.id, email: user.email }, JWT_SECRET, {
      expiresIn: "2h",
    });

    return res.json({
      message: "Login exitoso",
      token,
      user: {
        id: userDoc.id,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL || "",
      },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ------------------------------
// 3. PERFIL
// ------------------------------
router.get("/me", verifyToken, async (req, res) => {
  try {
    const doc = await firestore.collection("users").doc(req.user.id).get();

    if (!doc.exists)
      return res.status(404).json({ error: "Usuario no encontrado" });

    const data = doc.data();
    delete data.password;

    return res.json({
      user: {
        uid: req.user.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL || "",
        profile: data.profile || {},
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ error: "Error al obtener perfil", details: err.message });
  }
});

// ------------------------------
// 4. SUBIR FOTO DE PERFIL
// ------------------------------
router.post(
  "/upload-photo",
  verifyToken,
  upload.single("photo"),
  async (req, res) => {
    try {
      if (!req.file)
        return res.status(400).json({ error: "No se envió ninguna imagen" });

      const bucket = admin.storage().bucket();

      const fileName = `profiles/${req.user.id}_${Date.now()}.jpg`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        contentType: req.file.mimetype,
      });

      const photoURL = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2030",
      });

      // Guardar en Firestore
      await firestore.collection("users").doc(req.user.id).update({
        photoURL: photoURL[0],
      });

      return res.json({
        message: "Foto actualizada",
        photoURL: photoURL[0],
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
);


// ------------------------------
// 5. ELIMINAR FOTO DE PERFIL
// ------------------------------
router.delete("/delete-photo", verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const userDoc = await firestore.collection("users").doc(userId).get();
    if (!userDoc.exists)
      return res.status(404).json({ error: "Usuario no existe" });

    const userData = userDoc.data();
    const photoURL = userData.photoURL;

    if (!photoURL || photoURL.trim() === "") {
      return res.status(400).json({ error: "El usuario no tiene foto" });
    }

    
    const bucket = storage.bucket();

    
    const filePath = photoURL.split("?")[0].split("/o/")[1];
    const decodedPath = decodeURIComponent(filePath);

    await bucket.file(decodedPath).delete().catch(() => {});

    
    await firestore.collection("users").doc(userId).update({
      photoURL: "",
    });

    return res.json({ message: "Foto eliminada correctamente" });
  } catch (err) {
    console.error("ERROR DELETE PHOTO:", err);
    return res.status(500).json({ error: "Error al eliminar foto" });
  }
});

export default router;
