const express = require("express");
const { getDb } = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function limpiarTexto(v, max) {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

// Crear nota (solo logueado)
router.post("/", requireAuth, (req, res) => {
  const titulo = limpiarTexto(req.body?.titulo, 120);
  const contenido = limpiarTexto(req.body?.contenido, 5000);

  if (!titulo || !contenido) {
    return res.status(400).json({ error: "Título y contenido obligatorios (con límites)" });
  }

  const db = getDb();
  db.run(
    "INSERT INTO notas (user_id, titulo, contenido) VALUES (?, ?, ?)",
    [req.user.id, titulo, contenido],
    function (err) {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      return res.status(201).json({ id: this.lastID });
    }
  );
});

// Listar MIS notas (solo logueado)
router.get("/", requireAuth, (req, res) => {
  const db = getDb();
  db.all(
    "SELECT id, titulo, creado_en, actualizado_en FROM notas WHERE user_id = ? ORDER BY creado_en DESC",
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      return res.json({ notas: rows });
    }
  );
});

// Ver UNA nota mía
router.get("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  const db = getDb();
  db.get(
    "SELECT id, titulo, contenido, creado_en, actualizado_en FROM notas WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      if (!row) return res.status(404).json({ error: "No encontrada" });
      return res.json(row);
    }
  );
});

// Editar UNA nota mía
router.put("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  const titulo = limpiarTexto(req.body?.titulo, 120);
  const contenido = limpiarTexto(req.body?.contenido, 5000);
  if (!titulo || !contenido) return res.status(400).json({ error: "Datos inválidos" });

  const db = getDb();
  db.run(
    "UPDATE notas SET titulo = ?, contenido = ?, actualizado_en = datetime('now') WHERE id = ? AND user_id = ?",
    [titulo, contenido, id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      if (this.changes === 0) return res.status(404).json({ error: "No encontrada" });
      return res.json({ ok: true });
    }
  );
});

// Borrar UNA nota mía
router.delete("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: "ID inválido" });

  const db = getDb();
  db.run(
    "DELETE FROM notas WHERE id = ? AND user_id = ?",
    [id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: "Error del servidor" });
      if (this.changes === 0) return res.status(404).json({ error: "No encontrada" });
      return res.json({ ok: true });
    }
  );
});

module.exports = router;