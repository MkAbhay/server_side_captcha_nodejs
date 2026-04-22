const mysql = require("mysql2/promise");

let db;

async function initDB() {
  db = await mysql.createPool({
    host: "localhost",
    user: "root",
    password: "root",
    database: "captcha_test",
    waitForConnections: true,
    connectionLimit: 10,
  });
}

module.exports = { initDB, getDB: () => db };
