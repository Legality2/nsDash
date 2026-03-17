export interface FashionStats {
  trendingItems: number; trendingDelta: number;
  newDrops: number; savedLooks: number; styleMatch: number;
  categories: { name: string; score: number; color: string }[];
}

export interface Look {
  _id: string; label: string; price: number;
  emoji: string; gradient: string; category: string; saved: boolean;
}

export interface Brand {
  _id: string; name: string; category: string;
  trend: 'Hot' | 'Rising' | 'Steady' | 'Declining'; score: number;
}

export interface DesignLayer {
  id:         string;
  name:       string;
  type:       'image' | 'color' | 'text';
  src:        string;
  color:      string;
  text:       string;
  fontSize:   number;
  fontFamily: string;
  x:          number;
  y:          number;
  width:      number;
  height:     number;
  rotation:   number;
  opacity:    number;
  visible:    boolean;
  locked:     boolean;
}
