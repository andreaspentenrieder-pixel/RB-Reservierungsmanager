import { getDb } from './db.js';
import bcrypt from 'bcryptjs';

async function seed() {
  const db = await getDb();
  
  // Seed Users
  const users = await db.all("SELECT id FROM users");
  if (users.length === 0) {
    await db.run(
      "INSERT INTO users (yh_identifier, yh_identifier_normalized, email, email_normalized, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['YHADMIN', 'yhadmin', 'admin@rileg.de', 'admin@rileg.de', 'Admin', 'User', 'Admin']
    );
    await db.run(
      "INSERT INTO users (yh_identifier, yh_identifier_normalized, email, email_normalized, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['YHMANAGER', 'yhmanager', 'manager@rileg.de', 'manager@rileg.de', 'Manager', 'User', 'Manager']
    );
    await db.run(
      "INSERT INTO users (yh_identifier, yh_identifier_normalized, email, email_normalized, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['YHUSER', 'yhuser', 'user@rileg.de', 'user@rileg.de', 'Normal', 'User', 'User']
    );
    console.log('Seeded initial users.');
  }

  // Seed Admin Password
  const security = await db.all("SELECT id FROM security_settings");
  if (security.length === 0) {
    const hash = await bcrypt.hash('Test1234', 10);
    await db.run("INSERT INTO security_settings (admin_password_hash) VALUES (?)", [hash]);
    console.log('Seeded security settings.');
  }

  // Seed Rooms
  const rooms = await db.all("SELECT id FROM rooms");
  let roomSaalId, roomKonferenzId;
  if (rooms.length === 0) {
    const res1 = await db.run("INSERT INTO rooms (name, capacity, status) VALUES (?, ?, ?)", ['Saal', 50, 'active']);
    const res2 = await db.run("INSERT INTO rooms (name, location, capacity, status) VALUES (?, ?, ?, ?)", ['Konferenzraum 1. Stock', '1. Stock', 10, 'active']);
    roomSaalId = res1.lastID;
    roomKonferenzId = res2.lastID;
    console.log('Seeded initial rooms.');
  } else {
    roomSaalId = rooms[0].id;
    roomKonferenzId = rooms[1] ? rooms[1].id : rooms[0].id;
  }

  // Seed Vehicles
  const vehicles = await db.all("SELECT id FROM vehicles");
  let vehicleTeslaId;
  if (vehicles.length === 0) {
    const res3 = await db.run("INSERT INTO vehicles (name, vehicle_type, status) VALUES (?, ?, ?)", ['Tesla', 'PKW', 'active']);
    vehicleTeslaId = res3.lastID;
    console.log('Seeded initial vehicles.');
  } else {
    vehicleTeslaId = vehicles[0].id;
  }

  // Seed Reservations
  const reservations = await db.all("SELECT id FROM reservations");
  if (reservations.length === 0) {
    const now = new Date();
    
    const start1 = new Date(now);
    start1.setHours(9, 0, 0, 0);
    const end1 = new Date(now);
    end1.setHours(11, 0, 0, 0);

    const start2 = new Date(now);
    start2.setDate(now.getDate() + 1);
    start2.setHours(13, 0, 0, 0);
    const end2 = new Date(now);
    end2.setDate(now.getDate() + 1);
    end2.setHours(15, 0, 0, 0);

    await db.run(
      "INSERT INTO reservations (resource_type, resource_id, start_at, end_at, user_email, user_yh_identifier, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['room', roomSaalId, start1.toISOString(), end1.toISOString(), 'admin@rileg.de', 'YHADMIN', 'Team Meeting']
    );

    await db.run(
      "INSERT INTO reservations (resource_type, resource_id, start_at, end_at, user_email, user_yh_identifier, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['vehicle', vehicleTeslaId, start2.toISOString(), end2.toISOString(), 'user@rileg.de', 'YHUSER', 'Kundenbesuch']
    );

    console.log('Seeded initial reservations.');
  }

  console.log('Seed completed successfully.');
}

seed().catch(console.error);
