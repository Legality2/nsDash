export type Exchange    = 'coinbase' | 'alpaca';
export type AssetType   = 'crypto' | 'stock';
export type Strategy    = 'ma_crossover' | 'rsi_reversal' | 'macd' | 'bollinger' | 'dca';
export type BotStatus   = 'idle' | 'running' | 'paused' | 'error';
export type OrderSide   = 'buy' | 'sell';
export type OrderStatus = 'filled' | 'cancelled' | 'pending';
export type TradeEnv    = 'sandbox' | 'live';
export type DcaInterval = 'hourly' | 'daily' | 'weekly';

export interface StrategyParams {
  fastPeriod:    number;
  slowPeriod:    number;
  rsiPeriod:     number;
  rsiOversold:   number;
  rsiOverbought: number;
  macdFast:      number;
  macdSlow:      number;
  macdSignal:    number;
  bbPeriod:      number;
  bbStdDev:      number;
  dcaAmount:     number;
  dcaInterval:   DcaInterval;
  positionSize:  number;
  stopLoss:      number;
  takeProfit:    number;
  maxOpenTrades: number;
}

export interface BotPerformance {
  totalPnl:    number;
  totalTrades: number;
  winRate:     number;
  lastUpdated: string;
}

export interface TradingBot {
  _id:         string;
  name:        string;
  exchange:    Exchange;
  assetType:   AssetType;
  pair:        string;
  strategy:    Strategy;
  status:      BotStatus;
  params:      Partial<StrategyParams>;
  performance: Partial<BotPerformance>;
  createdAt:   string;
}

export interface BotOrder {
  _id:       string;
  botId:     string;
  botName:   string;
  exchange:  Exchange;
  pair:      string;
  side:      OrderSide;
  amount:    number;
  price:     number;
  strategy:  string;
  status:    OrderStatus;
  pnl:       number;
  signal:    string;
  createdAt: string;
}

export interface ExchangeConfig {
  _id:            string;
  exchange:       Exchange;
  environment:    TradeEnv;
  connected:      boolean;
  hasCredentials: boolean;
  usesUserKeys?:  boolean;
  keyHint?:       string;
  label:          string;
}

/* Form model used by the create-bot UI */
export interface BotFormData {
  name:         string;
  exchange:     Exchange;
  assetType:    AssetType;
  pair:         string;
  strategy:     Strategy;
  fastPeriod:   number;
  slowPeriod:   number;
  rsiPeriod:    number;
  rsiOversold:  number;
  rsiOverbought:number;
  macdFast:     number;
  macdSlow:     number;
  macdSignal:   number;
  bbPeriod:     number;
  bbStdDev:     number;
  dcaAmount:    number;
  dcaInterval:  DcaInterval;
  positionSize: number;
  stopLoss:     number;
  takeProfit:   number;
  maxOpenTrades:number;
}
