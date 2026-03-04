const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const auth = req.headers.authorization || "";
  const [tipo, token] = auth.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "cambia_esto_en_serio");
    req.user = { id: payload.sub };
    return next();
  } catch {
    return res.status(401).json({ error: "No autorizado" });
  }
}

module.exports = { requireAuth };