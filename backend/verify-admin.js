import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';

const verifyAdminAccess = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find all users with admin role
    const users = await User.find({ roles: { $ne: [] } })
      .populate('roles', 'name description permissions')
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

    console.log(`\n👥 Found ${users.length} user(s) with roles:\n`);

    for (const user of users) {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 User: ${user.username} (${user.email})`);
      
      if (user.roles && user.roles.length > 0) {
        for (const role of user.roles) {
          console.log(`\n   📋 Role: ${role.name}`);
          console.log(`      Description: ${role.description}`);
          if (role.permissions && role.permissions.length > 0) {
            console.log(`      Permissions (${role.permissions.length}):`);
            const permsByResource = {};
            for (const perm of role.permissions) {
              if (!permsByResource[perm.resource]) {
                permsByResource[perm.resource] = [];
              }
              permsByResource[perm.resource].push(perm.action);
            }
            for (const [resource, actions] of Object.entries(permsByResource)) {
              console.log(`         • ${resource}: ${actions.join(', ')}`);
            }
          }
        }
      } else {
        console.log(`   ⚠️  No roles assigned`);
      }
    }

    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    // Check for admin user
    const adminUsers = await User.find({ roles: { $ne: [] } })
      .populate({
        path: 'roles',
        match: { name: 'admin' }
      });

    const adminCount = adminUsers.filter(u => u.roles.length > 0).length;
    console.log(`✅ Admin users: ${adminCount}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

verifyAdminAccess();
