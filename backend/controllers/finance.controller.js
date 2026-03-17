import multer from 'multer';
import xlsx   from 'xlsx';
import { Ticker, Transaction, Portfolio } from '../models/finance.model.js';

/* ─────────────────────────────────────────────
   Upload middleware — Excel / CSV only, 10 MB
───────────────────────────────────────────── */
export const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    /\.(xlsx|xls|csv)$/i.test(file.originalname)
      ? cb(null, true)
      : cb(new Error('Only .xlsx, .xls, or .csv files are accepted'));
  },
});

/* ─────────────────────────────────────────────
   Private Excel parsing helpers
───────────────────────────────────────────── */
function detectType(row0) {
  const keys      = Object.keys(row0).join(' ').toLowerCase();
  const hasDate   = /date|time/.test(keys);
  const hasType   = /type|action|side/.test(keys);
  const hasSymbol = /symbol|ticker|stock/.test(keys);
  if (hasDate && (hasType || hasSymbol)) return 'transactions';
  if (hasSymbol)                         return 'tickers';
  return 'unknown';
}

function parseTickerRows(rows) {
  if (!rows.length) return [];
  const keys  = Object.keys(rows[0]);
  const sym   = keys.find(k => /symbol|ticker|stock/i.test(k));
  const comp  = keys.find(k => /company|name|desc/i.test(k));
  const price = keys.find(k => /price|last|close/i.test(k));
  const chg   = keys.find(k => /change|chg|delta|%/i.test(k));
  const sect  = keys.find(k => /sector|industry|category/i.test(k));
  if (!sym) return [];
  return rows.filter(r => r[sym]).map(r => ({
    symbol:    String(r[sym]   ?? '').toUpperCase().trim(),
    company:   String(r[comp]  ?? r[sym] ?? ''),
    price:     parseFloat(r[price]) || 0,
    change:    parseFloat(r[chg])   || 0,
    sector:    String(r[sect]  ?? 'Other'),
    sparkline: [],
  }));
}

function parseTransactionRows(rows) {
  if (!rows.length) return [];
  const keys  = Object.keys(rows[0]);
  const sym   = keys.find(k => /symbol|ticker|asset|stock/i.test(k));
  const dateK = keys.find(k => /date|time|when/i.test(k));
  const typeK = keys.find(k => /type|action|side|dir/i.test(k));
  const amtK  = keys.find(k => /amount|value|total|notional/i.test(k));
  if (!sym) return [];
  return rows.filter(r => r[sym]).map(r => {
    const raw  = dateK ? new Date(r[dateK]) : new Date();
    const t    = typeK ? String(r[typeK] ?? '').toUpperCase() : 'BUY';
    return {
      symbol: String(r[sym] ?? '').toUpperCase().trim(),
      type:   /sell/.test(t) ? 'SELL' : 'BUY',
      amount: parseFloat(r[amtK]) || 0,
      date:   (isNaN(raw.getTime()) ? new Date() : raw).toISOString(),
    };
  });
}

/* ─────────────────────────────────────────────
   Controllers
───────────────────────────────────────────── */
export async function getPortfolio(_req, res, next) {
  try {
    const portfolio = await Portfolio.findOne().sort({ updatedAt: -1 });
    res.json(portfolio);
  } catch (err) { next(err); }
}

export async function getTickers(_req, res, next) {
  try {
    const tickers = await Ticker.find().sort({ symbol: 1 });
    res.json(tickers);
  } catch (err) { next(err); }
}

export async function getTicker(req, res, next) {
  try {
    const ticker = await Ticker.findOne({ symbol: req.params.symbol.toUpperCase() });
    if (!ticker) return res.status(404).json({ error: 'Ticker not found' });
    res.json(ticker);
  } catch (err) { next(err); }
}

export async function createTicker(req, res, next) {
  try {
    const ticker = await Ticker.create(req.body);
    res.status(201).json(ticker);
  } catch (err) { next(err); }
}

export async function updateTicker(req, res, next) {
  try {
    const ticker = await Ticker.findOneAndUpdate(
      { symbol: req.params.symbol.toUpperCase() },
      req.body,
      { new: true, runValidators: true },
    );
    if (!ticker) return res.status(404).json({ error: 'Ticker not found' });
    res.json(ticker);
  } catch (err) { next(err); }
}

export async function getTransactions(_req, res, next) {
  try {
    const txns = await Transaction.find().sort({ date: -1 }).limit(20);
    res.json(txns);
  } catch (err) { next(err); }
}

export async function createTransaction(req, res, next) {
  try {
    const txn = await Transaction.create(req.body);
    res.status(201).json(txn);
  } catch (err) { next(err); }
}

export function parseExcel(req, res, next) {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    let workbook;
    try {
      workbook = xlsx.read(req.file.buffer, { type: 'buffer', cellDates: true });
    } catch {
      return res.status(400).json({ error: 'Invalid or corrupt spreadsheet' });
    }

    let tickers      = [];
    let transactions = [];

    for (const sheetName of workbook.SheetNames) {
      const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
      if (!rows.length) continue;

      const nameLow   = sheetName.toLowerCase();
      const type      = detectType(rows[0]);
      const isTickers = /ticker|stock|watch|portfolio/.test(nameLow) || type === 'tickers';
      const isTx      = /transaction|trade|history/.test(nameLow)    || type === 'transactions';

      if (isTx && !transactions.length)       transactions = parseTransactionRows(rows);
      else if (isTickers && !tickers.length)  tickers      = parseTickerRows(rows);
      else if (!tickers.length)               tickers      = parseTickerRows(rows);
    }

    res.json({ tickers, transactions, sheets: workbook.SheetNames });
  } catch (err) { next(err); }
}
