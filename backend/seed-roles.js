import 'dotenv/config';
import mongoose from 'mongoose';
import Permission from './models/permission.model.js';
import Role from './models/role.model.js';
import User from './models/user.model.js';

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Clear existing data
    await Permission.deleteMany({});
    await Role.deleteMany({});
    console.log('🗑️  Cleared existing roles and permissions');

    /* ── Create Permissions ── */
    const permissions = [
      // Finance permissions
      { name: 'finance.read', description: 'View finance data', resource: 'finance', action: 'read' },
      { name: 'finance.create', description: 'Create finance records', resource: 'finance', action: 'create' },
      { name: 'finance.update', description: 'Update finance records', resource: 'finance', action: 'update' },
      { name: 'finance.delete', description: 'Delete finance records', resource: 'finance', action: 'delete' },
      { name: 'finance.manage', description: 'Manage finance module', resource: 'finance', action: 'manage' },

      // Fashion permissions
      { name: 'fashion.read', description: 'View fashion data', resource: 'fashion', action: 'read' },
      { name: 'fashion.create', description: 'Create fashion items', resource: 'fashion', action: 'create' },
      { name: 'fashion.update', description: 'Update fashion items', resource: 'fashion', action: 'update' },
      { name: 'fashion.delete', description: 'Delete fashion items', resource: 'fashion', action: 'delete' },
      { name: 'fashion.manage', description: 'Manage fashion module', resource: 'fashion', action: 'manage' },

      // Music permissions
      { name: 'music.read', description: 'View music data', resource: 'music', action: 'read' },
      { name: 'music.create', description: 'Create music tracks', resource: 'music', action: 'create' },
      { name: 'music.update', description: 'Update music tracks', resource: 'music', action: 'update' },
      { name: 'music.delete', description: 'Delete music tracks', resource: 'music', action: 'delete' },
      { name: 'music.manage', description: 'Manage music module', resource: 'music', action: 'manage' },

      // Beat permissions
      { name: 'beats.create', description: 'Create beats', resource: 'beats', action: 'create' },
      { name: 'beats.read', description: 'View beats', resource: 'beats', action: 'read' },
      { name: 'beats.update', description: 'Update beats', resource: 'beats', action: 'update' },
      { name: 'beats.delete', description: 'Delete beats', resource: 'beats', action: 'delete' },
      { name: 'beats.manage', description: 'Manage beats and layers', resource: 'beats', action: 'manage' },

      // User/Roles permissions
      { name: 'users.read', description: 'View users', resource: 'users', action: 'read' },
      { name: 'users.create', description: 'Create users', resource: 'users', action: 'create' },
      { name: 'users.update', description: 'Update users', resource: 'users', action: 'update' },
      { name: 'users.delete', description: 'Delete users', resource: 'users', action: 'delete' },

      { name: 'roles.read', description: 'View roles', resource: 'roles', action: 'read' },
      { name: 'roles.create', description: 'Create roles', resource: 'roles', action: 'create' },
      { name: 'roles.update', description: 'Update roles', resource: 'roles', action: 'update' },
      { name: 'roles.delete', description: 'Delete roles', resource: 'roles', action: 'delete' },
      { name: 'roles.manage', description: 'Manage roles and permissions', resource: 'roles', action: 'manage' },

      // Reports permissions
      { name: 'reports.read', description: 'View reports', resource: 'reports', action: 'read' },
      { name: 'reports.create', description: 'Create reports', resource: 'reports', action: 'create' },
      { name: 'reports.manage', description: 'Manage reports', resource: 'reports', action: 'manage' },

      // Settings permissions
      { name: 'settings.read', description: 'View settings', resource: 'settings', action: 'read' },
      { name: 'settings.update', description: 'Update settings', resource: 'settings', action: 'update' },
      { name: 'settings.manage', description: 'Manage system settings', resource: 'settings', action: 'manage' },

      // Projects permissions
      { name: 'projects.read', description: 'View projects', resource: 'projects', action: 'read' },
      { name: 'projects.create', description: 'Create projects', resource: 'projects', action: 'create' },
      { name: 'projects.update', description: 'Update projects', resource: 'projects', action: 'update' },
      { name: 'projects.delete', description: 'Delete projects', resource: 'projects', action: 'delete' },
      { name: 'projects.manage', description: 'Manage projects and team members', resource: 'projects', action: 'manage' },
    ];

    const savedPermissions = await Permission.insertMany(permissions);
    console.log(`✅ Created ${savedPermissions.length} permissions`);

    // Create a map for easier reference
    const permMap = {};
    savedPermissions.forEach(perm => {
      permMap[perm.name] = perm._id;
    });

    /* ── Create System Roles ── */
    const roles = [
      {
        name: 'admin',
        description: 'Super administrator with full access',
        type: 'system',
        permissions: savedPermissions.map(p => p._id) // Admin gets all permissions
      },
      {
        name: 'financeManager',
        description: 'Manages finance module and reports',
        type: 'system',
        permissions: [
          permMap['finance.read'],
          permMap['finance.create'],
          permMap['finance.update'],
          permMap['finance.delete'],
          permMap['finance.manage'],
          permMap['reports.read'],
          permMap['reports.create']
        ]
      },
      {
        name: 'fashionManager',
        description: 'Manages fashion module and inventory',
        type: 'system',
        permissions: [
          permMap['fashion.read'],
          permMap['fashion.create'],
          permMap['fashion.update'],
          permMap['fashion.delete'],
          permMap['fashion.manage'],
          permMap['reports.read']
        ]
      },
      {
        name: 'musicManager',
        description: 'Manages music module and content',
        type: 'system',
        permissions: [
          permMap['music.read'],
          permMap['music.create'],
          permMap['music.update'],
          permMap['music.delete'],
          permMap['music.manage'],
          permMap['beats.read'],
          permMap['beats.create'],
          permMap['beats.update'],
          permMap['beats.delete'],
          permMap['beats.manage'],
          permMap['reports.read']
        ]
      },
      {
        name: 'projectManager',
        description: 'Oversees projects across all modules',
        type: 'system',
        permissions: [
          permMap['projects.read'],
          permMap['projects.create'],
          permMap['projects.update'],
          permMap['projects.manage'],
          permMap['finance.read'],
          permMap['fashion.read'],
          permMap['music.read'],
          permMap['beats.read'],
          permMap['users.read'],
          permMap['reports.read'],
          permMap['reports.create'],
          permMap['reports.manage']
        ]
      },
      {
        name: 'viewer',
        description: 'Read-only access to all modules',
        type: 'system',
        permissions: [
          permMap['finance.read'],
          permMap['fashion.read'],
          permMap['music.read'],
          permMap['beats.read'],
          permMap['reports.read']
        ]
      }
    ];

    const savedRoles = await Role.insertMany(roles);
    console.log(`✅ Created ${savedRoles.length} system roles`);

    // Assign admin role to first user if it exists
    const firstUser = await User.findOne({});
    if (firstUser) {
      const adminRole = savedRoles.find(r => r.name === 'admin');
      firstUser.roles = [adminRole._id];
      await firstUser.save();
      console.log(`✅ Assigned admin role to user: ${firstUser.username}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
