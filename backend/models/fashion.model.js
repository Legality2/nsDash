import mongoose from 'mongoose';

/* ── Look / outfit card ── */
const lookSchema = new mongoose.Schema({
  label:    { type: String, required: true },
  price:    { type: Number, required: true },
  emoji:    { type: String, default: '👗' },
  gradient: { type: String, default: 'linear-gradient(135deg,#1a1a2e,#16213e)' },
  category: { type: String, default: 'General' },
  tags:     [String],
  saved:    { type: Boolean, default: false },
}, { timestamps: true });

/* ── Brand ── */
const brandSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  category: { type: String, default: 'General' },
  trend:    { type: String, enum: ['Hot', 'Rising', 'Steady', 'Declining'], default: 'Steady' },
  score:    { type: Number, min: 0, max: 100, default: 50 },
}, { timestamps: true });

/* ── Fashion stats (aggregate doc) ── */
const fashionStatsSchema = new mongoose.Schema({
  trendingItems: { type: Number, default: 0 },
  trendingDelta: { type: Number, default: 0 },
  newDrops:      { type: Number, default: 0 },
  savedLooks:    { type: Number, default: 0 },
  styleMatch:    { type: Number, default: 0 },
  categories: [{ name: String, score: Number, color: String }],
  updatedAt: { type: Date, default: Date.now },
});

export const Look         = mongoose.model('Look',         lookSchema);
export const Brand        = mongoose.model('Brand',        brandSchema);
export const FashionStats = mongoose.model('FashionStats', fashionStatsSchema);
