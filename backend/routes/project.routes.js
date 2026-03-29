import { Router } from 'express';
import { verifyToken, requirePermission }              from '../middleware/auth.middleware.js';
import { validateObjectIds, sanitizePagination }       from '../middleware/validate.middleware.js';
import * as projectCtrl                                from '../controllers/project.controller.js';

const router = Router();

/* ─────────────────────────────────────────────
   All project routes require authentication
───────────────────────────────────────────── */
router.use(verifyToken);

/* ─────────────────────────────────────────────
   PROJECT ENDPOINTS
───────────────────────────────────────────── */

router.get(
  '/',
  sanitizePagination(100),
  projectCtrl.getProjects,
);

router.get(
  '/users/search',
  projectCtrl.searchProjectUsers,
);

router.get(
  '/:id',
  validateObjectIds('id'),
  projectCtrl.getProjectById,
);

router.post(
  '/',
  requirePermission('projects', 'create'),
  projectCtrl.createProject,
);

router.put(
  '/:id',
  validateObjectIds('id'),
  requirePermission('projects', 'update'),
  projectCtrl.updateProject,
);

router.delete(
  '/:id',
  validateObjectIds('id'),
  requirePermission('projects', 'delete'),
  projectCtrl.deleteProject,
);

router.post(
  '/:id/team',
  validateObjectIds('id'),
  requirePermission('projects', 'manage'),
  projectCtrl.addTeamMember,
);

router.delete(
  '/:id/team',
  validateObjectIds('id'),
  requirePermission('projects', 'manage'),
  projectCtrl.removeTeamMember,
);

router.post(
  '/:id/access',
  validateObjectIds('id'),
  requirePermission('projects', 'manage'),
  projectCtrl.grantProjectAccess,
);

router.delete(
  '/:id/access',
  validateObjectIds('id'),
  requirePermission('projects', 'manage'),
  projectCtrl.revokeProjectAccess,
);

/* ─────────────────────────────────────────────
   TASK ENDPOINTS
───────────────────────────────────────────── */

router.get(
  '/:projectId/tasks',
  validateObjectIds('projectId'),
  sanitizePagination(100),
  projectCtrl.getTasksByProject,
);

router.get(
  '/:projectId/tasks/:taskId',
  validateObjectIds('projectId', 'taskId'),
  projectCtrl.getTaskById,
);

router.post(
  '/:projectId/tasks',
  validateObjectIds('projectId'),
  requirePermission('projects', 'create'),
  projectCtrl.createTask,
);

router.put(
  '/:projectId/tasks/:taskId',
  validateObjectIds('projectId', 'taskId'),
  requirePermission('projects', 'update'),
  projectCtrl.updateTask,
);

router.delete(
  '/:projectId/tasks/:taskId',
  validateObjectIds('projectId', 'taskId'),
  requirePermission('projects', 'delete'),
  projectCtrl.deleteTask,
);

router.post(
  '/:projectId/tasks/:taskId/comments',
  validateObjectIds('projectId', 'taskId'),
  projectCtrl.addTaskComment,
);

export default router;
