import mongoose from 'mongoose';
import Project  from '../models/project.model.js';
import Task     from '../models/task.model.js';
import User     from '../models/user.model.js';

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

/** Returns a valid ObjectId or null. */
function toOid(str) {
  return mongoose.Types.ObjectId.isValid(str)
    ? new mongoose.Types.ObjectId(str)
    : null;
}

/** 400 response when an id param fails ObjectId validation. */
function badId(res, paramName) {
  return res.status(400).json({ success: false, error: `Invalid ${paramName}` });
}

function hasIdMatch(value, userId) {
  return String(value) === String(userId);
}

function getProjectAccess(project, userId) {
  if (!project || !userId) return { canView: false, canEdit: false, isOwner: false };

  const isOwner = hasIdMatch(project.owner, userId);
  const isTeamMember = Array.isArray(project.teamMembers)
    && project.teamMembers.some(member => hasIdMatch(member, userId));

  const grant = Array.isArray(project.accessList)
    ? project.accessList.find(entry => entry?.user && hasIdMatch(entry.user, userId))
    : null;

  const grantedEdit = grant?.permission === 'edit';
  const grantedView = grant?.permission === 'view' || grantedEdit;
  const isPublic = project.visibility === 'public';

  const canEdit = isOwner || isTeamMember || grantedEdit;
  const canView = canEdit || isPublic || grantedView;

  return { canView, canEdit, isOwner };
}

function escapeRegex(input) {
  return String(input).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Recompute and persist a project's completion percentage. */
async function syncProgress(projectId) {
  const all  = await Task.find({ project: projectId });
  const done = all.filter(t => t.status === 'completed').length;
  const pct  = all.length > 0 ? Math.round((done / all.length) * 100) : 0;
  await Project.findByIdAndUpdate(projectId, { progress: pct });
}

/* ─────────────────────────────────────────────
   Allowed field sets (body allowlisting)
   Prevents callers from overwriting owner, _id,
   __v, or other internal fields via PATCH/PUT.
───────────────────────────────────────────── */
const PROJECT_UPDATABLE = new Set([
  'name', 'description', 'status', 'priority', 'category',
  'startDate', 'endDate', 'budget', 'progress', 'visibility',
]);

const TASK_UPDATABLE = new Set([
  'title', 'description', 'status', 'priority',
  'assignee', 'dueDate', 'estimatedHours', 'labels',
]);

function pick(obj, allowed) {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => allowed.has(k))
  );
}

/* ─────────────────────────────────────────────
   PROJECT CONTROLLERS
───────────────────────────────────────────── */

