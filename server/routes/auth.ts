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
  console.log('Login: session.cookie:', req.session.cookie);
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: 'Zu viele Versuche. Bitte warten Sie 1 Minute.' });
    return;
  }

  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
    return;
  }

  const cleanEmail = email.trim().toLowerCase();

  console.log(`Login attempt: email=${cleanEmail}, ip=${ip}`);

  if (cleanEmail === 'admin@rileg.de' && password === 'yhadmin01') {
    console.log(`Login success: mock user`);
    // Success
    loginAttempts.delete(ip);
    req.session.userId = 1; // fake userId
    req.session.email = 'admin@rileg.de';
    req.session.yhIdentifier = 'yhadmin01';
    req.session.role = 'Admin';
    req.session.isAdminAuthenticated = true;

    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Session error' });
      }
      res.json({
        success: true,
        user: {
          email: 'admin@rileg.de',
          yhIdentifier: 'yhadmin01',
          firstName: 'Admin',
          lastName: 'User',
          role: 'Admin'
        }
      });
    });
    return;
  }

  recordFailedLogin(ip);
  res.status(401).json({ error: 'Die Anmeldung war nicht erfolgreich.' });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) {
    res.status(401).json({ error: 'Nicht angemeldet' });
    return;
  }

  if (req.session.email === 'admin@rileg.de') {
    res.json({
      user: {
        email: 'admin@rileg.de',
        yhIdentifier: 'yhadmin01',
        firstName: 'Admin',
        lastName: 'User',
        role: 'Admin'
      }
    });
    return;
  }

  req.session.destroy(() => {});
  res.status(401).json({ error: 'User inaktiv' });
});

export default router;
