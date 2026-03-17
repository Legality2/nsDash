import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/user.model.js';
import Role from './models/role.model.js';

const assignRoleToUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📦 Connected to MongoDB');

    // Find the user
    const user = await User.findOne({ username: 'newmanp57' });
    if (!user) {
      console.log('❌ User "newmanp57" not found');
      process.exit(1);
    }

    // Find the projectManager role
    const projectManagerRole = await Role.findOne({ name: 'projectManager' });
    if (!projectManagerRole) {
      console.log('❌ Role "projectManager" not found');
      process.exit(1);
    }

    // Check if user already has the role
    const hasRole = user.roles.some(roleId => roleId.equals(projectManagerRole._id));
    if (hasRole) {
      console.log(`✅ User "${user.username}" already has the "projectManager" role`);
      process.exit(0);
    }

    // Add the role to the user
    user.roles.push(projectManagerRole._id);
    await user.save();

    console.log(`✅ Successfully assigned "projectManager" role to user "${user.username}"`);
    console.log(`   User now has roles: ${user.roles.length}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

assignRoleToUser();
