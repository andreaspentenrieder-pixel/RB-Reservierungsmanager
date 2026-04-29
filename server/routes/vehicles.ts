import { Router } from 'express';
import { getDb } from '../db.js';
import { requireAuth, requireAdmin, logAction } from '../middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const vehicles = await db.all("SELECT * FROM vehicles WHERE status = 'active' OR ? = 'Admin'", [req.session.role]);
    res.json({ vehicles });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Laden der Fahrzeuge' });
  }
});

// Admin endpoints
router.post('/', requireAdmin, async (req, res) => {
  const { name, license_plate, location, vehicle_type, drive_type, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });

  try {
    const db = await getDb();
    const result = await db.run(
      "INSERT INTO vehicles (name, license_plate, location, vehicle_type, drive_type, notes) VALUES (?, ?, ?, ?, ?, ?)",
      [name, license_plate, location, vehicle_type, drive_type, notes]
    );
    
    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Create Vehicle', 'vehicle', result.lastID, null, { name, license_plate }, req.ip || '', 'Fahrzeug angelegt');

    res.json({ success: true, id: result.lastID });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Anlegen' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, license_plate, location, vehicle_type, drive_type, notes, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name ist erforderlich' });
  
  try {
    const db = await getDb();
    const oldVeh = await db.get("SELECT * FROM vehicles WHERE id = ?", [req.params.id]);
    if (!oldVeh) return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });

    await db.run(
      "UPDATE vehicles SET name = ?, license_plate = ?, location = ?, vehicle_type = ?, drive_type = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [name, license_plate, location, vehicle_type, drive_type, notes, status, req.params.id]
    );

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Update Vehicle', 'vehicle', Number(req.params.id), oldVeh, { name, status }, req.ip || '', 'Fahrzeug bearbeitet');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Bearbeiten' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const db = await getDb();
    const oldVeh = await db.get("SELECT * FROM vehicles WHERE id = ?", [req.params.id]);
    if (!oldVeh) return res.status(404).json({ error: 'Fahrzeug nicht gefunden' });

    await db.run("UPDATE vehicles SET status = 'inactive', deleted_at = CURRENT_TIMESTAMP WHERE id = ?", [req.params.id]);

    await logAction(db, req.session.userId!, req.session.yhIdentifier!, req.session.role!,
      'Delete Vehicle', 'vehicle', Number(req.params.id), oldVeh, { status: 'inactive' }, req.ip || '', 'Fahrzeug gelöscht/deaktiviert');

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Löschen' });
  }
});

export default router;
