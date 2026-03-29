import { createCipheriv, createHash, randomBytes } from 'crypto';
import { TradingBot, BotOrder, ExchangeConfig } from '../models/trading.model.js';
import { TradingCredential } from '../models/trading-credential.model.js';

/* ─── Helpers ──────────────────────────────────────────────── */

const SUPPORTED_EXCHANGES = ['coinbase', 'alpaca'];

function isValidExchange(exchange) {
  return SUPPORTED_EXCHANGES.includes(exchange);
}

function getUserId(req) {
  return req.user?.id;
}

function getEncryptionKey() {
  const seed = (process.env.TRADING_KEYS_ENCRYPTION_KEY || process.env.JWT_SECRET || '').trim();
  if (!seed) {
    throw new Error('Server is missing TRADING_KEYS_ENCRYPTION_KEY (or JWT_SECRET fallback)');
  }
  return createHash('sha256').update(seed).digest();
}

function encryptSecret(plain) {
  const iv = randomBytes(12);
  const key = getEncryptionKey();
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
}

function maskKey(apiKey) {
  const clean = String(apiKey || '').trim();
  if (!clean) return '';
  if (clean.length <= 8) return '*'.repeat(clean.length);
  return `${clean.slice(0, 4)}••••${clean.slice(-4)}`;
}

function toPublicConfig(config, credential) {
  const hasUserCreds = !!(credential?.apiKeyEncrypted && credential?.apiSecretEncrypted);
  return {
    ...config,
    connected: hasUserCreds,
    hasCredentials: hasUserCreds,
    usesUserKeys: true,
    keyHint: credential?.keyHint || '',
  };
}

/* ─── Exchange Configs ─────────────────────────────────────── */

export async function getExchangeConfigs(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    // Ensure both exchange docs exist (upsert defaults on first read)
    await Promise.all(SUPPORTED_EXCHANGES.map(ex =>
      ExchangeConfig.findOneAndUpdate(
        { exchange: ex },
        { $setOnInsert: { exchange: ex } },
        { upsert: true, new: true }
      )
    ));

    const [configs, creds] = await Promise.all([
      ExchangeConfig.find().lean(),
      TradingCredential.find({ userId }).lean(),
    ]);

    const credsByExchange = new Map(creds.map(c => [c.exchange, c]));
    const enriched = configs.map(c => toPublicConfig(c, credsByExchange.get(c.exchange)));
    res.json(enriched);
  } catch (err) { next(err); }
}

export async function upsertExchangeConfig(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { exchange, environment, label } = req.body;
    if (!isValidExchange(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange. Use: coinbase | alpaca' });
    }

    const cred = await TradingCredential.findOne({ userId, exchange }).lean();
    const connected = !!(cred?.apiKeyEncrypted && cred?.apiSecretEncrypted);

    const config = await ExchangeConfig.findOneAndUpdate(
      { exchange },
      { environment: environment || 'sandbox', label: label || '', connected },
      { upsert: true, new: true, runValidators: true }
    ).lean();
    res.json(toPublicConfig(config, cred));
  } catch (err) { next(err); }
}

export async function saveExchangeCredentials(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { exchange, apiKey, apiSecret, passphrase } = req.body;

    if (!isValidExchange(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange. Use: coinbase | alpaca' });
    }
    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: 'apiKey and apiSecret are required' });
    }

    const credential = await TradingCredential.findOneAndUpdate(
      { userId, exchange },
      {
        apiKeyEncrypted: encryptSecret(apiKey),
        apiSecretEncrypted: encryptSecret(apiSecret),
        passphraseEncrypted: passphrase ? encryptSecret(passphrase) : '',
        keyHint: maskKey(apiKey),
        updatedAt: new Date(),
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    const config = await ExchangeConfig.findOneAndUpdate(
      { exchange },
      { $setOnInsert: { exchange }, connected: true },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({
      message: `Credentials saved for ${exchange}`,
      config: toPublicConfig(config, credential),
    });
  } catch (err) { next(err); }
}

export async function clearExchangeCredentials(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { exchange } = req.params;
    if (!isValidExchange(exchange)) {
      return res.status(400).json({ error: 'Invalid exchange. Use: coinbase | alpaca' });
    }

    await TradingCredential.findOneAndDelete({ userId, exchange });

    const config = await ExchangeConfig.findOneAndUpdate(
      { exchange },
      { $setOnInsert: { exchange }, connected: false },
      { upsert: true, new: true, runValidators: true }
    ).lean();

    res.json({
      message: `Credentials removed for ${exchange}`,
      config: toPublicConfig(config, null),
    });
  } catch (err) { next(err); }
}

