/* ─────────────────────────────────────────────────
   Photos Controller — Professional Photography Studio
   Mongoose-backed with auto-seed on first launch
   ───────────────────────────────────────────────── */

import { PhotoShoot, PhotoClient, PhotoPackage, PhotoEquipment, PhotoGallery }
  from '../models/photos.model.js';

/* ── Auto-seed (runs once when DB is empty) ─────── */

let seeded = false;

async function ensureSeeded() {
  if (seeded) return;
  const count = await PhotoShoot.estimatedDocumentCount();
  if (count > 0) { seeded = true; return; }

  await Promise.all([
    PhotoShoot.insertMany([
      { name: 'Chen Wedding',       clientName: 'Emma & James Chen',  type: 'Wedding',     status: 'Delivered',   date: new Date('2026-03-20'), startTime: '14:00', duration: 8,  location: 'The Grand Ballroom, NY',  price: 4800, depositPaid: true,  contractSigned: true,  photos: 616, packageName: 'Wedding Premier' },
      { name: 'Luxe Brand SS26',    clientName: 'Luxe Apparel Co.',   type: 'Commercial',  status: 'In Session',  date: new Date('2026-03-28'), startTime: '08:00', duration: 6,  location: 'Studio 5, Manhattan',     price: 3200, depositPaid: true,  contractSigned: true,  photos: 0,   packageName: 'Commercial Standard' },
      { name: 'Rodriguez Family',   clientName: 'Maria Rodriguez',    type: 'Portrait',    status: 'Editing',     date: new Date('2026-03-25'), startTime: '10:00', duration: 2,  location: 'Central Park, NY',        price: 650,  depositPaid: true,  contractSigned: true,  photos: 184, packageName: 'Portrait Pro' },
      { name: 'TechConf 2026',      clientName: 'Apex Technologies',  type: 'Event',       status: 'Review',      date: new Date('2026-03-22'), startTime: '09:00', duration: 10, location: 'Javits Center, NY',       price: 2800, depositPaid: true,  contractSigned: true,  photos: 423, packageName: 'Event Full Day' },
      { name: 'Nakamura Editorial', clientName: 'Vogue Editorial',    type: 'Editorial',   status: 'Delivered',   date: new Date('2026-03-18'), startTime: '11:00', duration: 5,  location: 'Rooftop Studio, Brooklyn',price: 5500, depositPaid: true,  contractSigned: true,  photos: 210, packageName: 'Editorial Prestige' },
      { name: 'Park Anniversary',   clientName: 'Daniel & Sarah Park',type: 'Wedding',     status: 'Archived',    date: new Date('2026-02-28'), startTime: '15:00', duration: 6,  location: 'The Ritz-Carlton, NY',    price: 3900, depositPaid: true,  contractSigned: true,  photos: 512, packageName: 'Wedding Essentials' },
      { name: 'Williams Newborn',   clientName: 'Claire Williams',    type: 'Newborn',     status: 'Booked',      date: new Date('2026-04-05'), startTime: '10:00', duration: 3,  location: 'Home Studio, Brooklyn',   price: 450,  depositPaid: true,  contractSigned: true,  photos: 0,   packageName: 'Newborn Dreamy' },
      { name: 'Metro Magazine',     clientName: 'Metro Magazine HQ',  type: 'Editorial',   status: 'Inquiry',     date: new Date('2026-04-12'), startTime: '13:00', duration: 4,  location: 'TBD',                     price: 0,    depositPaid: false, contractSigned: false, photos: 0,   packageName: '' },
      { name: 'Sunset Portraits',   clientName: 'Alex Mercer',        type: 'Portrait',    status: 'Delivered',   date: new Date('2026-02-15'), startTime: '17:30', duration: 1,  location: 'Dumbo Waterfront, Brooklyn', price: 350, depositPaid: true, contractSigned: true, photos: 98, packageName: 'Portrait Essentials' },
    ]),
    PhotoClient.insertMany([
      { name: 'Emma & James Chen',   email: 'chen@email.com',   phone: '212-555-0101', type: 'Individual', leadStatus: 'Active', tags: ['Wedding', 'Returning'],  totalShoots: 2,  totalSpend: 9800,  lastShoot: new Date('2026-03-20') },
      { name: 'Luxe Apparel Co.',    email: 'hello@luxe.com',   phone: '212-555-0202', type: 'Business',   leadStatus: 'Active', tags: ['Commercial', 'VIP'],     totalShoots: 8,  totalSpend: 34200, lastShoot: new Date('2026-03-28') },
      { name: 'Maria Rodriguez',     email: 'maria@email.com',  phone: '718-555-0303', type: 'Individual', leadStatus: 'Active', tags: ['Portrait', 'Family'],    totalShoots: 4,  totalSpend: 3600,  lastShoot: new Date('2026-03-25') },
      { name: 'Apex Technologies',   email: 'events@apex.com',  phone: '212-555-0404', type: 'Business',   leadStatus: 'Active', tags: ['Event', 'Corporate'],    totalShoots: 6,  totalSpend: 18500, lastShoot: new Date('2026-03-22') },
      { name: 'Vogue Editorial',     email: 'photo@vogue.com',  phone: '212-555-0505', type: 'Business',   leadStatus: 'Active', tags: ['Editorial', 'VIP'],      totalShoots: 12, totalSpend: 41000, lastShoot: new Date('2026-03-18') },
      { name: 'Daniel & Sarah Park', email: 'park@email.com',   phone: '917-555-0606', type: 'Individual', leadStatus: 'Past',   tags: ['Wedding'],               totalShoots: 1,  totalSpend: 7200,  lastShoot: new Date('2026-02-28') },
      { name: 'Claire Williams',     email: 'claire@email.com', phone: '718-555-0707', type: 'Individual', leadStatus: 'Active', tags: ['Newborn'],               totalShoots: 1,  totalSpend: 450,   lastShoot: new Date('2026-04-05') },
      { name: 'Alex Mercer',         email: 'alex@email.com',   phone: '646-555-0808', type: 'Individual', leadStatus: 'Active', tags: ['Portrait'],              totalShoots: 1,  totalSpend: 350,   lastShoot: new Date('2026-02-15') },
      { name: 'Metro Magazine HQ',   email: 'photo@metro.com',  phone: '212-555-0909', type: 'Business',   leadStatus: 'Lead',   tags: ['Editorial'],             totalShoots: 0,  totalSpend: 0,     lastShoot: null },
    ]),
    PhotoPackage.insertMany([
      { name: 'Wedding Essentials',  category: 'Wedding',    price: 2500, hours: 6,  photosDelivered: 400, description: 'Perfect for intimate ceremonies', includes: ['1 photographer', '6 hours coverage', 'Online gallery (400 photos)', 'Print release'], turnaroundDays: 21 },
      { name: 'Wedding Premier',     category: 'Wedding',    price: 4800, hours: 10, photosDelivered: 700, description: 'Full-day premium wedding experience', includes: ['2 photographers', '10 hours coverage', 'Engagement session', 'Online gallery (700+ photos)', 'Wedding album', 'Highlight video'], turnaroundDays: 28 },
      { name: 'Portrait Essentials', category: 'Portrait',   price: 350,  hours: 1,  photosDelivered: 30,  description: 'Quick portrait session', includes: ['1 hour session', '30 edited photos', 'Online gallery', 'Print release'], turnaroundDays: 7 },
      { name: 'Portrait Pro',        category: 'Portrait',   price: 650,  hours: 2,  photosDelivered: 60,  description: 'Extended portrait session with full editing', includes: ['2 hour session', '60 edited photos', '2 looks', 'Online gallery', 'Print release', 'Same-week delivery'], turnaroundDays: 5 },
      { name: 'Commercial Standard', category: 'Commercial', price: 3200, hours: 6,  photosDelivered: 100, description: 'Professional brand & product photography', includes: ['Full day studio rental', '6 hours shooting', '100 edited images', 'Commercial license', 'Multiple product setups'], turnaroundDays: 10 },
      { name: 'Event Full Day',      category: 'Event',      price: 2800, hours: 10, photosDelivered: 500, description: 'Complete corporate event coverage', includes: ['1 photographer', '10 hours coverage', '500 edited photos', 'Online gallery', 'Commercial use license', 'Same-week delivery'], turnaroundDays: 7 },
      { name: 'Editorial Prestige',  category: 'Editorial',  price: 5500, hours: 5,  photosDelivered: 50,  description: 'Magazine-quality editorial sessions', includes: ['Art direction consultation', '5 hours shooting', '50 final retouched images', 'Stylist coordination', 'Commercial license', 'Rush delivery'], turnaroundDays: 3 },
      { name: 'Newborn Dreamy',      category: 'Newborn',    price: 450,  hours: 3,  photosDelivered: 40,  description: 'Gentle newborn lifestyle session', includes: ['3 hour flexible session', '40 edited photos', 'Family shots included', 'Online gallery', 'Print release'], turnaroundDays: 7 },
    ]),
    PhotoEquipment.insertMany([
      { name: 'Sony α1',                   category: 'Body',       status: 'Ready',    battery: 95,  serialNumber: 'SNA100123', lastService: new Date('2026-01-15') },
      { name: 'Sony α7R V',                category: 'Body',       status: 'Ready',    battery: 72,  serialNumber: 'SNA100456', lastService: new Date('2026-01-15') },
      { name: 'Sony FE 24-70mm f/2.8 GM',  category: 'Lens',       status: 'Ready',    battery: null, serialNumber: 'SNL200789' },
      { name: 'Sony FE 85mm f/1.4 GM',     category: 'Lens',       status: 'In Use',   battery: null, serialNumber: 'SNL200321' },
      { name: 'Sony FE 16-35mm f/2.8 GM',  category: 'Lens',       status: 'Ready',    battery: null, serialNumber: 'SNL200654' },
      { name: 'Profoto B10 Plus (×2)',      category: 'Lighting',   status: 'Charging', battery: 48,  serialNumber: 'PFB310987' },
      { name: 'Profoto OCF Beauty Dish',    category: 'Lighting',   status: 'Ready',    battery: null, serialNumber: 'PFMOD001' },
      { name: 'Manfrotto 055XPRO3',         category: 'Support',    status: 'Ready',    battery: null, serialNumber: 'MFT055001' },
      { name: 'DJI Ronin 4D',              category: 'Stabilizer', status: 'Service',  battery: null, serialNumber: 'DJIR4D001', notes: 'Gimbal motor service — due back Apr 2' },
      { name: 'SanDisk CFexpress 256GB ×4', category: 'Storage',   status: 'Ready',    battery: null, serialNumber: 'SDCFE256' },
      { name: 'DJI Mavic 3 Pro',           category: 'Drone',      status: 'Ready',    battery: 88,  serialNumber: 'DJIM3P001' },
    ]),
    PhotoGallery.insertMany([
      { title: 'Chen Wedding',       clientName: 'Emma & James Chen',  count: 616, coverGradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', coverEmoji: '💍', status: 'Delivered',   deliveredAt: new Date('2026-03-25') },
      { title: 'Nakamura Editorial', clientName: 'Vogue Editorial',    count: 210, coverGradient: 'linear-gradient(135deg,#9d00ff,#ff0080)', coverEmoji: '📸', status: 'Delivered',   deliveredAt: new Date('2026-03-22') },
      { title: 'TechConf 2026',      clientName: 'Apex Technologies',  count: 423, coverGradient: 'linear-gradient(135deg,#00ffff,#0080ff)', coverEmoji: '🎤', status: 'Ready',       deliveredAt: null },
      { title: 'Rodriguez Family',   clientName: 'Maria Rodriguez',    count: 184, coverGradient: 'linear-gradient(135deg,#00ff00,#00b4d8)', coverEmoji: '👨‍👩‍👧', status: 'Editing',     deliveredAt: null },
      { title: 'Luxe Brand SS26',    clientName: 'Luxe Apparel Co.',   count:   0, coverGradient: 'linear-gradient(135deg,#f59e0b,#9d00ff)', coverEmoji: '👗', status: 'In Session',  deliveredAt: null },
      { title: 'Park Anniversary',   clientName: 'Daniel & Sarah Park',count: 512, coverGradient: 'linear-gradient(135deg,#ff0080,#f59e0b)', coverEmoji: '🥂', status: 'Archived',    deliveredAt: new Date('2026-03-05') },
      { title: 'Sunset Portraits',   clientName: 'Alex Mercer',        count:  98, coverGradient: 'linear-gradient(135deg,#ff6b35,#f59e0b)', coverEmoji: '🌅', status: 'Delivered',   deliveredAt: new Date('2026-02-20') },
      { title: 'Urban Street',       clientName: 'Metro Magazine HQ',  count: 130, coverGradient: 'linear-gradient(135deg,#1a1a2e,#00ffff)', coverEmoji: '🏙️', status: 'Delivered',  deliveredAt: new Date('2026-02-24') },
    ]),
  ]);

  seeded = true;
}

/* ── Stats (computed) ─────────────────────────── */

export async function getStats(req, res, next) {
  try {
    await ensureSeeded();
    const now        = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalShoots, activeClients, shoots, galleries] = await Promise.all([
      PhotoShoot.countDocuments(),
      PhotoClient.countDocuments({ leadStatus: 'Active' }),
      PhotoShoot.find().lean(),
      PhotoGallery.find().lean(),
    ]);

    const photosDelivered = shoots.reduce((sum, s) => sum + (s.photos || 0), 0);
    const revenueMtd      = shoots
      .filter(s => new Date(s.date) >= startOfMonth && s.price > 0)
      .reduce((sum, s) => sum + s.price, 0);

    // Revenue by shoot type
    const typeMap = {};
    shoots.forEach(s => {
      if (!s.price) return;
      typeMap[s.type] = (typeMap[s.type] || 0) + s.price;
    });
    const typeColors = { Wedding: '#f59e0b', Commercial: '#00ffff', Portrait: '#9d00ff', Event: '#ff0080', Editorial: '#00ff00', Newborn: '#ff6b6b', Corporate: '#457b9d', Family: '#f59e0b', 'Real Estate': '#4ecdc4' };
    const totalRev   = Object.values(typeMap).reduce((a, b) => a + b, 0) || 1;
    const revenueByType = Object.entries(typeMap)
      .sort((a, b) => b[1] - a[1])
      .map(([type, amount]) => ({ type, amount, pct: Math.round((amount / totalRev) * 100), color: typeColors[type] || '#888' }));

    // Storage (estimate: 3 MB per photo average)
    const totalPhotos   = galleries.reduce((s, g) => s + (g.count || 0), 0);
    const storageUsedGb = parseFloat((totalPhotos * 3 / 1024).toFixed(2));
    const storageTotalGb = 2.0;

    res.json({
      totalShoots,
      shootsDelta:     `+${shoots.filter(s => new Date(s.createdAt) >= startOfMonth).length} this month`,
      activeClients,
      clientsDelta:    `+${await PhotoClient.countDocuments({ createdAt: { $gte: startOfMonth } })} new`,
      photosDelivered,
      deliveredDelta:  `+${shoots.filter(s => s.status === 'Delivered' && new Date(s.updatedAt) >= startOfMonth).length} delivered`,
      revenueMtd,
      revenueDelta:    '+22% vs last month',
      storageUsedGb,
      storageTotalGb,
      revenueByType,
    });
  } catch (err) { next(err); }
}

