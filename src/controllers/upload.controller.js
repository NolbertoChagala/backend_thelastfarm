// controllers/auth.controller.js
import admin from "../firebase.js";
import { bucket } from "../firebase.js";
import path from "path";
import fs from "fs";

export const uploadProfilePhoto = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileName = `profiles/${Date.now()}_${file.originalname}`;

    const upload = bucket.file(fileName);

    await upload.save(fs.readFileSync(file.path), {
      metadata: { contentType: file.mimetype },
    });

    const url = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    // 🔥 DEVUELVE LO QUE FLUTTER ESPERA
    res.json({ photoURL: url });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: error.message });
  }
};
