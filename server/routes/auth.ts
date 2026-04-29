import { Router } from 'express';
import { getDb } from '../db.js';
import bcrypt from 'bcryptjs';

const router = Router();

// Rate limiting mockup (in a real app, use express-rate-limit)
const loginAttempts = new Map<string, { count: number, lockedUntil: number }>();

function checkRateLimit(ip: string) {
  const attempt = loginAttempts.get(ip);
  if (attempt) {
    if (Date.now() < attempt.lockedUntil) {
      return false;
    }
    if (Date.now() > attempt.lockedUntil && attempt.count >= 5) {
      loginAttempts.delete(ip);
    }
  }
  return true;
}

function recordFailedLogin(ip: string) {
  const attempt = loginAttempts.get(ip) || { count: 0, lockedUntil: 0 };
  attempt.count += 1;
  if (attempt.count >= 5) {
    attempt.lockedUntil = Date.now() + 1 * 60 * 1000; // lock for 1 minute for easier dev
  }
  loginAttempts.set(ip, attempt);
}

router.post('/login', async (req, res) => {
  require('fs').writeFileSync('/app/applet/debug.log', JSON.stringify(req.session.cookie) + '\n');
  console.log('Login: session.cookie:', req.session.cookie);
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Zu viele Versuche. Bitte warten Sie 1 Minute.' });
    return;
  }

  const { email, yhIdentifier, password } = req.body;

  if (!email || !yhIdentifier) {
    res.status(400).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanYh = yhIdentifier.trim().toLowerCase();

  console.log(`Login attempt: email=${cleanEmail}, yh=${cleanYh}, ip=${ip}`);

  if (!cleanEmail.endsWith('@rileg.de')) {
    recordFailedLogin(ip);
    console.log(`Login failed: not rileg.de`);
    res.status(401).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
    return;
  }

  try {
    const db = await getDb();
    const user = await db.get("SELECT * FROM users WHERE yh_identifier_normalized = ? AND email_normalized = ? AND status = 'active'", [cleanYh, cleanEmail]);

    if (!user) {
      console.log(`Login failed: user not found`);
      recordFailedLogin(ip);
      res.status(401).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
      return;
    }

    let isAdminAuthenticated = false;

    if (user.role === 'Admin') {
      if (!password) {
        console.log(`Login flow: admin password required`);
        // Just return that password is required
        res.status(401).json({ error: 'Admin-Passwort erforderlich.', requiresPassword: true });
        return;
      }
      
      const secSettings = await db.get("SELECT admin_password_hash FROM security_settings ORDER BY id DESC LIMIT 1");
      if (!secSettings || !await bcrypt.compare(password, secSettings.admin_password_hash)) {
        console.log(`Login failed: admin password wrong`);
        recordFailedLogin(ip);
        
        await db.run(
          "INSERT INTO audit_logs (action, description, ip_address) VALUES (?, ?, ?)",
          ['Failed Admin Login', `Failed admin login attempt for ${cleanYh}`, ip]
        );
        
        res.status(401).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
        return;
      }
      isAdminAuthenticated = true;
    }

    console.log(`Login success: user ${user.id}`);
    // Success
    loginAttempts.delete(ip);
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.yhIdentifier = user.yh_identifier;
    req.session.role = user.role;
    req.session.isAdminAuthenticated = isAdminAuthenticated;

    res.json({
      success: true,
      user: {
        email: user.email,
        yhIdentifier: user.yh_identifier,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', async (req, res) => {
  console.log('GET /me - Session details:', req.session.userId, req.session.id, req.headers.cookie);
  if (!req.session.userId) {
    res.status(401).json({ error: 'Nicht angemeldet' });
    return;
  }

  
  try {
    const db = await getDb();
    const user = await db.get("SELECT email, yh_identifier, first_name, last_name, role FROM users WHERE id = ? AND status = 'active'", [req.session.userId]);
    
    if (!user) {
      req.session.destroy(() => {});
      res.status(401).json({ error: 'User inaktiv' });
      return;
    }

    res.json({
      user: {
        email: user.email,
        yhIdentifier: user.yh_identifier,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Ein interner Fehler ist aufgetreten.' });
  }
});

export default router;
