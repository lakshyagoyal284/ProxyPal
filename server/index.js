const express = require("express");
const cors = require("cors");
const path = require("path");
const pool = require("./db");
const { seedDatabase } = require("./seed");

// Load .env if available
try {
  require("dotenv").config();
} catch (e) {
  // dotenv optional
}

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
app.use(express.json({ limit: "10mb" }));

// Serve static frontend files from the parent directory
app.use(express.static(path.join(__dirname, "..")));

// API routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/tasks", require("./routes/tasks"));
app.use("/api/workers", require("./routes/workers"));
app.use("/api/contacts", require("./routes/contacts"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA-like routing (but we have static pages)
app.get("*", (req, res) => {
  // Only for HTML requests, not API
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(__dirname, "..", "index.html"));
  } else {
    res.status(404).json({ error: "Not found" });
  }
});

// Initialize database schema and seed on startup
async function init() {
  try {
    // Run schema
    const fs = require("fs");
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");
      await pool.query(schema);
      console.log("Database schema initialized");
    }

    // Seed sample data
    await seedDatabase();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`\n  🚀 ProxyPal server running on http://localhost:${PORT}`);
      console.log(`  📦 API at http://localhost:${PORT}/api`);
      console.log(`  🌐 Frontend at http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error("Failed to initialize:", err);
    process.exit(1);
  }
}

init();
