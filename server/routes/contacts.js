const express = require("express");
const pool = require("../db");

const router = express.Router();

function generateId() {
  return "pp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// GET /api/contacts - list all contact submissions (admin)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM contacts ORDER BY created_at DESC");
    res.json({ contacts: result.rows });
  } catch (err) {
    console.error("Get contacts error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/contacts - submit a contact message
router.post("/", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Name and email required" });
    }

    const contact = {
      id: generateId(),
      name,
      email,
      subject: subject || "",
      message: message || "",
      created_at: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO contacts (id, name, email, subject, message, created_at) VALUES ($1, $2, $3, $4, $5, $6)`,
      [contact.id, contact.name, contact.email, contact.subject, contact.message, contact.created_at]
    );

    res.status(201).json({ contact });
  } catch (err) {
    console.error("Create contact error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
