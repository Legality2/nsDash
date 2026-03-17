/* ─────────────────────────────────────────────────
   Photos Controller — Professional Photography Mgmt
   All data is seeded for demo; swap with DB models
   ───────────────────────────────────────────────── */

// ── Seeded data ────────────────────────────────────

const STATS = {
  totalShoots:       247,
  shootsDelta:       '+12 this month',
  activeClients:      38,
  clientsDelta:       '+3 new',
  photosDelivered:  14820,
  deliveredDelta:    '+892 this week',
  revenueMtd:        18400,
  revenueDelta:      '+22% vs last month',
  storageUsedGb:     1.24,
  storageTotalGb:    2.0,
  revenueByType: [
    { type: 'Wedding',    amount: 8200, pct: 78, color: '#f59e0b' },
    { type: 'Commercial', amount: 4500, pct: 60, color: '#00ffff' },
    { type: 'Portrait',   amount: 2800, pct: 45, color: '#9d00ff' },
    { type: 'Event',      amount: 1900, pct: 32, color: '#ff0080' },
    { type: 'Editorial',  amount: 1000, pct: 20, color: '#00ff00' },
  ],
};

const SHOOTS = [
  { _id: 's1', name: 'Chen Wedding',       client: 'Emma & James Chen',  type: 'Wedding',    date: '2026-03-20', status: 'Scheduled',  photos: 0   },
  { _id: 's2', name: 'Luxe Brand SS26',    client: 'Luxe Apparel Co.',   type: 'Commercial', date: '2026-03-14', status: 'In Session', photos: 0   },
  { _id: 's3', name: 'Rodriguez Family',   client: 'Maria Rodriguez',    type: 'Portrait',   date: '2026-03-12', status: 'Editing',    photos: 184 },
  { _id: 's4', name: 'TechConf 2026',      client: 'Apex Technologies',  type: 'Event',      date: '2026-03-08', status: 'Delivered',  photos: 423 },
  { _id: 's5', name: 'Nakamura Editorial', client: 'Vogue Editorial',    type: 'Editorial',  date: '2026-03-05', status: 'Delivered',  photos: 210 },
  { _id: 's6', name: 'Park Anniversary',   client: 'D & S Park',         type: 'Wedding',    date: '2026-02-28', status: 'Archived',   photos: 616 },
];

const CLIENTS = [
  { _id: 'c1', name: 'Emma & James Chen',  type: 'Wedding',    lastShoot: '2026-03-20', totalShoots:  2, totalSpend:  9800 },
  { _id: 'c2', name: 'Luxe Apparel Co.',   type: 'Commercial', lastShoot: '2026-03-14', totalShoots:  8, totalSpend: 34200 },
  { _id: 'c3', name: 'Maria Rodriguez',    type: 'Portrait',   lastShoot: '2026-03-12', totalShoots:  4, totalSpend:  3600 },
  { _id: 'c4', name: 'Apex Technologies',  type: 'Event',      lastShoot: '2026-03-08', totalShoots:  6, totalSpend: 18500 },
  { _id: 'c5', name: 'Vogue Editorial',    type: 'Editorial',  lastShoot: '2026-03-05', totalShoots: 12, totalSpend: 41000 },
  { _id: 'c6', name: 'Daniel & Sarah Park',type: 'Wedding',    lastShoot: '2026-02-28', totalShoots:  1, totalSpend:  7200 },
];

const EQUIPMENT = [
  { _id: 'e1', name: 'Sony α1',                  category: 'Body',       status: 'Ready',    battery: 95  },
  { _id: 'e2', name: 'Sony α7R V',               category: 'Body',       status: 'Ready',    battery: 72  },
  { _id: 'e3', name: 'Sony FE 24-70mm f/2.8 GM', category: 'Lens',       status: 'Ready',    battery: null },
  { _id: 'e4', name: 'Sony FE 85mm f/1.4 GM',    category: 'Lens',       status: 'In Use',   battery: null },
  { _id: 'e5', name: 'Profoto B10 Plus',          category: 'Lighting',   status: 'Charging', battery: 48  },
  { _id: 'e6', name: 'Manfrotto 055XPRO3',       category: 'Support',    status: 'Ready',    battery: null },
  { _id: 'e7', name: 'DJI Ronin 4D',             category: 'Stabilizer', status: 'Service',  battery: null },
  { _id: 'e8', name: 'SanDisk CFexpress 256GB',  category: 'Storage',    status: 'Ready',    battery: null },
];

const GALLERIES = [
  { _id: 'g1', title: 'Chen Wedding',       count: 616, coverGradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', coverEmoji: '💍', deliveredAt: '2026-02-28', client: 'Emma & James Chen',  status: 'Delivered'  },
  { _id: 'g2', title: 'Nakamura Editorial', count: 210, coverGradient: 'linear-gradient(135deg,#9d00ff,#ff0080)', coverEmoji: '📸', deliveredAt: '2026-03-05', client: 'Vogue Editorial',    status: 'Delivered'  },
  { _id: 'g3', title: 'TechConf 2026',      count: 423, coverGradient: 'linear-gradient(135deg,#00ffff,#0080ff)', coverEmoji: '🎤', deliveredAt: '2026-03-08', client: 'Apex Technologies',  status: 'Delivered'  },
  { _id: 'g4', title: 'Rodriguez Family',   count: 184, coverGradient: 'linear-gradient(135deg,#00ff00,#00b4d8)', coverEmoji: '👨‍👩‍👧', deliveredAt: null,         client: 'Maria Rodriguez',   status: 'Editing'    },
  { _id: 'g5', title: 'Luxe Brand SS26',    count:   0, coverGradient: 'linear-gradient(135deg,#f59e0b,#9d00ff)', coverEmoji: '👗', deliveredAt: null,         client: 'Luxe Apparel Co.',  status: 'In Session' },
  { _id: 'g6', title: 'Park Anniversary',   count: 512, coverGradient: 'linear-gradient(135deg,#ff0080,#f59e0b)', coverEmoji: '🥂', deliveredAt: '2026-03-01', client: 'D & S Park',        status: 'Archived'   },
  { _id: 'g7', title: 'Sunset Portraits',   count: 98,  coverGradient: 'linear-gradient(135deg,#ff6b35,#f59e0b)', coverEmoji: '🌅', deliveredAt: '2026-02-15', client: 'Alex Mercer',       status: 'Delivered'  },
  { _id: 'g8', title: 'Urban Street',       count: 130, coverGradient: 'linear-gradient(135deg,#1a1a2e,#00ffff)', coverEmoji: '🏙️', deliveredAt: '2026-02-20', client: 'Metro Magazine',    status: 'Delivered'  },
];

// ── Handlers ───────────────────────────────────────

export function getStats(_req, res) {
  res.json(STATS);
}

export function getShoots(_req, res) {
  res.json(SHOOTS);
}

export function getClients(_req, res) {
  res.json(CLIENTS);
}

export function getEquipment(_req, res) {
  res.json(EQUIPMENT);
}

export function getGalleries(_req, res) {
  res.json(GALLERIES);
}

export function updateShootStatus(req, res) {
  const { id }     = req.params;
  const { status } = req.body;
  const shoot      = SHOOTS.find(s => s._id === id);
  if (!shoot) return res.status(404).json({ error: 'Shoot not found' });
  shoot.status = status;
  res.json(shoot);
}
