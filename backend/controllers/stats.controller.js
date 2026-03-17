import { Portfolio }   from '../models/finance.model.js';
import { FashionStats } from '../models/fashion.model.js';
import { MusicStats }   from '../models/music.model.js';

export async function getOverview(_req, res, next) {
  try {
    const [portfolio, fashion, music] = await Promise.all([
      Portfolio.findOne().sort({ updatedAt: -1 }),
      FashionStats.findOne().sort({ updatedAt: -1 }),
      MusicStats.findOne().sort({ updatedAt: -1 }),
    ]);

    res.json({
      finance: {
        portfolioValue: portfolio?.totalValue ?? 0,
        dailyChange:    portfolio?.dailyChange ?? 0,
      },
      fashion: {
        trendingItems: fashion?.trendingItems ?? 0,
        newDrops:      fashion?.newDrops      ?? 0,
      },
      music: {
        streamsToday: music?.streamsToday ?? 0,
        streamsDelta: music?.streamsDelta ?? 0,
      },
    });
  } catch (err) { next(err); }
}