/* ── Shoots ────────────────────────────────────── */

export async function getShoots(req, res, next) {
  try {
    await ensureSeeded();
    const shoots = await PhotoShoot.find().sort({ date: 1 }).lean();
    res.json(shoots);
  } catch (err) { next(err); }
}

export async function createShoot(req, res, next) {
  try {
    const { name, clientName, type, status, date, startTime, duration, location, notes, packageName, price, depositPaid, contractSigned } = req.body;
    if (!name || !clientName || !type || !date) {
      return res.status(400).json({ error: 'name, clientName, type, date are required' });
    }
    const shoot = await PhotoShoot.create({ name, clientName, type, status, date, startTime, duration, location, notes, packageName, price, depositPaid, contractSigned });
    res.status(201).json(shoot);
  } catch (err) { next(err); }
}

export async function updateShootStatus(req, res, next) {
  try {
    const { status } = req.body;
    const shoot = await PhotoShoot.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).lean();
    if (!shoot) return res.status(404).json({ error: 'Shoot not found' });
    res.json(shoot);
  } catch (err) { next(err); }
}

export async function updateShoot(req, res, next) {
  try {
    const shoot = await PhotoShoot.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!shoot) return res.status(404).json({ error: 'Shoot not found' });
    res.json(shoot);
  } catch (err) { next(err); }
}

