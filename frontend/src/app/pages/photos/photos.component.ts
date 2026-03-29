import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { DecimalPipe, DatePipe, NgClass, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import {
  PhotoStats, PhotoShoot, PhotoClient, PhotoPackage, PhotoEquipment, PhotoGallery,
  ShootFormData, ClientFormData, ShootType, ShootStatus, ClientType, ClientStatus,
} from '../../models/photos.model';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

/* ── Pipeline stages ──────────────────────────────────── */
const PIPELINE_STAGES: { key: ShootStatus; label: string; color: string }[] = [
  { key: 'Inquiry',    label: 'Inquiry',    color: '#6b7280' },
  { key: 'Booked',     label: 'Booked',     color: '#f59e0b' },
  { key: 'In Session', label: 'In Session', color: '#22c55e' },
  { key: 'Editing',    label: 'Editing',    color: '#9d00ff' },
  { key: 'Review',     label: 'Review',     color: '#f97316' },
  { key: 'Delivered',  label: 'Delivered',  color: '#00ffff' },
];

const SHOOT_TYPES: ShootType[] = [
  'Wedding', 'Commercial', 'Portrait', 'Event', 'Editorial', 'Newborn', 'Real Estate', 'Corporate', 'Family',
];
const SHOOT_STATUSES: ShootStatus[] = [
  'Inquiry', 'Booked', 'In Session', 'Editing', 'Review', 'Delivered', 'Archived',
];

const DEFAULT_SHOOT: ShootFormData = {
  name: '', clientName: '', type: 'Wedding', status: 'Inquiry',
  date: '', startTime: '09:00', duration: 2, location: '',
  packageName: '', price: 0, depositPaid: false, contractSigned: false, notes: '',
};
const DEFAULT_CLIENT: ClientFormData = {
  name: '', email: '', phone: '', type: 'Individual', leadStatus: 'Active', notes: '',
};

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [DecimalPipe, DatePipe, NgClass, LowerCasePipe, FormsModule, StatCardComponent, FileManagerComponent],
  templateUrl: './photos.component.html',
  styleUrls: ['./photos.component.scss'],
})
export class PhotosComponent implements OnInit {
  private api = inject(ApiService);

  /* ── Data signals ── */
  stats     = signal<PhotoStats | null>(null);
  shoots    = signal<PhotoShoot[]>([]);
  clients   = signal<PhotoClient[]>([]);
  packages  = signal<PhotoPackage[]>([]);
  equipment = signal<PhotoEquipment[]>([]);
  galleries = signal<PhotoGallery[]>([]);

  /* ── UI state ── */
  showShootForm     = signal(false);
  showClientForm    = signal(false);
  shootFormLoading  = signal(false);
  clientFormLoading = signal(false);
  shootFormError    = signal<string | null>(null);
  clientFormError   = signal<string | null>(null);
  shootActionLoading = signal<string | null>(null);

  /* ── Form objects (ngModel) ── */
  shootForm:  ShootFormData  = { ...DEFAULT_SHOOT };
  clientForm: ClientFormData = { ...DEFAULT_CLIENT };

  /* ── Readonly config ── */
  readonly pipelineStages = PIPELINE_STAGES;
  readonly shootTypes     = SHOOT_TYPES;
  readonly shootStatuses  = SHOOT_STATUSES;

  /* ── Computed ── */
  upcomingShoots = computed(() =>
    this.shoots()
      .filter(s => s.status === 'Booked' || s.status === 'In Session')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  );

  storagePercent = () => {
    const s = this.stats();
    return s ? (s.storageUsedGb / s.storageTotalGb) * 100 : 0;
  };

