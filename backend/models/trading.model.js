import mongoose from 'mongoose';

/* ── Strategy parameters (sub-schema, no _id) ── */
const strategyParamsSchema = new mongoose.Schema({
  // MA Crossover — Exponential Moving Average crossover
  fastPeriod:      { type: Number, default: 10  },
  slowPeriod:      { type: Number, default: 20  },
  // RSI Mean Reversion
  rsiPeriod:       { type: Number, default: 14  },
  rsiOversold:     { type: Number, default: 30  },
  rsiOverbought:   { type: Number, default: 70  },
  // MACD
  macdFast:        { type: Number, default: 12  },
  macdSlow:        { type: Number, default: 26  },
  macdSignal:      { type: Number, default: 9   },
  // Bollinger Bands
  bbPeriod:        { type: Number, default: 20  },
  bbStdDev:        { type: Number, default: 2   },
  // Dollar Cost Averaging
  dcaAmount:       { type: Number, default: 100 },
  dcaInterval:     { type: String, enum: ['hourly', 'daily', 'weekly'], default: 'daily' },
  // Universal risk management
  positionSize:    { type: Number, default: 500 },  // USD per trade
  stopLoss:        { type: Number, default: 2   },  // %
  takeProfit:      { type: Number, default: 4   },  // %
  maxOpenTrades:   { type: Number, default: 3   },
}, { _id: false });

/* ── Bot performance snapshot (sub-schema) ── */
const performanceSchema = new mongoose.Schema({
  totalPnl:    { type: Number, default: 0 },
  totalTrades: { type: Number, default: 0 },
  winRate:     { type: Number, default: 0 },  // 0-100 %
  lastUpdated: { type: Date,   default: Date.now },
}, { _id: false });

/* ── Trading Bot ── */
const tradingBotSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },
  exchange:  { type: String, enum: ['coinbase', 'alpaca'],                              required: true },
  assetType: { type: String, enum: ['crypto', 'stock'],                                required: true },
  pair:      { type: String, required: true, uppercase: true, trim: true },
  strategy:  { type: String, enum: ['ma_crossover', 'rsi_reversal', 'macd', 'bollinger', 'dca'], required: true },
  status:    { type: String, enum: ['idle', 'running', 'paused', 'error'], default: 'idle' },
  params:      { type: strategyParamsSchema, default: () => ({}) },
  performance: { type: performanceSchema,   default: () => ({}) },
}, { timestamps: true });

/* ── Bot Order — records every executed or simulated trade ── */
const botOrderSchema = new mongoose.Schema({
  botId:    { type: mongoose.Schema.Types.ObjectId, ref: 'TradingBot', required: true },
  botName:  { type: String },
  exchange: { type: String, enum: ['coinbase', 'alpaca'] },
  pair:     { type: String, uppercase: true },
  side:     { type: String, enum: ['buy', 'sell'], required: true },
  amount:   { type: Number, required: true },   // USD notional
  price:    { type: Number, default: 0 },
  strategy: { type: String },
  status:   { type: String, enum: ['filled', 'cancelled', 'pending'], default: 'pending' },
  pnl:      { type: Number, default: 0 },
  signal:   { type: String },                   // human-readable trigger reason
}, { timestamps: true });

/* ── Exchange Connection Config — one doc per exchange ── */
const exchangeConfigSchema = new mongoose.Schema({
  exchange:    { type: String, enum: ['coinbase', 'alpaca'], required: true, unique: true },
  environment: { type: String, enum: ['sandbox', 'live'], default: 'sandbox' },
  connected:   { type: Boolean, default: false },
  label:       { type: String, default: '' },
}, { timestamps: true });

export const TradingBot     = mongoose.model('TradingBot',     tradingBotSchema);
export const BotOrder       = mongoose.model('BotOrder',       botOrderSchema);
export const ExchangeConfig = mongoose.model('ExchangeConfig', exchangeConfigSchema);
