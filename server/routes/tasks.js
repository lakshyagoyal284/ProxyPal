const express = require("express");
const pool = require("../db");
const { authMiddleware, optionalAuth } = require("../middleware/auth");

const router = express.Router();

function generateId() {
  return "pp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
}

// GET /api/tasks - list tasks with optional filtering
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { status, type, q } = req.query;
    let sql = "SELECT * FROM tasks WHERE 1=1";
    const params = [];
    let paramIdx = 1;

    if (status && status !== "all") {
      sql += ` AND status = $${paramIdx++}`;
      params.push(status);
    }
    if (type && type !== "all") {
      sql += ` AND task_type = $${paramIdx++}`;
      params.push(type);
    }
    if (q && q.trim()) {
      sql += ` AND (LOWER(full_name) LIKE $${paramIdx} OR LOWER(location) LIKE $${paramIdx} OR LOWER(task_type) LIKE $${paramIdx} OR LOWER(description) LIKE $${paramIdx})`;
      params.push(`%${q.toLowerCase()}%`);
      paramIdx++;
    }

    sql += " ORDER BY created_at DESC";

    const result = await pool.query(sql, params);
    res.json({ tasks: result.rows });
  } catch (err) {
    console.error("Get tasks error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks - create a new task
router.post("/", optionalAuth, async (req, res) => {
  try {
    const { fullName, phone, taskType, location, clientLocation, dateTime, duration, budget, description, imageRef } = req.body;

    if (!fullName || !taskType || !location || !description || budget == null) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const task = {
      id: generateId(),
      full_name: fullName,
      phone: phone || "",
      task_type: taskType,
      location,
      client_location: clientLocation || "",
      date_time: dateTime || "",
      duration: duration || "",
      budget: parseFloat(budget) || 0,
      description,
      status: "pending",
      created_at: new Date().toISOString(),
      image_ref: imageRef || null,
      user_id: req.user ? req.user.id : null,
    };

    await pool.query(
      `INSERT INTO tasks (id, full_name, phone, task_type, location, client_location, date_time, duration, budget, description, status, created_at, image_ref, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
      [task.id, task.full_name, task.phone, task.task_type, task.location, task.client_location, task.date_time, task.duration, task.budget, task.description, task.status, task.created_at, task.image_ref, task.user_id]
    );

    res.status(201).json({ task });
  } catch (err) {
    console.error("Create task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /api/tasks/:id - update task status
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "active", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const updates = { status };
    if (status === "active") updates.accepted_at = new Date().toISOString();
    if (status === "completed") updates.completed_at = new Date().toISOString();

    const existing = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    await pool.query(
      `UPDATE tasks SET status = $1, accepted_at = COALESCE($2, accepted_at), completed_at = COALESCE($3, completed_at) WHERE id = $4`,
      [updates.status, updates.accepted_at || null, updates.completed_at || null, id]
    );

    const updated = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    res.json({ task: updated.rows[0] });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks/:id/accept - accept a task as a worker
router.post("/:id/accept", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check worker is registered
    const workerResult = await pool.query("SELECT id, name FROM workers WHERE user_id = $1", [userId]);
    if (workerResult.rows.length === 0) {
      return res.status(400).json({ error: "not_registered" });
    }

    const task = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: "not_found" });
    }

    if (task.rows[0].status !== "pending") {
      return res.status(400).json({ error: "unavailable" });
    }

    const worker = workerResult.rows[0];
    await pool.query(
      `UPDATE tasks SET status = 'active', assigned_to = $1, assigned_name = $2, accepted_at = NOW() WHERE id = $3`,
      [worker.id, worker.name, id]
    );

    const updated = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    res.json({ task: updated.rows[0] });
  } catch (err) {
    console.error("Accept task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/tasks/:id/complete - complete an accepted task
router.post("/:id/complete", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const workerResult = await pool.query("SELECT id FROM workers WHERE user_id = $1", [userId]);

    const task = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    if (task.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }

    const t = task.rows[0];
    if (t.status !== "active") {
      return res.status(400).json({ error: "Task is not active" });
    }

    if (workerResult.rows.length > 0 && t.assigned_to && t.assigned_to !== workerResult.rows[0].id) {
      return res.status(403).json({ error: "Not your task" });
    }

    // Check 60% time rule
    if (t.accepted_at && t.duration) {
      const durationMin = parseDurationToMinutes(t.duration);
      if (durationMin > 0) {
        const elapsed = (Date.now() - new Date(t.accepted_at).getTime()) / 60000;
        if (elapsed < durationMin * 0.6) {
          return res.status(400).json({
            error: "60% of task time not yet elapsed.",
            progress: Math.round((elapsed / durationMin) * 100),
          });
        }
      }
    }

    await pool.query(`UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1`, [id]);
    const updated = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    res.json({ task: updated.rows[0] });
  } catch (err) {
    console.error("Complete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// DELETE /api/tasks/:id
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1 RETURNING id", [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found" });
    }
    res.json({ deleted: true });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

function parseDurationToMinutes(durationStr) {
  if (!durationStr) return 0;
  const hourMatch = durationStr.match(/(\d+)\s*hours?/i);
  if (hourMatch) return parseInt(hourMatch[1], 10) * 60;
  const hourPlusMatch = durationStr.match(/(\d+)\+\s*hours?/i);
  if (hourPlusMatch) return parseInt(hourPlusMatch[1], 10) * 60;
  const minMatch = durationStr.match(/(\d+)\s*mins?/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  if (/half/i.test(durationStr)) return 30;
  return 0;
}

module.exports = router;
