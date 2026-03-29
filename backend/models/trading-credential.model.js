import mongoose from 'mongoose';

const tradingCredentialSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  exchange: {
    type: String,
    enum: ['coinbase', 'alpaca'],
    required: true,
  },
  apiKeyEncrypted: {
    type: String,
    required: true,
  },
  apiSecretEncrypted: {
    type: String,
    required: true,
  },
  passphraseEncrypted: {
    type: String,
    default: '',
  },
  keyHint: {
    type: String,
    default: '',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

tradingCredentialSchema.index({ userId: 1, exchange: 1 }, { unique: true });

export const TradingCredential = mongoose.model('TradingCredential', tradingCredentialSchema);
