import { Look, Brand, FashionStats } from '../models/fashion.model.js';

export async function getStats(_req, res, next) {
  try {
    const stats = await FashionStats.findOne().sort({ updatedAt: -1 });
    res.json(stats);
  } catch (err) { next(err); }
}

export async function getLooks(req, res, next) {
  try {
    const { category, limit = 12 } = req.query;
    const filter = category ? { category } : {};
    const looks  = await Look.find(filter).sort({ createdAt: -1 }).limit(Number(limit));
    res.json(looks);
  } catch (err) { next(err); }
}

export async function createLook(req, res, next) {
  try {
    const look = await Look.create(req.body);
    res.status(201).json(look);
  } catch (err) { next(err); }
}

export async function toggleSaveLook(req, res, next) {
  try {
    const look = await Look.findByIdAndUpdate(
      req.params.id,
      [{ $set: { saved: { $not: '$saved' } } }],
      { new: true },
    );
    if (!look) return res.status(404).json({ error: 'Look not found' });
    res.json(look);
  } catch (err) { next(err); }
}

export async function deleteLook(req, res, next) {
  try {
    await Look.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
}

export async function getBrands(_req, res, next) {
  try {
    const brands = await Brand.find().sort({ score: -1 }).limit(10);
    res.json(brands);
  } catch (err) { next(err); }
}

export async function createBrand(req, res, next) {
  try {
    const brand = await Brand.create(req.body);
    res.status(201).json(brand);
  } catch (err) { next(err); }
}
