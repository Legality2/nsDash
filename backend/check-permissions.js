import 'dotenv/config';
import mongoose from 'mongoose';
import Role from './models/role.model.js';
import Permission from './models/permission.model.js';

const checkRolePermissions = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find projectManager role with permissions populated
    const projectManagerRole = await Role.findOne({ name: 'projectManager' })
      .populate('permissions');

    if (!projectManagerRole) {
      console.log('❌ projectManager role not found');
      process.exit(1);
    }

    console.log(`\n📋 Role: ${projectManagerRole.name}`);
    console.log(`   Type: ${projectManagerRole.type}`);
    console.log(`   Description: ${projectManagerRole.description}`);
    console.log(`\n   Permissions (${projectManagerRole.permissions.length}):`);

    const permsByResource = {};
    for (const perm of projectManagerRole.permissions) {
      if (!permsByResource[perm.resource]) {
        permsByResource[perm.resource] = [];
      }
      permsByResource[perm.resource].push({ name: perm.name, action: perm.action });
    }

    for (const [resource, perms] of Object.entries(permsByResource)) {
      console.log(`\n   • ${resource}:`);
      for (const perm of perms) {
        console.log(`     - ${perm.name} (${perm.action})`);
      }
    }

    // Check if projects.create exists
    const hasProjectsCreate = projectManagerRole.permissions.some(p => p.name === 'projects.create');
    console.log(`\n   ✅ Has projects.create? ${hasProjectsCreate ? 'YES' : 'NO'}`);

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Also check what projects permissions exist in the database
    const projectsPerms = await Permission.find({ resource: 'projects' });
    console.log(`📊 All projects permissions in database (${projectsPerms.length}):`);
    for (const perm of projectsPerms) {
      console.log(`   - ${perm.name} (${perm.action})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkRolePermissions();
