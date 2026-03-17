import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  resource: {
    type: String,
    required: true,
    enum: ['finance', 'fashion', 'music', 'users', 'roles', 'reports', 'settings', 'projects']
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'manage']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Permission', permissionSchema);
