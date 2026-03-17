import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  type: {
    type: String,
    enum: ['system', 'custom'],
    default: 'system'
  },
  // Parent role for hierarchy (e.g., a custom Finance Manager inherits from Finance Manager)
  parentRole: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    default: null
  },
  // Direct permissions assigned to this role
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  // For tracking who created custom roles
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual to get all permissions including inherited ones
roleSchema.virtual('allPermissions').get(function() {
  // This will be populated by the controller
  return this.permissions;
});

export default mongoose.model('Role', roleSchema);
