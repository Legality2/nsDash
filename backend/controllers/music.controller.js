import { Track, Podcast, MusicStats } from '../models/music.model.js';

export async function getStats(_req, res, next) {
  try {
    const stats = await MusicStats.findOne().sort({ updatedAt: -1 });
    res.json(stats);
  } catch (err) { next(err); }
}

export async function getTracks(req, res, next) {
  try {
    const { genre, limit = 20 } = req.query;
    const filter = genre ? { genre } : {};
    const tracks = await Track.find(filter).sort({ rank: 1 }).limit(Number(limit));
    res.json(tracks);
  } catch (err) { next(err); }
}

export async function getTrack(req, res, next) {
  try {
    const track = await Track.findById(req.params.id);
    if (!track) return res.status(404).json({ error: 'Track not found' });
    res.json(track);
  } catch (err) { next(err); }
}

export async function createTrack(req, res, next) {
  try {
    const track = await Track.create(req.body);
    res.status(201).json(track);
  } catch (err) { next(err); }
}

export async function updateNowPlaying(req, res, next) {
  try {
    const stats = await MusicStats.findOneAndUpdate(
      {},
      { $set: { nowPlaying: req.body, updatedAt: new Date() } },
      { new: true, sort: { updatedAt: -1 } },
    );
    res.json(stats?.nowPlaying);
  } catch (err) { next(err); }
}

export async function getPodcasts(_req, res, next) {
  try {
    const podcasts = await Podcast.find().sort({ listeners: -1 }).limit(10);
    res.json(podcasts);
  } catch (err) { next(err); }
}
