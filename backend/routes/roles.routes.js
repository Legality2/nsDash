import express from 'express';
import Role from '../models/role.model.js';
import Permission from '../models/permission.model.js';
import User from '../models/user.model.js';
import { requireAdmin, verifyToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/* ────────────────── PERMISSIONS ────────────────── */

// Get all permissions
router.get('/permissions', verifyToken, async (req, res) => {
  try {
    const permissions = await Permission.find().sort({ resource: 1, action: 1 });
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Create permission (admin only)
router.post('/permissions', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, resource, action } = req.body;

    if (!name || !resource || !action) {
      return res.status(400).json({ error: 'Name, resource, and action are required' });
    }

    const existingPerm = await Permission.findOne({ name });
    if (existingPerm) {
      return res.status(400).json({ error: 'Permission already exists' });
    }

    const permission = new Permission({ name, description, resource, action });
    await permission.save();

    res.status(201).json({ success: true, permission });
  } catch (error) {
    console.error('Error creating permission:', error);
    res.status(500).json({ error: 'Failed to create permission' });
  }
});

/* ────────────────── ROLES ────────────────── */

// Get all roles
router.get('/roles', verifyToken, async (req, res) => {
  try {
    const roles = await Role.find()
      .populate('permissions')
      .populate('parentRole', 'name')
      .populate('createdBy', 'username email')
      .sort({ type: 1, name: 1 });
    
    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// Get single role
router.get('/roles/:id', verifyToken, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id)
      .populate('permissions')
      .populate('parentRole')
      .populate('createdBy', 'username email');

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
});

// Create custom role (admin only)
router.post('/roles', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, parentRole, permissions } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' });
    }

    const existingRole = await Role.findOne({ name });
    if (existingRole) {
      return res.status(400).json({ error: 'Role already exists' });
    }

    // Validate parent role exists if provided
    if (parentRole) {
      const parent = await Role.findById(parentRole);
      if (!parent) {
        return res.status(400).json({ error: 'Parent role not found' });
      }
    }

    const role = new Role({
      name,
      description,
      type: 'custom',
      parentRole: parentRole || null,
      permissions: permissions || [],
      createdBy: req.user.id
    });

    await role.save();
    await role.populate('permissions');
    await role.populate('createdBy', 'username email');

    res.status(201).json({ success: true, role });
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
});

// Update role (admin only)
router.put('/roles/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { description, permissions } = req.body;
    const roleId = req.params.id;

    // Don't allow changing system roles
    const role = await Role.findById(roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.type === 'system') {
      return res.status(403).json({ error: 'Cannot modify system roles' });
    }

    // Update role
    if (description !== undefined) role.description = description;
    if (permissions !== undefined) role.permissions = permissions;
    role.updatedAt = new Date();

    await role.save();
    await role.populate('permissions');

    res.json({ success: true, role });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// Delete role (admin only)
router.delete('/roles/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);

    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (role.type === 'system') {
      return res.status(403).json({ error: 'Cannot delete system roles' });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.countDocuments({ roles: role._id });
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        error: 'Cannot delete role assigned to users',
        userCount: usersWithRole
      });
    }

    await Role.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Role deleted' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
});

/* ────────────────── USER ROLES ────────────────── */

// Get user roles
router.get('/users/:userId/roles', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.roles);
  } catch (error) {
    console.error('Error fetching user roles:', error);
    res.status(500).json({ error: 'Failed to fetch user roles' });
  }
});

// Assign roles to user (admin only)
router.post('/users/:userId/roles', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { roleIds } = req.body;

    if (!Array.isArray(roleIds)) {
      return res.status(400).json({ error: 'roleIds must be an array' });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate all roles exist
    const roles = await Role.find({ _id: { $in: roleIds } });
    if (roles.length !== roleIds.length) {
      return res.status(400).json({ error: 'One or more roles not found' });
    }

    user.roles = roleIds;
    await user.save();
    await user.populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error assigning roles:', error);
    res.status(500).json({ error: 'Failed to assign roles' });
  }
});

// Add single role to user (admin only)
router.post('/users/:userId/roles/:roleId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await Role.findById(req.params.roleId);
    if (!role) {
      return res.status(404).json({ error: 'Role not found' });
    }

    if (!user.roles.includes(req.params.roleId)) {
      user.roles.push(req.params.roleId);
      await user.save();
    }

    await user.populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error adding role:', error);
    res.status(500).json({ error: 'Failed to add role' });
  }
});

// Remove role from user (admin only)
router.delete('/users/:userId/roles/:roleId', verifyToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $pull: { roles: req.params.roleId } },
      { new: true }
    ).populate({
      path: 'roles',
      populate: {
        path: 'permissions'
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error removing role:', error);
    res.status(500).json({ error: 'Failed to remove role' });
  }
});

/* ────────────────── GET USER PERMISSIONS ────────────────── */

// Get current user's permissions
router.get('/me/permissions', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate({
        path: 'roles',
        populate: {
          path: 'permissions'
        }
      });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract all permissions
    const permissions = [];
    user.roles.forEach(role => {
      if (role.permissions) {
        role.permissions.forEach(perm => {
          if (!permissions.find(p => p._id.equals(perm._id))) {
            permissions.push(perm);
          }
        });
      }
    });

    res.json({
      roles: user.roles.map(r => r.name),
      permissions
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

export default router;
