const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, 'zakka-meet.db');

// Initialize database
const db = new Database(DB_PATH, { 
  timeout: 5000,
  verbose: console.log 
});

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      gender TEXT DEFAULT 'not-specified',
      display_name TEXT,
      avatar_url TEXT,
      language TEXT DEFAULT 'en',
      timezone TEXT DEFAULT 'UTC',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Meetings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS meetings (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      is_private INTEGER DEFAULT 0,
      max_participants INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      ended_at DATETIME,
      recording_path TEXT,
      FOREIGN KEY(owner_id) REFERENCES users(id)
    )
  `);

  // Meeting participants table
  db.exec(`
    CREATE TABLE IF NOT EXISTS meeting_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meeting_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      left_at DATETIME,
      duration_minutes INTEGER,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Recordings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS recordings (
      id TEXT PRIMARY KEY,
      meeting_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size_mb REAL,
      duration_seconds INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meeting_id) REFERENCES meetings(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // User preferences table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      audio_enabled INTEGER DEFAULT 1,
      video_enabled INTEGER DEFAULT 1,
      notifications_enabled INTEGER DEFAULT 1,
      dark_mode INTEGER DEFAULT 1,
      accessibility_mode INTEGER DEFAULT 0,
      screen_reader_enabled INTEGER DEFAULT 0,
      high_contrast INTEGER DEFAULT 0,
      font_size TEXT DEFAULT 'normal',
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Transactions/Payments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      type TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      stripe_transaction_id TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Call history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS call_history (
      id TEXT PRIMARY KEY,
      caller_id TEXT NOT NULL,
      recipient_id TEXT,
      meeting_id TEXT,
      duration_seconds INTEGER,
      status TEXT DEFAULT 'completed',
      recording_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(caller_id) REFERENCES users(id),
      FOREIGN KEY(recipient_id) REFERENCES users(id),
      FOREIGN KEY(meeting_id) REFERENCES meetings(id),
      FOREIGN KEY(recording_id) REFERENCES recordings(id)
    )
  `);

  console.log('✅ Database initialized successfully');
}

// Run initialization
try {
  initializeDatabase();
} catch (error) {
  console.error('❌ Database initialization error:', error);
}

module.exports = db;