  /* ── Init ── */
  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.api.getPhotoStats()    .subscribe({ next: d => this.stats.set(d)     });
    this.api.getPhotoShoots()   .subscribe({ next: d => this.shoots.set(d)    });
    this.api.getPhotoClients()  .subscribe({ next: d => this.clients.set(d)   });
    this.api.getPhotoPackages() .subscribe({ next: d => this.packages.set(d)  });
    this.api.getPhotoEquipment().subscribe({ next: d => this.equipment.set(d) });
    this.api.getPhotoGalleries().subscribe({ next: d => this.galleries.set(d) });
  }

  /* ══════════════════════════════════════════════════════
     PIPELINE
  ══════════════════════════════════════════════════════ */

  shootsByStage(stage: string): PhotoShoot[] {
    return this.shoots().filter(s => s.status === stage);
  }

  isLastPipelineStage(stage: string): boolean {
    return stage === 'Delivered';
  }

  nextStageLabel(currentStage: string): string {
    const idx = PIPELINE_STAGES.findIndex(s => s.key === currentStage);
    return PIPELINE_STAGES[idx + 1]?.label ?? '';
  }

  advanceShootStatus(shoot: PhotoShoot) {
    const idx = PIPELINE_STAGES.findIndex(s => s.key === shoot.status);
    if (idx < 0 || idx >= PIPELINE_STAGES.length - 1) return;
    const nextStatus = PIPELINE_STAGES[idx + 1].key;
    this.shootActionLoading.set(shoot._id);
    this.api.updateShootStatus(shoot._id, nextStatus).subscribe({
      next: updated => {
        this.shoots.update(list => list.map(s => s._id === updated._id ? updated : s));
        this.shootActionLoading.set(null);
      },
      error: () => this.shootActionLoading.set(null),
    });
  }

  /* ══════════════════════════════════════════════════════
     SHOOT FORM
  ══════════════════════════════════════════════════════ */

  toggleShootForm() {
    if (this.showShootForm()) {
      this.showShootForm.set(false);
      this.shootFormError.set(null);
    } else {
      this.shootForm = { ...DEFAULT_SHOOT };
      this.shootFormError.set(null);
      this.showShootForm.set(true);
    }
  }

  submitShootForm() {
    if (!this.shootForm.name.trim())       { this.shootFormError.set('Shoot name is required'); return; }
    if (!this.shootForm.clientName.trim()) { this.shootFormError.set('Client name is required'); return; }
    if (!this.shootForm.date)              { this.shootFormError.set('Date is required'); return; }

    this.shootFormLoading.set(true);
    this.shootFormError.set(null);

    this.api.createPhotoShoot({ ...this.shootForm }).subscribe({
      next: shoot => {
        this.shoots.update(list => [shoot, ...list].sort((a, b) =>
          new Date(a.date).getTime() - new Date(b.date).getTime()
        ));
        this.shootFormLoading.set(false);
        this.showShootForm.set(false);
        this.api.getPhotoStats().subscribe({ next: d => this.stats.set(d) });
      },
      error: err => {
        this.shootFormError.set(err?.error?.error ?? 'Failed to book shoot');
        this.shootFormLoading.set(false);
      },
    });
  }

  deleteShoot(shoot: PhotoShoot) {
    this.shootActionLoading.set(shoot._id);
    this.api.deletePhotoShoot(shoot._id).subscribe({
      next: () => {
        this.shoots.update(list => list.filter(s => s._id !== shoot._id));
        this.shootActionLoading.set(null);
        this.api.getPhotoStats().subscribe({ next: d => this.stats.set(d) });
      },
      error: () => this.shootActionLoading.set(null),
    });
  }

  /* ══════════════════════════════════════════════════════
     CLIENT FORM
  ══════════════════════════════════════════════════════ */

  toggleClientForm() {
    if (this.showClientForm()) {
      this.showClientForm.set(false);
      this.clientFormError.set(null);
    } else {
      this.clientForm = { ...DEFAULT_CLIENT };
      this.clientFormError.set(null);
      this.showClientForm.set(true);
    }
  }

  submitClientForm() {
    if (!this.clientForm.name.trim()) { this.clientFormError.set('Client name is required'); return; }

    this.clientFormLoading.set(true);
    this.clientFormError.set(null);

    this.api.createPhotoClient({ ...this.clientForm }).subscribe({
      next: client => {
        this.clients.update(list => [client, ...list]);
        this.clientFormLoading.set(false);
        this.showClientForm.set(false);
        this.api.getPhotoStats().subscribe({ next: d => this.stats.set(d) });
      },
      error: err => {
        this.clientFormError.set(err?.error?.error ?? 'Failed to add client');
        this.clientFormLoading.set(false);
      },
    });
  }

  deleteClient(client: PhotoClient) {
    this.api.deletePhotoClient(client._id).subscribe({
      next: () => this.clients.update(list => list.filter(c => c._id !== client._id)),
    });
  }

  /* ══════════════════════════════════════════════════════
     EQUIPMENT + GALLERIES
  ══════════════════════════════════════════════════════ */

  updateEquipmentStatus(item: PhotoEquipment, status: string) {
    this.api.updateEquipmentStatus(item._id, status).subscribe({
      next: updated => this.equipment.update(list =>
        list.map(e => e._id === updated._id ? updated : e)
      ),
    });
  }

  updateGalleryStatus(gallery: PhotoGallery, status: string) {
    this.api.updateGalleryStatus(gallery._id, status).subscribe({
      next: updated => this.galleries.update(list =>
        list.map(g => g._id === updated._id ? updated : g)
      ),
    });
  }

  /* ══════════════════════════════════════════════════════
     HELPERS
  ══════════════════════════════════════════════════════ */

  formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  initials(name: string): string {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  /** Convert type string to CSS class key (lowercase, spaces→dash) */
  typeKey(type: string): string {
    return (type ?? '').toLowerCase().replace(/\s+/g, '-');
  }

  statusClass(status: string): Record<string, boolean> {
    const key = (status ?? '').toLowerCase().replace(/\s+/g, '-');
    return {
      [`status-badge--${key}`]: true,
      [`status-badge--${status}`]: true,
    };
  }
}
