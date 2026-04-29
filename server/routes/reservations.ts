import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth, requireManager, logAction } from '../middleware.js';

const router = Router();

router.use(requireAuth);

function isValid15MinInterval(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  return d.getMinutes() % 15 === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
}

// Get reservations (all users can read all active resource reservations)
router.get('/', async (req, res) => {
  const { resource_type, start, end } = req.query;
  
  try {
    const db = await getDb();
    
    let query = "SELECT r.* FROM reservations r ";
    const params: any[] = [];
    
    if (resource_type === 'room') {
      query += " JOIN rooms rm ON r.resource_id = rm.id WHERE rm.status = 'active' AND r.resource_type = 'room' AND r.status = 'active'";
    } else if (resource_type === 'vehicle') {
      query += " JOIN vehicles v ON r.resource_id = v.id WHERE v.status = 'active' AND r.resource_type = 'vehicle' AND r.status = 'active'";
    } else {
      query += " WHERE r.status = 'active'";
    }
    
    if (start && end) {
      query += " AND r.end_at > ? AND r.start_at < ?";
      params.push(start, end);
    }
    
    const reservations = await db.all(query, params);
    res.json({ reservations });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Reservierungen' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const db = await getDb();
    const reservations = await db.all("SELECT * FROM reservations WHERE user_id = ? AND status = 'active' ORDER BY start_at DESC", [req.session.userId]);
    res.json({ reservations });
  } catch(err) {
    res.status(500).json({ error: 'Fehler' });
  }
});

router.post('/', async (req, res) => {
  const { resource_type, resource_id, start_at, end_at, description, participant_count, vehicle_condition } = req.body;
  
  if (!resource_type || !resource_id || !start_at || !end_at) {
    return res.status(400).json({ error: 'Fehlende Pflichtfelder' });
  }

  const sDate = new Date(start_at);
  const eDate = new Date(end_at);
  
  if (eDate <= sDate) {
    return res.status(400).json({ error: 'Endzeit muss nach Startzeit liegen' });
  }
  
  if (!isValid15MinInterval(start_at) || !isValid15MinInterval(end_at)) {
    return res.status(400).json({ error: 'Zeiten müssen im 15-Minuten-Raster liegen' });
  }

  try {
    const db = await getDb();
    
    // Check if resource exists and is active
    let resourceActive = false;
    if (resource_type === 'room') {
      const room = await db.get("SELECT status FROM rooms WHERE id = ?", [resource_id]);
      if (room && room.status === 'active') resourceActive = true;
    } else if (resource_type === 'vehicle') {
      const veh = await db.get("SELECT status FROM vehicles WHERE id = ?", [resource_id]);
      if (veh && veh.status === 'active') resourceActive = true;
    }

    if (!resourceActive) {
      return res.status(400).json({ error: 'Ressource nicht verfügbar oder inaktiv' });
    }

    // Check overlap
    const overlap = await db.get(
      "SELECT id FROM reservations WHERE resource_type = ? AND resource_id = ? AND status = 'active' AND end_at > ? AND start_at < ?",
      [resource_type, resource_id, start_at, end_at]
    );

    if (overlap) {
      return res.status(409).json({ error: 'Die Ressource ist in diesem Zeitraum bereits reserviert' });
    }

    const result = await db.run(
      "INSERT INTO reservations (resource_type, resource_id, start_at, end_at, user_id, user_email, user_yh_identifier, description, participant_count) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [resource_type, resource_id, start_at, end_at, req.session.userId, req.session.email, req.session.yhIdentifier, description || null, participant_count || null]
    );

    if (resource_type === 'vehicle' && vehicle_condition) {
      await db.run(
        "INSERT INTO vehicle_condition_notes (reservation_id, vehicle_id, note_type, note_text, created_by_user_id) VALUES (?, ?, ?, ?, ?)",
        [result.lastID, resource_id, 'condition', vehicle_condition, req.session.userId]
      );
    }

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Create Reservation', 'reservation', result.lastID, null, { resource_type, resource_id, start_at, end_at }, req.ip || '', 'Reservierung erstellt');

    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Erstellen der Reservierung' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb();
    const rs = await db.get("SELECT * FROM reservations WHERE id = ?", [req.params.id]);
    
    if (!rs) return res.status(404).json({ error: 'Nicht gefunden' });
    
    if (rs.user_id !== req.session.userId && req.session.role !== 'Admin' && req.session.role !== 'Manager') {
      return res.status(403).json({ error: 'Keine Berechtigung diese Reservierung zu löschen' });
    }

    await db.run("UPDATE reservations SET status = 'deleted', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Delete Reservation', 'reservation', Number(req.params.id), rs, { status: 'deleted' }, req.ip || '', 'Reservierung gelöscht');

    res.json({ success: true });
  } catch(e) {
    res.status(500).json({ error: 'Fehler' });
  }
});

export default router;
