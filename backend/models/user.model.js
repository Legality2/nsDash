import mongoose  from 'mongoose';
import bcryptjs  from 'bcryptjs';

/* ─────────────────────────────────────────────
   Schema
───────────────────────────────────────────── */
const userSchema = new mongoose.Schema({
  username: {
    type:      String,
    required:  true,
    unique:    true,
    trim:      true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type:      String,
    required:  true,
    unique:    true,
    lowercase: true,
    trim:      true,
    // RFC-5321 practical regex: local@domain.tld
    match: [/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/, 'Invalid email address'],
    maxlength: 254,   // RFC 5321 max email length
  },
  password: {
    type:      String,
    required:  true,
    minlength: 8,     // enforced at API layer too; guard here for direct model use
    maxlength: 128,   // prevent bcrypt DoS (bcrypt silently truncates at 72 bytes; hard cap here)
  },
  roles: [{
    type: mongoose.Schema.Types.ObjectId,
    ref:  'Role',
  }],
  isActive: {
    type:    Boolean,
    default: true,
  },
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

/* ─────────────────────────────────────────────
   Pre-save hook — hash password
   bcrypt cost factor 12 (up from 10) gives ~300 ms on modern hardware,
   making offline brute-force attacks significantly more expensive.
───────────────────────────────────────────── */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt    = await bcryptjs.genSalt(12);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

/* ─────────────────────────────────────────────
   Instance methods
───────────────────────────────────────────── */

/** Constant-time password comparison via bcrypt. */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

/** Populate roles + permissions (convenience helper). */
userSchema.methods.populatePermissions = async function () {
  await this.populate({ path: 'roles', populate: { path: 'permissions' } });
  return this;
};

/** Returns true if this user holds the named permission on the given resource. */
userSchema.methods.hasPermission = function (resource, action) {
  if (!this.roles?.length) return false;

  return this.roles.some(role =>
    role.permissions?.some(perm =>
      perm.resource === resource && perm.action === action
    )
  );
};

/** Returns true if this user holds the named role. */
userSchema.methods.hasRole = function (roleName) {
  if (!this.roles?.length) return false;
  return this.roles.some(role => role.name === roleName);
};

export default mongoose.model('User', userSchema);