/* ─── Trading Bots ─────────────────────────────────────────── */

export async function getBots(req, res, next) {
  try {
    const bots = await TradingBot.find().sort({ createdAt: -1 }).lean();
    res.json(bots);
  } catch (err) { next(err); }
}

export async function createBot(req, res, next) {
  try {
    const { name, exchange, assetType, pair, strategy, params } = req.body;
    if (!name || !exchange || !assetType || !pair || !strategy) {
      return res.status(400).json({ error: 'name, exchange, assetType, pair, strategy are required' });
    }
    const bot = await TradingBot.create({ name, exchange, assetType, pair, strategy, params });
    res.status(201).json(bot);
  } catch (err) { next(err); }
}

export async function updateBot(req, res, next) {
  try {
    const bot = await TradingBot.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    ).lean();
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    res.json(bot);
  } catch (err) { next(err); }
}

export async function deleteBot(req, res, next) {
  try {
    const bot = await TradingBot.findByIdAndDelete(req.params.id);
    if (!bot) return res.status(404).json({ error: 'Bot not found' });
    await BotOrder.deleteMany({ botId: req.params.id });
    res.json({ message: 'Bot and its orders deleted' });
  } catch (err) { next(err); }
}

export async function setBotStatus(req, res, next) {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ error: 'Authentication required' });

    const { status } = req.body;
    if (!['idle', 'running', 'paused'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Use: idle | running | paused' });
    }

    const existingBot = await TradingBot.findById(req.params.id).lean();
    if (!existingBot) return res.status(404).json({ error: 'Bot not found' });

    if (status === 'running') {
      const cred = await TradingCredential.findOne({ userId, exchange: existingBot.exchange }).lean();
      const hasCreds = !!(cred?.apiKeyEncrypted && cred?.apiSecretEncrypted);
      if (!hasCreds) {
        return res.status(400).json({
          error: `Add your ${existingBot.exchange} API credentials before starting this bot`,
        });
      }
    }

    const bot = await TradingBot.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    ).lean();
    res.json(bot);
  } catch (err) { next(err); }
}

/* ─── Bot Orders ───────────────────────────────────────────── */

export async function getBotOrders(req, res, next) {
  try {
    const filter = req.query.botId ? { botId: req.query.botId } : {};
    const orders = await BotOrder.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    res.json(orders);
  } catch (err) { next(err); }
}

export async function createBotOrder(req, res, next) {
  try {
    const { botId, side, amount, price, signal } = req.body;
    if (!botId || !side || !amount) {
      return res.status(400).json({ error: 'botId, side, amount are required' });
    }
    if (!['buy', 'sell'].includes(side)) {
      return res.status(400).json({ error: 'side must be buy or sell' });
    }

    const bot = await TradingBot.findById(botId).lean();
    if (!bot) return res.status(404).json({ error: 'Bot not found' });

    const order = await BotOrder.create({
      botId,
      botName:  bot.name,
      exchange: bot.exchange,
      pair:     bot.pair,
      side,
      amount,
      price:    price ?? 0,
      strategy: bot.strategy,
      status:   'filled',
      signal:   signal ?? '',
    });

    // Update performance counter
    await TradingBot.findByIdAndUpdate(botId, {
      $inc: { 'performance.totalTrades': 1 },
      'performance.lastUpdated': new Date(),
    });

    res.status(201).json(order);
  } catch (err) { next(err); }
}
