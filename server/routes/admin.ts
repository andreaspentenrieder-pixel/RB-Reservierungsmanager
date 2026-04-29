import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth, requireAdmin, logAction } from '../middleware.js';
import multer from 'multer';
import { parse } from 'csv-parse';
import bcrypt from 'bcryptjs';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB

router.use(requireAuth);
router.use(requireAdmin);

// Users Management
router.get('/users', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all("SELECT id, yh_identifier, email, first_name, last_name, role, status, created_at FROM users");
    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Fehler' });
  }
});

router.post('/users', async (req, res) => {
  const { yh_identifier, email, first_name, last_name, role } = req.body;
  if (!yh_identifier || !email || !role) return res.status(400).json({ error: 'Pflichtfelder fehlen' });

  const emailNorm = email.trim().toLowerCase();
  const yhNorm = yh_identifier.trim().toLowerCase();

  if (!emailNorm.endsWith('@rileg.de')) {
    return res.status(400).json({ error: 'E-Mail muss auf @rileg.de enden' });
  }

  try {
    const db = await getDb();
    const result = await db.run(
      "INSERT INTO users (yh_identifier, yh_identifier_normalized, email, email_normalized, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [yh_identifier.trim(), yhNorm, email.trim(), emailNorm, first_name?.trim() || null, last_name?.trim() || null, role]
    );

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Create User', 'user', result.lastID, null, { yh_identifier, email, role }, req.ip || '', 'User angelegt');

    res.json({ success: true });
  } catch (err: any) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Benutzer existiert bereits (Dublette)' });
    }
    res.status(500).json({ error: 'Fehler' });
  }
});

router.put('/users/:id', async (req, res) => {
  const { yh_identifier, email, first_name, last_name, role, status } = req.body;
  const emailNorm = email.trim().toLowerCase();
  const yhNorm = yh_identifier.trim().toLowerCase();
  if (!emailNorm.endsWith('@rileg.de')) return res.status(400).json({ error: 'E-Mail muss auf @rileg.de enden' });

  try {
    const db = await getDb();
    const old = await db.get("SELECT * FROM users WHERE id = ?", [req.params.id]);
    if(!old) return res.status(404).json({ error: 'Nicht gefunden' });

    await db.run(
      "UPDATE users SET yh_identifier=?, yh_identifier_normalized=?, email=?, email_normalized=?, first_name=?, last_name=?, role=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
      [yh_identifier.trim(), yhNorm, email.trim(), emailNorm, first_name?.trim(), last_name?.trim(), role, status, req.params.id]
    );

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Update User', 'user', Number(req.params.id), old, { status, role }, req.ip || '', 'User bearbeitet');

    res.json({ success: true });
  } catch(e: any) {
    if (e.message && e.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Dublette durch Änderung' });
    }
    res.status(500).json({ error: 'Fehler' });
  }
});

// Settings & Security
router.post('/password', async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: 'Passwort muss mindestens 8 Zeichen lang sein.' });
  }
  try {
    const db = await getDb();
    const hash = await bcrypt.hash(newPassword, 10);
    await db.run("INSERT INTO security_settings (admin_password_hash) VALUES (?)", [hash]);
    
    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Change Admin Password', 'security', null, null, null, req.ip || '', 'Admin-Passwort geändert');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Fehler' });
  }
});

// Audit Logs
router.get('/audit', async (req, res) => {
  const { startDate, endDate, entity, action } = req.query;
  try {
    const db = await getDb();
    let query = "SELECT * FROM audit_logs WHERE 1=1";
    let params: any[] = [];
    if (startDate) { query += " AND created_at >= ?"; params.push(String(startDate) + ' 00:00:00'); }
    if (endDate) { query += " AND created_at <= ?"; params.push(String(endDate) + ' 23:59:59'); }
    if (entity) { query += " AND entity_type = ?"; params.push(entity); }
    if (action) { query += " AND action = ?"; params.push(action); }

    query += " ORDER BY created_at DESC LIMIT 500";
    const logs = await db.all(query, params);
    res.json({ logs });
  } catch(e) {
    res.status(500).json({ error: 'Fehler' });
  }
});

// Dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0];
    
    const users = await db.get("SELECT COUNT(*) as c FROM users WHERE status = 'active'");
    const rooms = await db.get("SELECT COUNT(*) as c FROM rooms WHERE status = 'active'");
    const vehicles = await db.get("SELECT COUNT(*) as c FROM vehicles WHERE status = 'active'");
    const roomRes = await db.get("SELECT COUNT(*) as c FROM reservations WHERE resource_type='room' AND status='active' AND date(start_at) = ?", [today]);
    const vehRes = await db.get("SELECT COUNT(*) as c FROM reservations WHERE resource_type='vehicle' AND status='active' AND date(start_at) = ?", [today]);

    res.json({
      metrics: {
        activeUsers: users?.c || 0,
        activeRooms: rooms?.c || 0,
        activeVehicles: vehicles?.c || 0,
        todayRoomReservations: roomRes?.c || 0,
        todayVehicleReservations: vehRes?.c || 0
      }
    });
  } catch(e) {
    res.status(500).json({ error: 'Fehler' });
  }
});

// CSV Import
router.post('/csv-preview', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Keine Datei hochgeladen' });

  const csvData = req.file.buffer.toString('utf-8');
  parse(csvData, { columns: true, skip_empty_lines: true, trim: true }, (err, records) => {
    if (err) return res.status(400).json({ error: 'Fehler beim Parsen der CSV' });
    
    // Preview logic: evaluate valid rows, check for dupes (locally)
    const valid: any[] = [];
    const errors: any[] = [];

    records.forEach((row: any, i: number) => {
      const { 'YH-Kennung': yh, 'Bank-E-Mail-Adresse': email, 'Rolle': role, 'Status': status, 'Vorname': fn, 'Nachname': ln } = row;
      if (!yh || !email) {
        errors.push({ line: i+2, info: 'Pflichtfeld YH oder Mail fehlt' });
        return;
      }
      if (!email.toLowerCase().endsWith('@rileg.de')) {
        errors.push({ line: i+2, info: 'Mail muss @rileg.de sein' });
        return;
      }
      if (!['User', 'Manager', 'Admin'].includes(role)) {
        errors.push({ line: i+2, info: 'Ungültige Rolle' });
        return;
      }
      valid.push({
        yh_identifier: yh, email, first_name: fn || '', last_name: ln || '', role, status: ['active', 'inactive'].includes(status) ? status : 'active', line: i+2
      });
    });

    res.json({ validCount: valid.length, errorCount: errors.length, valid, errors });
  });
});

router.post('/csv-import', async (req, res) => {
  const { records } = req.body;
  if (!Array.isArray(records)) return res.status(400).json({ error: 'Ungültige Daten' });

  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const db = await getDb();
    for (const r of records) {
      if (!r.yh_identifier || !r.email) { skipped++; continue; }
      
      const emailNorm = r.email.trim().toLowerCase();
      if (!emailNorm.endsWith('@rileg.de')) { skipped++; continue; }
      
      if (!['User', 'Manager', 'Admin'].includes(r.role)) { skipped++; continue; }

      const yhNorm = r.yh_identifier.trim().toLowerCase();
      
      const existing = await db.get("SELECT id FROM users WHERE yh_identifier_normalized = ?", [yhNorm]);
      if (existing) {
        await db.run(
          "UPDATE users SET email=?, email_normalized=?, first_name=?, last_name=?, role=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?",
          [r.email.trim(), emailNorm, r.first_name.trim(), r.last_name.trim(), r.role, r.status, existing.id]
        );
        updated++;
      } else {
        await db.run(
          "INSERT INTO users (yh_identifier, yh_identifier_normalized, email, email_normalized, first_name, last_name, role, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
          [r.yh_identifier.trim(), yhNorm, r.email.trim(), emailNorm, r.first_name.trim(), r.last_name.trim(), r.role, r.status]
        );
        inserted++;
      }
    }

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'CSV Import', 'user', null, null, { inserted, updated, skipped }, req.ip || '', 'CSV Bulk Import');
    
    res.json({ success: true, inserted, updated, skipped });
  } catch(e) {
    res.status(500).json({ error: 'Fehler beim Import' });
  }
});

router.get('/csv-export', async (req, res) => {
  try {
    const db = await getDb();
    const users = await db.all("SELECT yh_identifier as 'YH-Kennung', email as 'Bank-E-Mail-Adresse', first_name as 'Vorname', last_name as 'Nachname', role as 'Rolle', status as 'Status' FROM users");
    
    // Simplistic CSV export
    if (users.length === 0) return res.send('Keine Daten');
    
    const headers = Object.keys(users[0]).join(';') + '\n';
    const rows = users.map(u => Object.values(u).map(v => `"${v || ''}"`).join(';')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="users.csv"');
    res.send(headers + rows);

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'CSV Export', 'user', null, null, null, req.ip || '', 'CSV User Export');

  } catch(e) {
    res.status(500).json({ error: 'Fehler beim Export' });
  }
});

export default router;
