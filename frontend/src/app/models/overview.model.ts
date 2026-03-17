export interface OverviewStats {
  finance: { portfolioValue: number; dailyChange: number };
  fashion: { trendingItems: number; newDrops: number };
  music:   { streamsToday: number;  streamsDelta: number };
}
