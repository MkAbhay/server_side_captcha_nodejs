const express = require("express");
const svgCaptcha = require("svg-captcha");
const { v4: uuidv4 } = require("uuid");
const { initDB, getDB } = require("./db");
let db;

const app = express();
app.use(express.json());

app.get("/captcha", async (req, res) => {
  try {
    const captcha = svgCaptcha.create({
      size: 5,
      noise: 3,
      color: true,
      background: "#f2f2f2",
    });

    const id = uuidv4();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 min

    await db.execute(
      `INSERT INTO captchas (id, text, expires_at) VALUES (?, ?, ?)`,
      [id, captcha.text, expiresAt],
    );

    res.json({
      captchaId: id,
      svg: captcha.data,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post("/verify", async (req, res) => {
  const { captchaId, captcha } = req.body;

  if (!captchaId || !captcha) {
    return res.status(400).json({
      success: false,
      message: "captchaId and captcha required",
    });
  }

  try {
    const [rows] = await db.execute(`SELECT * FROM captchas WHERE id = ?`, [
      captchaId,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid captcha ID",
      });
    }

    const record = rows[0];

    // Already used
    if (record.is_used) {
      return res.status(400).json({
        success: false,
        message: "Captcha already used",
      });
    }

    // Expired
    if (new Date() > new Date(record.expires_at)) {
      return res.status(400).json({
        success: false,
        message: "Captcha expired",
      });
    }

    // Too many attempts
    if (record.attempts >= 5) {
      return res.status(429).json({
        success: false,
        message: "Too many attempts",
      });
    }

    // Wrong captcha
    if (record.text.toLowerCase() !== captcha.toLowerCase()) {
      await db.execute(
        `UPDATE captchas SET attempts = attempts + 1 WHERE id = ?`,
        [captchaId],
      );

      return res.status(400).json({
        success: false,
        message: "Invalid captcha",
      });
    }

    // Success - mark used
    await db.execute(`UPDATE captchas SET is_used = 1 WHERE id = ?`, [
      captchaId,
    ]);

    return res.json({
      success: true,
      message: "Captcha verified",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

(async () => {
  await initDB();
  db = getDB();

  app.listen(3000, () => {
    console.log("Server started on port 3000");
  });
})();

module.exports = app;