export async function deleteShoot(req, res, next) {
  try {
    const shoot = await PhotoShoot.findByIdAndDelete(req.params.id);
    if (!shoot) return res.status(404).json({ error: 'Shoot not found' });
    res.json({ message: 'Shoot deleted' });
  } catch (err) { next(err); }
}

/* ── Clients ───────────────────────────────────── */

export async function getClients(req, res, next) {
  try {
    await ensureSeeded();
    const clients = await PhotoClient.find().sort({ totalSpend: -1 }).lean();
    res.json(clients);
  } catch (err) { next(err); }
}

export async function createClient(req, res, next) {
  try {
    const { name, email, phone, type, leadStatus, tags, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });
    const client = await PhotoClient.create({ name, email, phone, type, leadStatus, tags, notes });
    res.status(201).json(client);
  } catch (err) { next(err); }
}

export async function updateClient(req, res, next) {
  try {
    const client = await PhotoClient.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true, runValidators: true }).lean();
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
  } catch (err) { next(err); }
}

export async function deleteClient(req, res, next) {
  try {
    const client = await PhotoClient.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) { next(err); }
}

/* ── Packages ──────────────────────────────────── */

export async function getPackages(req, res, next) {
  try {
    await ensureSeeded();
    const packages = await PhotoPackage.find({ active: true }).sort({ price: 1 }).lean();
    res.json(packages);
  } catch (err) { next(err); }
}

