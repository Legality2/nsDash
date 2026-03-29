import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
      default: 'planning'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    visibility: {
      type: String,
      enum: ['private', 'public'],
      default: 'private'
    },
    accessList: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        permission: {
          type: String,
          enum: ['view', 'edit'],
          default: 'view'
        },
        grantedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    startDate: { type: Date },
    endDate: { type: Date },
    budget: { type: Number },
    actualCost: { type: Number, default: 0 },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    category: {
      type: String,
      enum: ['finance', 'fashion', 'music', 'general'],
      default: 'general'
    },
    tags: [String],
    attachments: [
      {
        name: String,
        url: String,
        uploadedAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model('Project', projectSchema);
