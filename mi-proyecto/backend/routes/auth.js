const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { getDb } = require("../db");

const router = express.Router();

function esEmail(str) {
  return typeof str === "string" && str.includes("@") && str.length <= 254;
}

router.post("/registro", async (req, res) => {
  const { email, password, passwordConfirm } = req.body || {};

  if (!esEmail(email)) return res.status(400).json({ error: "Email inválido" });
  if (typeof password !== "string" || password.length < 8 || password.length > 72) {
    return res.status(400).json({ error: "La contraseña debe tener 8-72 caracteres" });
  }
  if (password !== passwordConfirm) {
    return res.status(400).json({ error: "Las contraseñas no coinciden" });
  }

  const db = getDb();
  const password_hash = await bcrypt.hash(password, 12);

  db.run(
    "INSERT INTO usuarios (email, password_hash) VALUES (?, ?)",
    [email.toLowerCase(), password_hash],
    function (err) {
      if (err) {
        if (String(err.message || "").includes("UNIQUE")) {
          return res.status(409).json({ error: "Ese email ya está registrado" });
        }
        return res.status(500).json({ error: "Error del servidor" });
      }
      return res.status(201).json({ id: this.lastID, email: email.toLowerCase() });
    }
  );
});

router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!esEmail(email) || typeof password !== "string") {
    return res.status(400).json({ error: "Credenciales inválidas" });
  }

  const db = getDb();
  db.get(
    "SELECT id, password_hash FROM usuarios WHERE email = ?",
    [email.toLowerCase()],
    async (err, row) => {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      if (!row) return res.status(401).json({ error: "Credenciales inválidas" });

      const ok = await bcrypt.compare(password, row.password_hash);
      if (!ok) return res.status(401).json({ error: "Credenciales inválidas" });

      const token = jwt.sign(
        { sub: row.id },
        process.env.JWT_SECRET || "cambia_esto_en_serio",
        { expiresIn: "2h" }
      );

      return res.json({ token });
    }
  );
});

module.exports = router;
