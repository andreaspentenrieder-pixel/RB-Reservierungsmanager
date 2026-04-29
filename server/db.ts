import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import fs from 'fs';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Allow Vercel to write DB to /tmp
const isVercel = process.env.VERCEL === '1';
const dbPath = isVercel 
  ? path.join('/tmp', 'database.sqlite')
  : path.join(__dirname, '..', 'data', 'database.sqlite');

let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>>;

export async function getDb() {
  if (!dbPromise) {
    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    dbPromise = open({
      filename: dbPath,
      driver: sqlite3.Database
    }).then(async (db) => {
      await db.exec(`

        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          yh_identifier TEXT UNIQUE NOT NULL,
          yh_identifier_normalized TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          email_normalized TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          role TEXT DEFAULT 'User',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS rooms (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          location TEXT,
          capacity INTEGER,
          equipment TEXT,
          notes TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          license_plate TEXT,
          location TEXT,
          vehicle_type TEXT,
          drive_type TEXT,
          notes TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS reservations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          resource_type TEXT NOT NULL,
          resource_id INTEGER NOT NULL,
          start_at DATETIME NOT NULL,
          end_at DATETIME NOT NULL,
          user_id INTEGER,
          user_email TEXT NOT NULL,
          user_yh_identifier TEXT NOT NULL,
          description TEXT,
          participant_count INTEGER,
          additional_notes TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME,
          deleted_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS vehicle_condition_notes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          reservation_id INTEGER,
          vehicle_id INTEGER,
          note_type TEXT,
          note_text TEXT,
          created_by_user_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          actor_user_id INTEGER,
          actor_yh_identifier TEXT,
          actor_role TEXT,
          action TEXT NOT NULL,
          entity_type TEXT,
          entity_id INTEGER,
          old_value_json TEXT,
          new_value_json TEXT,
          ip_address TEXT,
          user_agent TEXT,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS admin_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          key TEXT UNIQUE NOT NULL,
          value TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME
        );

        CREATE TABLE IF NOT EXISTS security_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_password_hash TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME
        );
      `);

      if (isVercel) {
        // Seed default resources on Vercel
        const userCount = await db.get('SELECT COUNT(*) as count FROM users');
        if (userCount.count === 0) {
           await db.run("INSERT INTO rooms (name, location, capacity, status) VALUES ('Meetingraum A', 'EG', 10, 'active')");
           await db.run("INSERT INTO rooms (name, location, capacity, status) VALUES ('Konferenz B', '1. OG', 20, 'active')");
           await db.run("INSERT INTO vehicles (name, license_plate, status) VALUES ('VW Golf', 'M-AB 1234', 'active')");
           await db.run("INSERT INTO vehicles (name, license_plate, status) VALUES ('BMW i3', 'M-XY 9876', 'active')");
           
           // We already have a hardcoded bypass in auth.ts for vercel testing.
        }
      }

      return db;
    });
  }
  return dbPromise;
}

// Ensure init
getDb().catch(console.error);
