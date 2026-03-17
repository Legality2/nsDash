/**
 * seed.js — populate MongoDB with sample data
 * Run: node seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { Ticker, Transaction, Portfolio } from './models/finance.model.js';
import { Look, Brand, FashionStats }      from './models/fashion.model.js';
import { Track, Podcast, MusicStats }     from './models/music.model.js';

await mongoose.connect(process.env.MONGODB_URI);
console.log('✅  Connected. Seeding…');

// Clear existing
await Promise.all([
  Ticker.deleteMany(), Transaction.deleteMany(), Portfolio.deleteMany(),
  Look.deleteMany(),   Brand.deleteMany(),        FashionStats.deleteMany(),
  Track.deleteMany(),  Podcast.deleteMany(),      MusicStats.deleteMany(),
]);

/* ── Finance ── */
await Portfolio.create({
  totalValue: 142000, dailyChange: 3240,
  sp500: 5891, sp500Change: 1.42,
  btcUsd: 96200, btcChange: -0.88,
  treasury10y: 4.28, treasuryChange: -0.04,
  sectors: [
    { name: 'Technology', allocation: 42 },
    { name: 'Healthcare',  allocation: 18 },
    { name: 'Consumer',    allocation: 22 },
    { name: 'Energy',      allocation: 10 },
    { name: 'Other',       allocation: 8  },
  ],
});

await Ticker.insertMany([
  { symbol: 'AAPL', company: 'Apple Inc.',   price: 218.44, change: 1.2,  sparkline: [22,18,20,10,14,8,6],   sector: 'Technology' },
  { symbol: 'NVDA', company: 'NVIDIA Corp.', price: 874.20, change: 4.2,  sparkline: [24,20,16,12,8,4,2],    sector: 'Technology' },
  { symbol: 'TSLA', company: 'Tesla Inc.',   price: 192.80, change: -2.1, sparkline: [6,8,10,14,18,20,24],   sector: 'Consumer' },
  { symbol: 'MSFT', company: 'Microsoft',    price: 414.56, change: 0.6,  sparkline: [18,16,18,14,12,10,8],  sector: 'Technology' },
  { symbol: 'AMZN', company: 'Amazon',       price: 198.30, change: 1.8,  sparkline: [20,17,15,13,11,9,7],   sector: 'Consumer' },
]);

await Transaction.insertMany([
  { symbol: 'NVDA', type: 'BUY',  amount: 4800, date: new Date('2026-02-28') },
  { symbol: 'TSLA', type: 'SELL', amount: 2100, date: new Date('2026-02-25') },
  { symbol: 'AAPL', type: 'BUY',  amount: 6540, date: new Date('2026-02-22') },
]);

/* ── Fashion ── */
await FashionStats.create({
  trendingItems: 2814, trendingDelta: 340,
  newDrops: 47, savedLooks: 183, styleMatch: 96,
  categories: [
    { name: 'Streetwear',  score: 68, color: '#d4556a' },
    { name: 'Luxury RTW',  score: 54, color: '#c77dff' },
    { name: 'Denim',       score: 81, color: '#457b9d' },
    { name: 'Footwear',    score: 77, color: '#e9c46a' },
    { name: 'Accessories', score: 45, color: '#2a9d8f' },
  ],
});

await Look.insertMany([
  { label: 'Noir Winter',  price: 340, emoji: '🧥', gradient: 'linear-gradient(135deg,#1a1a2e,#16213e)', category: 'Luxury RTW' },
  { label: 'Pastel Edit',  price: 128, emoji: '👗', gradient: 'linear-gradient(135deg,#ffecd2,#fcb69f)', category: 'Streetwear' },
  { label: 'Y2K Revival',  price: 89,  emoji: '✨', gradient: 'linear-gradient(135deg,#a8edea,#fed6e3)', category: 'Streetwear' },
  { label: 'Earth Tones',  price: 210, emoji: '🌿', gradient: 'linear-gradient(135deg,#2d6a4f,#40916c)', category: 'Denim' },
  { label: 'Terracotta',   price: 175, emoji: '👠', gradient: 'linear-gradient(135deg,#bc6c25,#dda15e)', category: 'Footwear' },
  { label: 'Neon Luxe',    price: 420, emoji: '💜', gradient: 'linear-gradient(135deg,#240046,#7b2d8b)', category: 'Luxury RTW' },
]);

await Brand.insertMany([
  { name: 'Bottega Veneta', category: 'Luxury',   trend: 'Hot',    score: 98 },
  { name: 'Jacquemus',      category: 'RTW',       trend: 'Rising', score: 87 },
  { name: 'New Balance',    category: 'Sneakers',  trend: 'Steady', score: 74 },
  { name: 'Toteme',         category: 'Minimal',   trend: 'Rising', score: 81 },
]);

/* ── Music ── */
await MusicStats.create({
  streamsToday: 1800000, streamsDelta: 18.4,
  newReleases: 124, podcastsLive: 38, listeningHours: 6.2,
  genres: [
    { name: 'Hip-Hop / R&B', pct: 38, color: '#6c63ff' },
    { name: 'Pop',           pct: 29, color: '#ff6b6b' },
    { name: 'Electronic',    pct: 16, color: '#4ecdc4' },
    { name: 'Indie / Alt',   pct: 11, color: '#ffe66d' },
    { name: 'Other',         pct: 6,  color: '#8a8a9a' },
  ],
  nowPlaying: {
    title: 'Not Like Us', artist: 'Kendrick Lamar', album: 'GNX',
    progress: 35, duration: '3:58', elapsed: '1:24',
    gradient: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', emoji: '🎵',
  },
});

await Track.insertMany([
  { rank: 1, title: 'Not Like Us',      artist: 'Kendrick Lamar',       album: 'GNX',                duration: '3:58', gradient: 'linear-gradient(135deg,#6c63ff,#8b5cf6)', emoji: '🎵', streams: 4200000, genre: 'Hip-Hop / R&B' },
  { rank: 2, title: 'APT.',             artist: 'ROSÉ & Bruno Mars',    album: 'Rosie',              duration: '2:57', gradient: 'linear-gradient(135deg,#ff6b6b,#ffd93d)', emoji: '🔥', streams: 3800000, genre: 'Pop' },
  { rank: 3, title: 'Espresso',         artist: 'Sabrina Carpenter',    album: 'Short n\' Sweet',    duration: '2:55', gradient: 'linear-gradient(135deg,#4ecdc4,#556270)', emoji: '🌊', streams: 3500000, genre: 'Pop' },
  { rank: 4, title: 'Birds of a Feather',artist: 'Billie Eilish',       album: 'HIT ME HARD AND SOFT',duration: '3:31', gradient: 'linear-gradient(135deg,#a29bfe,#fd79a8)', emoji: '💫', streams: 3200000, genre: 'Pop' },
  { rank: 5, title: 'Beautiful Things', artist: 'Benson Boone',         album: 'Fireworks & Rollerblades', duration: '3:38', gradient: 'linear-gradient(135deg,#fddb92,#d1fdff)', emoji: '☀️', streams: 2900000, genre: 'Pop' },
]);

await Podcast.insertMany([
  { title: 'The Daily',           host: 'NYT',           category: 'News',        live: true,  listeners: 4200000 },
  { title: 'Lex Fridman Podcast', host: 'Lex Fridman',   category: 'Technology',  live: false, listeners: 3100000 },
  { title: 'Crime Junkie',        host: 'Ashley Flowers', category: 'True Crime', live: false, listeners: 2700000 },
]);

console.log('🌱  Seed complete!');
await mongoose.disconnect();
