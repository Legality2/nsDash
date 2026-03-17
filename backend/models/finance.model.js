import mongoose from 'mongoose';

/* ── Watchlist ticker ── */
const tickerSchema = new mongoose.Schema({
  symbol:  { type: String, required: true, uppercase: true, trim: true },
  company: { type: String, required: true },
  price:   { type: Number, required: true },
  change:  { type: Number, default: 0 },       // percentage
  sparkline: [Number],                           // last 7 data points
  sector:  { type: String, default: 'Other' },
}, { timestamps: true });

/* ── Transaction ── */
const transactionSchema = new mongoose.Schema({
  symbol: { type: String, required: true, uppercase: true },
  type:   { type: String, enum: ['BUY', 'SELL'], required: true },
  amount: { type: Number, required: true },
  date:   { type: Date, default: Date.now },
});

/* ── Portfolio snapshot ── */
const portfolioSchema = new mongoose.Schema({
  totalValue:   { type: Number, default: 0 },
  dailyChange:  { type: Number, default: 0 },
  sp500:        { type: Number, default: 0 },
  sp500Change:  { type: Number, default: 0 },
  btcUsd:       { type: Number, default: 0 },
  btcChange:    { type: Number, default: 0 },
  treasury10y:  { type: Number, default: 0 },
  treasuryChange: { type: Number, default: 0 },
  sectors: [{ name: String, allocation: Number }],
  updatedAt: { type: Date, default: Date.now },
});

export const Ticker      = mongoose.model('Ticker',      tickerSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Portfolio   = mongoose.model('Portfolio',   portfolioSchema);