/* ── Equipment ─────────────────────────────────── */

export async function getEquipment(req, res, next) {
  try {
    await ensureSeeded();
    const equipment = await PhotoEquipment.find().sort({ category: 1 }).lean();
    res.json(equipment);
  } catch (err) { next(err); }
}

export async function updateEquipmentStatus(req, res, next) {
  try {
    const { status } = req.body;
    const item = await PhotoEquipment.findByIdAndUpdate(req.params.id, { status }, { new: true, runValidators: true }).lean();
    if (!item) return res.status(404).json({ error: 'Equipment not found' });
    res.json(item);
  } catch (err) { next(err); }
}

/* ── Galleries ─────────────────────────────────── */

export async function getGalleries(req, res, next) {
  try {
    await ensureSeeded();
    const galleries = await PhotoGallery.find().sort({ createdAt: -1 }).lean();
    res.json(galleries);
  } catch (err) { next(err); }
}

export async function updateGalleryStatus(req, res, next) {
  try {
    const { status } = req.body;
    const update = status === 'Delivered' ? { status, deliveredAt: new Date() } : { status };
    const gallery = await PhotoGallery.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).lean();
    if (!gallery) return res.status(404).json({ error: 'Gallery not found' });
    res.json(gallery);
  } catch (err) { next(err); }
}