export const getProjects = async (req, res, next) => {
  try {
    // Pagination is already sanitized by sanitizePagination middleware in the route
    const { page = 1, limit = 10, status, priority, category } = req.query;
    const filter = {};
    const userId = req.user?.id;

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;

    filter.$or = [
      { owner: userId },
      { teamMembers: userId },
      { visibility: 'public' },
      { 'accessList.user': userId },
    ];

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .populate('owner',       'username email')
        .populate('teamMembers', 'username email')
        .populate('accessList.user', 'username email')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ createdAt: -1 }),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getProjectById = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const project = await Project.findById(req.params.id)
      .populate('owner',       'username email')
      .populate('teamMembers', 'username email')
      .populate('accessList.user', 'username email');

    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const access = getProjectAccess(project, req.user?.id);
    if (!access.canView) {
      return res.status(403).json({ success: false, error: 'Not authorised to view this project' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignee',  'username email')
      .populate('reporter',  'username email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: { ...project.toObject(), tasks } });
  } catch (err) { next(err); }
};

export const createProject = async (req, res, next) => {
  try {
    const { name, description, priority, category, startDate, endDate, budget, teamMembers, visibility } = req.body;

    const project = new Project({
      name,
      description,
      priority,
      category,
      startDate,
      endDate,
      budget,
      visibility: visibility === 'public' ? 'public' : 'private',
      owner:       req.user.id,
      teamMembers: teamMembers ? [req.user.id, ...teamMembers] : [req.user.id],
    });

    await project.save();
    await project.populate([
      { path: 'owner',       select: 'username email' },
      { path: 'teamMembers', select: 'username email' },
      { path: 'accessList.user', select: 'username email' },
    ]);

    res.status(201).json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const updateProject = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const existing = await Project.findById(req.params.id).select('owner teamMembers accessList visibility');
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found' });

    const access = getProjectAccess(existing, req.user.id);
    if (!access.canEdit) {
      return res.status(403).json({ success: false, error: 'Not authorised to update this project' });
    }

    // Allowlist fields — never let caller overwrite owner, _id, etc.
    const safeBody = pick(req.body, PROJECT_UPDATABLE);

    if (!access.isOwner && typeof safeBody.visibility !== 'undefined') {
      return res.status(403).json({ success: false, error: 'Only the owner can change project visibility' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: safeBody },
      { new: true, runValidators: true },
    )
      .populate('owner',       'username email')
      .populate('teamMembers', 'username email')
      .populate('accessList.user', 'username email');

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const deleteProject = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    // Ownership check
    const existing = await Project.findById(req.params.id).select('owner');
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found' });
    if (String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Not authorised to delete this project' });
    }

    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ project: req.params.id });

    res.json({ success: true, message: 'Project deleted successfully' });
  } catch (err) { next(err); }
};

export const addTeamMember = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const { userId } = req.body;
    if (!userId || !toOid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const existing = await Project.findById(req.params.id).select('owner');
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found' });
    if (String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only the owner can manage project team' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { teamMembers: userId } },
      { new: true },
    )
      .populate('owner',       'username email')
      .populate('teamMembers', 'username email')
      .populate('accessList.user', 'username email');

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const removeTeamMember = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const { userId } = req.body;
    if (!userId || !toOid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const existing = await Project.findById(req.params.id).select('owner');
    if (!existing) return res.status(404).json({ success: false, error: 'Project not found' });
    if (String(existing.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only the owner can manage project team' });
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $pull: { teamMembers: userId } },
      { new: true },
    )
      .populate('owner',       'username email')
      .populate('teamMembers', 'username email')
      .populate('accessList.user', 'username email');

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const grantProjectAccess = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const { userId, permission } = req.body;
    if (!userId || !toOid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }
    if (!['view', 'edit'].includes(permission)) {
      return res.status(400).json({ success: false, error: 'Permission must be view or edit' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only the owner can share this project' });
    }
    if (String(project.owner) === String(userId)) {
      return res.status(400).json({ success: false, error: 'Owner already has full access' });
    }

    const existingIndex = project.accessList.findIndex(a => String(a.user) === String(userId));
    if (existingIndex >= 0) {
      project.accessList[existingIndex].permission = permission;
      project.accessList[existingIndex].grantedAt = new Date();
    } else {
      project.accessList.push({ user: userId, permission, grantedAt: new Date() });
    }

    await project.save();
    await project.populate([
      { path: 'owner',       select: 'username email' },
      { path: 'teamMembers', select: 'username email' },
      { path: 'accessList.user', select: 'username email' },
    ]);

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

export const searchProjectUsers = async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) {
      return res.json({ success: true, data: [] });
    }

    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);
    const rx = new RegExp(escapeRegex(q), 'i');

    const users = await User.find({
      _id: { $ne: req.user.id },
      $or: [
        { username: rx },
        { email: rx },
      ],
    })
      .select('username email')
      .sort({ username: 1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: users });
  } catch (err) { next(err); }
};

export const revokeProjectAccess = async (req, res, next) => {
  try {
    if (!toOid(req.params.id)) return badId(res, 'id');

    const { userId } = req.body;
    if (!userId || !toOid(userId)) {
      return res.status(400).json({ success: false, error: 'Invalid userId' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    if (String(project.owner) !== String(req.user.id)) {
      return res.status(403).json({ success: false, error: 'Only the owner can manage sharing' });
    }

    project.accessList = project.accessList.filter(a => String(a.user) !== String(userId));
    await project.save();
    await project.populate([
      { path: 'owner',       select: 'username email' },
      { path: 'teamMembers', select: 'username email' },
      { path: 'accessList.user', select: 'username email' },
    ]);

    res.json({ success: true, data: project });
  } catch (err) { next(err); }
};

/* ─────────────────────────────────────────────
   TASK CONTROLLERS
───────────────────────────────────────────── */

export const getTasksByProject = async (req, res, next) => {
  try {
    if (!toOid(req.params.projectId)) return badId(res, 'projectId');

    const project = await Project.findById(req.params.projectId).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const access = getProjectAccess(project, req.user?.id);
    if (!access.canView) {
      return res.status(403).json({ success: false, error: 'Not authorised to view tasks for this project' });
    }

    const { status, priority, assignee, page = 1, limit = 20 } = req.query;
    const filter = { project: req.params.projectId };

    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (assignee && toOid(assignee)) filter.assignee = assignee;

    const [tasks, total] = await Promise.all([
      Task.find(filter)
        .populate('assignee', 'username email')
        .populate('reporter', 'username email')
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .sort({ dueDate: 1, priority: -1 }),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tasks,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) { next(err); }
};

export const getTaskById = async (req, res, next) => {
  try {
    if (!toOid(req.params.taskId)) return badId(res, 'taskId');

    const task = await Task.findById(req.params.taskId)
      .populate('project',  'name')
      .populate('assignee', 'username email')
      .populate('reporter', 'username email')
      .populate('dependencies');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    const project = await Project.findById(task.project).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const access = getProjectAccess(project, req.user?.id);
    if (!access.canView) {
      return res.status(403).json({ success: false, error: 'Not authorised to view this task' });
    }

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const createTask = async (req, res, next) => {
  try {
    if (!toOid(req.params.projectId)) return badId(res, 'projectId');

    const project = await Project.findById(req.params.projectId).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const access = getProjectAccess(project, req.user?.id);
    if (!access.canEdit) {
      return res.status(403).json({ success: false, error: 'Not authorised to create tasks for this project' });
    }

    const { title, description, priority, assignee, dueDate, estimatedHours, labels } = req.body;

    const task = new Task({
      title,
      description,
      project: req.params.projectId,
      priority,
      assignee,
      reporter: req.user.id,
      dueDate,
      estimatedHours,
      labels,
    });

    await task.save();
    await task.populate([
      { path: 'assignee', select: 'username email' },
      { path: 'reporter', select: 'username email' },
    ]);

    await syncProgress(req.params.projectId);

    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const updateTask = async (req, res, next) => {
  try {
    if (!toOid(req.params.taskId)) return badId(res, 'taskId');

    const existingTask = await Task.findById(req.params.taskId).select('project');
    if (!existingTask) return res.status(404).json({ success: false, error: 'Task not found' });

    const project = await Project.findById(existingTask.project).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const access = getProjectAccess(project, req.user?.id);
    if (!access.canEdit) {
      return res.status(403).json({ success: false, error: 'Not authorised to update tasks for this project' });
    }

    // Allowlist fields — prevent overwriting project, reporter, comments, etc.
    const safeBody = pick(req.body, TASK_UPDATABLE);

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $set: safeBody },
      { new: true, runValidators: true },
    )
      .populate('assignee', 'username email')
      .populate('reporter', 'username email');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    await syncProgress(task.project);

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};

export const deleteTask = async (req, res, next) => {
  try {
    if (!toOid(req.params.taskId)) return badId(res, 'taskId');

    const existingTask = await Task.findById(req.params.taskId).select('project');
    if (!existingTask) return res.status(404).json({ success: false, error: 'Task not found' });

    const project = await Project.findById(existingTask.project).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const access = getProjectAccess(project, req.user?.id);
    if (!access.canEdit) {
      return res.status(403).json({ success: false, error: 'Not authorised to delete tasks for this project' });
    }

    const task = await Task.findByIdAndDelete(req.params.taskId);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    await syncProgress(task.project);

    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
};

export const addTaskComment = async (req, res, next) => {
  try {
    if (!toOid(req.params.taskId)) return badId(res, 'taskId');

    const existingTask = await Task.findById(req.params.taskId).select('project');
    if (!existingTask) return res.status(404).json({ success: false, error: 'Task not found' });

    const project = await Project.findById(existingTask.project).select('owner teamMembers accessList visibility');
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });
    const access = getProjectAccess(project, req.user?.id);
    if (!access.canView) {
      return res.status(403).json({ success: false, error: 'Not authorised to comment on this task' });
    }

    const { text } = req.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    // Cap comment length to prevent large payloads being stored
    const MAX_COMMENT = 1000;
    if (text.length > MAX_COMMENT) {
      return res.status(400).json({
        success: false,
        error: `Comment must not exceed ${MAX_COMMENT} characters`,
      });
    }

    const task = await Task.findByIdAndUpdate(
      req.params.taskId,
      { $push: { comments: { author: req.user.id, text: text.trim() } } },
      { new: true },
    ).populate('comments.author', 'username email');

    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });

    res.json({ success: true, data: task });
  } catch (err) { next(err); }
};
