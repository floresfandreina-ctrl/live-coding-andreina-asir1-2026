const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { initDb } = require("./db");

const authRoutes = require("./routes/auth");
const notasRoutes = require("./routes/notas");

const app = express();
const PORT = process.env.PORT || 3000;

initDb();

app.use(helmet());
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "200kb" }));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use("/auth", authRoutes);
app.use("/notas", notasRoutes);

app.use((req, res) => res.status(404).json({ error: "No encontrado" }));

app.use((err, req, res, next) => {
  console.error("Error no controlado:", err?.message);
  res.status(500).json({ error: "Error del servidor" });
});

app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));