const pool = require("./db");
const bcrypt = require("bcryptjs");

async function seedDatabase() {
  const client = await pool.connect();
  try {
    // Check if already seeded
    const count = await client.query("SELECT COUNT(*) FROM users");
    if (parseInt(count.rows[0].count) > 0) {
      console.log("Database already has data, skipping seed.");
      return;
    }

    console.log("Seeding database with sample data...");

    // Create demo user
    const hashed = await bcrypt.hash("demo1234", 10);
    await client.query(
      `INSERT INTO users (id, name, email, phone, password, role, avatar, joined_at) VALUES
       ('pp_user_demo', 'Demo User', 'demo@proxypal.in', '+91 90000 12345', $1, 'client', 'https://i.pravatar.cc/150?u=demo', '2026-01-01T00:00:00Z')`,
      [hashed]
    );

    // Create sample workers
    await client.query(
      `INSERT INTO workers (id, name, age, skills, city, availability, hourly_rate, experience, rating, created_at, user_id) VALUES
       ('pp_worker_001', 'Rahul Deshmukh', 28, 'Queue standing, Appointments, Form submission', 'Pune', 'Mon-Sat, 8 AM - 8 PM', 150, '2 years as queue proxy. 150+ tasks completed.', 4.8, '2025-11-01T00:00:00Z', NULL),
       ('pp_worker_002', 'Anita Joshi', 32, 'Government offices, Document pickup, Bank visits', 'Mumbai', 'Weekdays, 9 AM - 6 PM', 200, 'Former admin assistant. Expert in Mumbai govt offices.', 4.9, '2025-09-15T00:00:00Z', NULL),
       ('pp_worker_003', 'Vikram Singh', 24, 'Delivery wait, Event queuing, Shopping', 'Delhi', 'Flexible - Full time', 120, 'College student. Available for short tasks.', 4.5, '2026-01-20T00:00:00Z', NULL)`
    );

    // Create sample tasks
    await client.query(
      `INSERT INTO tasks (id, full_name, phone, task_type, location, client_location, date_time, duration, budget, description, status, created_at, accepted_at, assigned_to, assigned_name) VALUES
       ('pp_task_001', 'Priya Sharma', '+91 98765 43210', 'Queue Standing', 'DMart, Koregaon Park, Pune', 'Koregaon Park, Pune', '2026-05-18T09:00', '3 hours', 450, 'Need someone to stand in line for iPhone launch sale.', 'active', '2026-05-10T08:00:00Z', '2026-05-18T08:45:00Z', 'pp_worker_001', 'Rahul Deshmukh'),
       ('pp_task_002', 'Arjun Mehta', '+91 91234 56789', 'Government Office', 'RTO Office, Andheri, Mumbai', 'Andheri East, Mumbai', '2026-05-12T10:30', '4 hours', 600, 'Submit driving license renewal forms and collect receipt.', 'completed', '2026-05-08T14:00:00Z', NULL, NULL, NULL),
       ('pp_task_003', 'Sneha Reddy', '+91 99887 76655', 'Delivery Wait', 'Whitefield, Bangalore', 'Whitefield Main Road, Bangalore', '2026-05-20T14:00', '2 hours', 300, 'Wait at home for furniture delivery and inspect package.', 'pending', '2026-05-14T11:00:00Z', NULL, NULL, NULL),
       ('pp_task_004', 'Karan Patel', '+91 98123 45678', 'Bank Visit', 'HDFC Bank, Connaught Place, Delhi', 'Connaught Place, Delhi', '2026-05-22T11:00', '2 hours', 400, 'Collect passbook update and submit cheque deposit form.', 'pending', '2026-05-15T09:00:00Z', NULL, NULL, NULL),
       ('pp_task_005', 'Meera Iyer', '+91 97654 32109', 'Appointment Attendance', 'Apollo Clinic, Indiranagar, Bangalore', 'Indiranagar, Bangalore', '2026-05-19T08:30', '1 hour', 250, 'Attend doctor follow-up and collect prescription.', 'pending', '2026-05-15T14:00:00Z', NULL, NULL, NULL)`
    );

    console.log("Sample data seeded successfully!");
  } catch (err) {
    console.error("Seed error:", err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { seedDatabase };
