import 'dotenv/config';
import express    from 'express';
import cors       from 'cors';
import morgan     from 'morgan';
import mongoose   from 'mongoose';
import helmet     from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import hpp        from 'hpp';
import rateLimit  from 'express-rate-limit';

import authRouter    from './routes/auth.routes.js';
import rolesRouter   from './routes/roles.routes.js';
import projectRouter from './routes/project.routes.js';
import financeRouter from './routes/finance.routes.js';
import fashionRouter from './routes/fashion.routes.js';
import musicRouter   from './routes/music.routes.js';
import statsRouter   from './routes/stats.routes.js';
import filesRouter   from './routes/files.routes.js';
import photosRouter  from './routes/photos.routes.js';
import { verifyToken } from './middleware/auth.middleware.js';

/* ── Guard: require critical env vars before starting ── */
if (!process.env.JWT_SECRET) {
  console.error('❌  FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}
if (process.env.JWT_SECRET.length < 32) {
  console.error('❌  FATAL: JWT_SECRET must be at least 32 characters long.');
  process.exit(1);
}

const app  = express();
const PORT = process.env.PORT || 3000;

/* ── Security: Helmet — sets hardened HTTP response headers ── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'same-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", 'data:', 'blob:'],
      mediaSrc:   ["'self'", 'blob:'],
      connectSrc: ["'self'"],
      fontSrc:    ["'self'"],
      objectSrc:  ["'none'"],
      frameSrc:   ["'none'"],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

/* ── CORS — whitelist from env, fall back to localhost ── */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:4200')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin '${origin}' is not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

/* ── Body parsing — hard cap at 1 MB for JSON ── */
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

/* ── NoSQL injection prevention — strip $ and . from req.body/query/params ── */
app.use(mongoSanitize({
  replaceWith: '_',    // replace bad chars rather than silently remove
  onSanitize: ({ req, key }) => {
    console.warn(`[SECURITY] NoSQL injection attempt blocked. Key: ${key} IP: ${req.ip}`);
  },
}));

/* ── HTTP Parameter Pollution prevention ── */
app.use(hpp());

/* ── Request logging (skip in test) ── */
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

/* ── Global API rate limiter (brute-force / DoS protection) ── */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  skip: (req) => req.path === '/api/health',
});
app.use('/api', globalLimiter);

/* ── Routes ── */
app.use('/api/auth',     authRouter);
app.use('/api/roles',    rolesRouter);
app.use('/api/projects', projectRouter);
app.use('/api/finance',  verifyToken, financeRouter);
app.use('/api/fashion',  verifyToken, fashionRouter);
app.use('/api/music',    verifyToken, musicRouter);
app.use('/api/stats',    verifyToken, statsRouter);
app.use('/api/files',    verifyToken, filesRouter);   // all file routes now require auth
app.use('/api/photos',   verifyToken, photosRouter);

/* ── Health check (public, rate-limited separately) ── */
app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
);

/* ── 404 ── */
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

/* ── Global error handler — never leak stack traces to clients ── */
app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;

  // Always log the full error internally
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[ERROR] ${req.method} ${req.path} — ${err.message}`);
    if (status >= 500) console.error(err.stack);
  }

  // Produce a safe response — never expose internals to the client
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(status).json({
    error: status < 500
      ? err.message                      // validation / client errors are safe to share
      : (isProduction
        ? 'An internal error occurred.'  // hide details in production
        : err.message),                  // show in dev for easier debugging
  });
});

/* ── MongoDB + Listen ── */
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌  MongoDB connection error:', err.message);
    process.exit(1);
  });
