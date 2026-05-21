const express = require("express");
const pool = require("../db");
const { authMiddleware, optionalAuth } = require("../middleware/auth");

const router = express.Router();

function generateId() {
  return "pp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// GET /api/workers - list all workers
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM workers ORDER BY created_at DESC");
    res.json({ workers: result.rows });
  } catch (err) {
    console.error("Get workers error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/workers - register as a worker
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if already registered
    const existing = await pool.query("SELECT id FROM workers WHERE user_id = $1", [userId]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Already registered as a worker" });
    }

    const { name, age, skills, city, availability, hourlyRate, experience } = req.body;
    if (!name || !city) {
      return res.status(400).json({ error: "Name and city required" });
    }

    const worker = {
      id: generateId(),
      name,
      age: parseInt(age) || 0,
      skills: skills || "",
      city,
      availability: availability || "",
      hourly_rate: parseFloat(hourlyRate) || 0,
      experience: experience || "",
      rating: 5.0,
      created_at: new Date().toISOString(),
      user_id: userId,
    };

    await pool.query(
      `INSERT INTO workers (id, name, age, skills, city, availability, hourly_rate, experience, rating, created_at, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [worker.id, worker.name, worker.age, worker.skills, worker.city, worker.availability, worker.hourly_rate, worker.experience, worker.rating, worker.created_at, worker.user_id]
    );

    res.status(201).json({ worker });
  } catch (err) {
    console.error("Create worker error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/workers/me - get current user's worker profile
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM workers WHERE user_id = $1", [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Not registered as worker" });
    }
    res.json({ worker: result.rows[0] });
  } catch (err) {
    console.error("Get my worker error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/workers/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM workers WHERE id = $1 AND user_id = $2 RETURNING id", [req.params.id, req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Worker not found" });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete worker error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
