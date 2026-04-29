import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth, requireAdmin, logAction } from '../middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'active' OR ? = 'Admin'", [req.session.role]);
    res.json({ rooms });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Räume' });
  }
});

// Admin endpoints
router.post('/', requireAdmin, async (req, res) => {
  const { name, location, capacity, equipment, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });

  try {
    const db = await getDb();
    const result = await db.run(
      "INSERT INTO rooms (name, location, capacity, equipment, notes) VALUES (?, ?, ?, ?, ?)",
      [name, location, capacity, equipment, notes]
    );
    
    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Create Room', 'room', result.lastID, null, { name, location, capacity }, req.ip || '', 'Raum angelegt');

    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Anlegen' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, location, capacity, equipment, notes, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
  
  try {
    const db = await getDb();
    const oldRoom = await db.get("SELECT * FROM rooms WHERE id = ?", [req.params.id]);
    if (!oldRoom) return res.status(404).json({ error: 'Raum nicht gefunden' });

    await db.run(
      "UPDATE rooms SET name = ?, location = ?, capacity = ?, equipment = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, location, capacity, equipment, notes, status, req.params.id]
    );

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Update Room', 'room', Number(req.params.id), oldRoom, { name, location, capacity, status }, req.ip || '', 'Raum bearbeitet');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Bearbeiten' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const oldRoom = await db.get("SELECT * FROM rooms WHERE id = ?", [req.params.id]);
    if (!oldRoom) return res.status(404).json({ error: 'Raum nicht gefunden' });

    await db.run("UPDATE rooms SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Delete Room', 'room', Number(req.params.id), oldRoom, { status: 'inactive' }, req.ip || '', 'Raum gelöscht/deaktiviert');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen' });
  }
});

export default router;
