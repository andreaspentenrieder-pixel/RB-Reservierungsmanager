import express from 'express';
import session from 'express-session';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDb } from './server/db.js';
import './server/types.js';
import authRoutes from './server/routes/auth.js';
import roomsRoutes from './server/routes/rooms.js';
import vehiclesRoutes from './server/routes/vehicles.js';
import reservationsRoutes from './server/routes/reservations.js';
import adminRoutes from './server/routes/admin.js';

const __dirname = path.resolve();

const app = express();

// Trust proxy to resolve correct IP for rate limiting behind load balancers
app.set('trust proxy', true);

// Security headers for no-indexing
app.use((req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'super_secret_rileg_dev_key_123',
  resave: false,
  saveUninitialized: false,
  proxy: true, // Force trust proxy for secure cookies behind reverse proxy
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // required for SameSite: none
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000 // 8 hours
  }
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', secure: req.secure, proto: req.headers['x-forwarded-proto'], ip: req.ip });
});

// Robots.txt
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send('User-agent: *\nDisallow: /');
});

async function startServer() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // Vite integration
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

// Ensure database initialization
getDb().catch(console.error);

// If running directly, start the server
if (process.env.NODE_ENV !== 'production' || process.env.START_SERVER === 'true') {
  // Run seed before start
  import('./server/seed.js').then(() => {
    startServer();
  }).catch(console.error);
}

export default app;
