export interface PhotoStats {
  totalShoots:      number;
  shootsDelta:      string;
  activeClients:    number;
  clientsDelta:     string;
  photosDelivered:  number;
  deliveredDelta:   string;
  revenueMtd:       number;
  revenueDelta:     string;
  storageUsedGb:    number;
  storageTotalGb:   number;
  revenueByType: { type: string; amount: number; pct: number; color: string }[];
}

export interface PhotoShoot {
  _id:     string;
  name:    string;
  client:  string;
  type:    string;
  date:    string;
  status:  'Scheduled' | 'In Session' | 'Editing' | 'Delivered' | 'Archived';
  photos:  number;
}

export interface PhotoClient {
  _id:          string;
  name:         string;
  type:         string;
  lastShoot:    string;
  totalShoots:  number;
  totalSpend:   number;
}

export interface PhotoEquipment {
  _id:      string;
  name:     string;
  category: string;
  status:   'Ready' | 'In Use' | 'Charging' | 'Service';
  battery:  number | null;
}

export interface PhotoGallery {
  _id:           string;
  title:         string;
  count:         number;
  coverGradient: string;
  coverEmoji:    string;
  deliveredAt:   string | null;
  client:        string;
  status:        string;
}
