-- ProxyPal Database Schema

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT DEFAULT '',
  password TEXT NOT NULL,
  role TEXT DEFAULT 'client',
  avatar TEXT DEFAULT '',
  joined_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT DEFAULT '',
  task_type TEXT NOT NULL,
  location TEXT NOT NULL,
  client_location TEXT DEFAULT '',
  date_time TEXT DEFAULT '',
  duration TEXT DEFAULT '',
  budget REAL DEFAULT 0,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  assigned_to TEXT,
  assigned_name TEXT DEFAULT '',
  image_ref TEXT,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER DEFAULT 0,
  skills TEXT DEFAULT '',
  city TEXT DEFAULT '',
  availability TEXT DEFAULT '',
  hourly_rate REAL DEFAULT 0,
  experience TEXT DEFAULT '',
  rating REAL DEFAULT 5.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT DEFAULT '',
  message TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
