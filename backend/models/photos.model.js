import mongoose from 'mongoose';

const SHOOT_TYPES    = ['Wedding', 'Commercial', 'Portrait', 'Event', 'Editorial', 'Newborn', 'Real Estate', 'Corporate', 'Family'];
const SHOOT_STATUSES = ['Inquiry', 'Booked', 'In Session', 'Editing', 'Review', 'Delivered', 'Archived'];

/* ── Photo Shoot ── */
const shootSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  clientName:      { type: String, required: true, trim: true },
  type:            { type: String, enum: SHOOT_TYPES,    required: true },
  status:          { type: String, enum: SHOOT_STATUSES, default: 'Inquiry' },
  date:            { type: Date,   required: true },
  startTime:       { type: String, default: '09:00' },
  duration:        { type: Number, default: 2 },       // hours
  location:        { type: String, default: '' },
  notes:           { type: String, default: '' },
  packageName:     { type: String, default: '' },
  price:           { type: Number, default: 0 },
  depositPaid:     { type: Boolean, default: false },
  contractSigned:  { type: Boolean, default: false },
  photos:          { type: Number, default: 0 },       // delivered count
}, { timestamps: true });

/* ── Photo Client (CRM) ── */
const clientSchema = new mongoose.Schema({
  name:        { type: String, required: true, trim: true },
  email:       { type: String, trim: true, lowercase: true, default: '' },
  phone:       { type: String, default: '' },
  type:        { type: String, enum: ['Individual', 'Business'], default: 'Individual' },
  leadStatus:  { type: String, enum: ['Lead', 'Active', 'Past'], default: 'Active' },
  tags:        [{ type: String }],
  totalShoots: { type: Number, default: 0 },
  totalSpend:  { type: Number, default: 0 },
  lastShoot:   { type: Date },
  notes:       { type: String, default: '' },
}, { timestamps: true });

/* ── Service Package ── */
const packageSchema = new mongoose.Schema({
  name:             { type: String, required: true, trim: true },
  category:         { type: String, enum: [...SHOOT_TYPES, 'Other'], default: 'Other' },
  price:            { type: Number, required: true },
  hours:            { type: Number, default: 4 },
  photosDelivered:  { type: Number, default: 50 },
  description:      { type: String, default: '' },
  includes:         [{ type: String }],
  active:           { type: Boolean, default: true },
  turnaroundDays:   { type: Number, default: 14 },
}, { timestamps: true });

/* ── Equipment / Gear ── */
const equipmentSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  category:     { type: String, enum: ['Body', 'Lens', 'Lighting', 'Support', 'Stabilizer', 'Storage', 'Drone', 'Accessory'], default: 'Accessory' },
  status:       { type: String, enum: ['Ready', 'In Use', 'Charging', 'Service', 'Retired'], default: 'Ready' },
  battery:      { type: Number, default: null },
  serialNumber: { type: String, default: '' },
  notes:        { type: String, default: '' },
  lastService:  { type: Date },
}, { timestamps: true });

/* ── Gallery Delivery ── */
const gallerySchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  clientName:     { type: String, default: '' },
  count:          { type: Number, default: 0 },
  coverGradient:  { type: String, default: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
  coverEmoji:     { type: String, default: '📸' },
  status:         { type: String, enum: ['In Session', 'Editing', 'Ready', 'Delivered', 'Archived'], default: 'Editing' },
  deliveredAt:    { type: Date, default: null },
  galleryUrl:     { type: String, default: '' },
  expiresAt:      { type: Date, default: null },
}, { timestamps: true });

export const PhotoShoot     = mongoose.model('PhotoShoot',     shootSchema);
export const PhotoClient    = mongoose.model('PhotoClient',    clientSchema);
export const PhotoPackage   = mongoose.model('PhotoPackage',   packageSchema);
export const PhotoEquipment = mongoose.model('PhotoEquipment', equipmentSchema);
export const PhotoGallery   = mongoose.model('PhotoGallery',   gallerySchema);
