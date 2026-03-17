import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Role from './models/role.model.js';
import Permission from './models/permission.model.js';

const fixProjectManagerRole = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Get or create the projects.create permission if it doesn't exist
    let projectsCreatePerm = await Permission.findOne({ name: 'projects.create' });
    if (!projectsCreatePerm) {
      projectsCreatePerm = await Permission.create({
        name: 'projects.create',
        description: 'Create projects',
        resource: 'projects',
        action: 'create'
      });
      console.log('✅ Created projects.create permission');
    } else {
      console.log('✅ projects.create permission exists');
    }

    // Find projectManager role
    const projectManagerRole = await Role.findOne({ name: 'projectManager' });
    if (!projectManagerRole) {
      console.log('❌ projectManager role not found');
      process.exit(1);
    }

    // Add projects.create permission if not already there
    const hasPermission = projectManagerRole.permissions.some(pid => 
      pid.equals(projectsCreatePerm._id)
    );

    if (!hasPermission) {
      projectManagerRole.permissions.push(projectsCreatePerm._id);
      await projectManagerRole.save();
      console.log('✅ Added projects.create to projectManager role');
    } else {
      console.log('✅ projectManager role already has projects.create');
    }

    // Also add all other projects permissions to projectManager
    const projectsPerms = await Permission.find({ resource: 'projects' });
    console.log(`\n📋 Adding all ${projectsPerms.length} projects permissions to projectManager:`);
    
    for (const perm of projectsPerms) {
      const hasPerm = projectManagerRole.permissions.some(pid => pid.equals(perm._id));
      if (!hasPerm) {
        projectManagerRole.permissions.push(perm._id);
        console.log(`   • Added ${perm.name}`);
      } else {
        console.log(`   • Already has ${perm.name}`);
      }
    }

    await projectManagerRole.save();

    // Verify the user has the role
    const user = await User.findOne({ username: 'newmanp57' })
      .populate({
        path: 'roles',
        populate: { path: 'permissions' }
      });

    if (!user) {
      console.log('\n⚠️  User newmanp57 not found');
      process.exit(0);
    }

    console.log(`\n👤 User: ${user.username}`);
    console.log(`   Has projectManager role? ${user.roles.some(r => r.name === 'projectManager') ? 'YES ✅' : 'NO ❌'}`);
    
    if (user.roles.some(r => r.name === 'projectManager')) {
      const pmRole = user.roles.find(r => r.name === 'projectManager');
      const hasCreatePerm = pmRole.permissions.some(p => p.name === 'projects.create');
      console.log(`   Has projects.create permission? ${hasCreatePerm ? 'YES ✅' : 'NO ❌'}`);
    }

    console.log('\n✅ All permissions verified and updated!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

fixProjectManagerRole();
