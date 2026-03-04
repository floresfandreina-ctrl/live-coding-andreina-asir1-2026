const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "app.db");
const SCHEMA_PATH = path.join(__dirname, "schema.sql");

let db;

function initDb() {

  db = new sqlite3.Database(DB_PATH);

  const schema = fs.readFileSync(SCHEMA_PATH, "utf8");

  db.exec(schema, (err) => {
    if (err) {
      console.error("Error creando la base de datos:", err.message);
      process.exit(1);
    }
  });

  return db;
}

function getDb() {
  return db;
}

module.exports = { initDb, getDb };
