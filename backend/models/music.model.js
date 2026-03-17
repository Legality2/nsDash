import mongoose from 'mongoose';

/* ── Track ── */
const trackSchema = new mongoose.Schema({
  rank:     { type: Number, required: true },
  title:    { type: String, required: true },
  artist:   { type: String, required: true },
  album:    { type: String, default: '' },
  duration: { type: String, default: '3:00' },  // "m:ss"
  gradient: { type: String, default: 'linear-gradient(135deg,#6c63ff,#8b5cf6)' },
  emoji:    { type: String, default: '🎵' },
  streams:  { type: Number, default: 0 },
  genre:    { type: String, default: 'Pop' },
}, { timestamps: true });

/* ── Podcast ── */
const podcastSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  host:     { type: String, default: '' },
  category: { type: String, default: 'General' },
  live:     { type: Boolean, default: false },
  listeners:{ type: Number, default: 0 },
}, { timestamps: true });

/* ── Music stats ── */
const musicStatsSchema = new mongoose.Schema({
  streamsToday:    { type: Number, default: 0 },
  streamsDelta:    { type: Number, default: 0 },
  newReleases:     { type: Number, default: 0 },
  podcastsLive:    { type: Number, default: 0 },
  listeningHours:  { type: Number, default: 0 },
  genres: [{ name: String, pct: Number, color: String }],
  nowPlaying: {
    title:    String,
    artist:   String,
    album:    String,
    progress: Number,   // 0–100
    duration: String,
    elapsed:  String,
    gradient: String,
    emoji:    String,
  },
  updatedAt: { type: Date, default: Date.now },
});

export const Track      = mongoose.model('Track',      trackSchema);
export const Podcast    = mongoose.model('Podcast',    podcastSchema);
export const MusicStats = mongoose.model('MusicStats', musicStatsSchema);
