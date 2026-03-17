import mongoose from 'mongoose';

/* ── validateObjectIds ──────────────────────────────────────────────────────
   Validates that named route params are valid MongoDB ObjectIds.
   Usage:  router.get('/:id', validateObjectIds('id'), ctrl.getOne)
           router.put('/:projectId/tasks/:taskId',
                      validateObjectIds('projectId', 'taskId'), ctrl.update)
──────────────────────────────────────────────────────────────────────────── */
export const validateObjectIds = (...paramNames) => (req, res, next) => {
  for (const name of paramNames) {
    const val = req.params[name];
    if (val !== undefined && !mongoose.Types.ObjectId.isValid(val)) {
      return res.status(400).json({ error: `Invalid ${name}: not a valid ObjectId` });
    }
  }
  next();
};

/* ── sanitizePagination ─────────────────────────────────────────────────────
   Coerces and bounds-clamps ?page and ?limit query params.
   Writes the sanitized integers back to req.query so controllers can use
   them safely without re-parsing.
   - page  : integer ≥ 1           (default 1)
   - limit : integer in [1, max]   (default 10, max configurable, global max 200)
──────────────────────────────────────────────────────────────────────────── */
export const sanitizePagination = (maxLimit = 100) => (req, _res, next) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.min(
    Math.min(maxLimit, 200),                        // never exceed absolute ceiling
    Math.max(1, parseInt(req.query.limit, 10) || 10)
  );
  req.query.page  = page;
  req.query.limit = limit;
  next();
};
