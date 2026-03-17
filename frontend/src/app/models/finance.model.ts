export interface Portfolio {
  totalValue: number; dailyChange: number;
  sp500: number; sp500Change: number;
  btcUsd: number; btcChange: number;
  treasury10y: number; treasuryChange: number;
  sectors: { name: string; allocation: number }[];
}

export interface Ticker {
  _id: string; symbol: string; company: string;
  price: number; change: number; sparkline: number[]; sector: string;
}

export interface Transaction {
  _id: string; symbol: string; type: 'BUY' | 'SELL'; amount: number; date: string;
}

export interface ExcelParseResult {
  tickers:      Partial<Ticker>[];
  transactions: Partial<Transaction>[];
  sheets:       string[];
}
