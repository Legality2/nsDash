import jwt  from 'jsonwebtoken';
import User from '../models/user.model.js';

/* ── verifyToken ────────────────────────────────────────────────────────────
   Validates the Bearer JWT in Authorization header.
   - Algorithm is pinned to HS256 (prevents alg-swap attacks)
   - No fallback secret — crashes on startup if JWT_SECRET is missing (server.js guard)
   - Differentiates expired tokens from invalid ones for better DX
──────────────────────────────────────────────────────────────────────────── */
export const verifyToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],   // pin algorithm — prevents alg:none / RS256 confusion attacks
    });

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    // JsonWebTokenError, NotBeforeError, etc. — don't leak the reason
    res.status(401).json({ error: 'Invalid token' });
  }
};

/* ── requirePermission ──────────────────────────────────────────────────────
   RBAC: user must possess the named permission on the given resource.
──────────────────────────────────────────────────────────────────────────── */
export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.id)
        .populate({ path: 'roles', populate: { path: 'permissions' } });

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.hasPermission(resource, action)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required: { resource, action },
        });
      }

      req.userWithRoles = user;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/* ── requireRole ────────────────────────────────────────────────────────────
   Ensures the authenticated user holds the named role.
──────────────────────────────────────────────────────────────────────────── */
export const requireRole = (roleName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const user = await User.findById(req.user.id).populate('roles');

      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }

      if (!user.hasRole(roleName)) {
        return res.status(403).json({ error: 'Insufficient role', required: roleName });
      }

      req.userWithRoles = user;
      next();
    } catch (err) {
      next(err);
    }
  };
};

/* ── requireAdmin ───────────────────────────────────────────────────────────
   Convenience: shorthand for requireRole('admin').
──────────────────────────────────────────────────────────────────────────── */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await User.findById(req.user.id).populate('roles');

    if (!user || !user.hasRole('admin')) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userWithRoles = user;
    next();
  } catch (err) {
    next(err);
  }
};
