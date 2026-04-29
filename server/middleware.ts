import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Nicht authentifiziert' });
    return;
  }
  next();
}

export function requireManager(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || (req.session.role !== 'Manager' && req.session.role !== 'Admin')) {
    res.status(403).json({ error: 'Keine Berechtigung' });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.role !== 'Admin' || !req.session.isAdminAuthenticated) {
    res.status(403).json({ error: 'Keine Admin-Berechtigung' });
    return;
  }
  next();
}

// Log actions
export async function logAction(db: any, actorUserId: number | undefined, actorYh: string, actorRole: string, action: string, entityType: string, entityId: number | null | undefined, oldVal: any, newVal: any, ip: string, description: string) {
  await db.run(
    "INSERT INTO audit_logs (actor_user_id, actor_yh_identifier, actor_role, action, entity_type, entity_id, old_value_json, new_value_json, ip_address, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [actorUserId, actorYh, actorRole, action, entityType, entityId, oldVal ? JSON.stringify(oldVal) : null, newVal ? JSON.stringify(newVal) : null, ip, description]
  );
}
