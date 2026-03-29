export type ShootStatus  = 'Inquiry' | 'Booked' | 'In Session' | 'Editing' | 'Review' | 'Delivered' | 'Archived';
export type ShootType    = 'Wedding' | 'Commercial' | 'Portrait' | 'Event' | 'Editorial' | 'Newborn' | 'Real Estate' | 'Corporate' | 'Family';
export type ClientStatus = 'Lead' | 'Active' | 'Past';
export type ClientType   = 'Individual' | 'Business';
export type EquipStatus  = 'Ready' | 'In Use' | 'Charging' | 'Service' | 'Retired';
export type GalleryStatus = 'In Session' | 'Editing' | 'Ready' | 'Delivered' | 'Archived';

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
  revenueByType:    { type: string; amount: number; pct: number; color: string }[];
}

export interface PhotoShoot {
  _id:             string;
  name:            string;
  clientName:      string;
  type:            ShootType;
  status:          ShootStatus;
  date:            string;
  startTime:       string;
  duration:        number;
  location:        string;
  notes:           string;
  packageName:     string;
  price:           number;
  depositPaid:     boolean;
  contractSigned:  boolean;
  photos:          number;
  createdAt:       string;
  updatedAt:       string;
}

export interface PhotoClient {
  _id:          string;
  name:         string;
  email:        string;
  phone:        string;
  type:         ClientType;
  leadStatus:   ClientStatus;
  tags:         string[];
  totalShoots:  number;
  totalSpend:   number;
  lastShoot:    string | null;
  notes:        string;
}

export interface PhotoPackage {
  _id:              string;
  name:             string;
  category:         string;
  price:            number;
  hours:            number;
  photosDelivered:  number;
  description:      string;
  includes:         string[];
  active:           boolean;
  turnaroundDays:   number;
}

export interface PhotoEquipment {
  _id:          string;
  name:         string;
  category:     string;
  status:       EquipStatus;
  battery:      number | null;
  serialNumber: string;
  notes:        string;
  lastService:  string | null;
}

export interface PhotoGallery {
  _id:           string;
  title:         string;
  clientName:    string;
  count:         number;
  coverGradient: string;
  coverEmoji:    string;
  status:        GalleryStatus;
  deliveredAt:   string | null;
  galleryUrl:    string;
}

/* Form models */
export interface ShootFormData {
  name:           string;
  clientName:     string;
  type:           ShootType;
  status:         ShootStatus;
  date:           string;
  startTime:      string;
  duration:       number;
  location:       string;
  packageName:    string;
  price:          number;
  depositPaid:    boolean;
  contractSigned: boolean;
  notes:          string;
}

export interface ClientFormData {
  name:        string;
  email:       string;
  phone:       string;
  type:        ClientType;
  leadStatus:  ClientStatus;
  notes:       string;
}
