import { Component, OnInit, inject, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import {
  ApiService,
  PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery,
} from '../../services/api.service';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [NgClass, StatCardComponent, FileManagerComponent],
  styles: [`
    :host { display: block; --page-accent: #f59e0b; }
    .page { padding: 36px 40px; }

    /* ── Header ── */
    .pg-header {
      margin-bottom: 36px; display: flex; align-items: flex-end;
      justify-content: space-between;
    }
    .pg-title {
      font-family: 'DM Serif Display', serif; font-size: 3rem;
      letter-spacing: -2px; line-height: 1;
      em { font-style: italic; color: #f59e0b; }
    }
    .pg-sub {
      font-family: 'DM Mono', monospace; font-size: 0.68rem;
      letter-spacing: 0.15em; text-transform: uppercase;
      color: var(--text-muted); margin-top: 6px;
    }
    .pg-action {
      font-family: 'Syne', sans-serif; font-size: 0.78rem; font-weight: 700;
      color: var(--dark-bg); background: #f59e0b; border: none;
      padding: 10px 20px; border-radius: 6px; cursor: pointer;
      box-shadow: 0 0 18px rgba(245,158,11,0.4);
      transition: box-shadow 0.2s;
      &:hover { box-shadow: 0 0 28px rgba(245,158,11,0.6); }
    }

    /* ── Grid layouts ── */
    .stat-grid   { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px; }
    .panel-row   { display: grid; gap: 20px; margin-bottom: 20px; }
    .panel-row--3-2   { grid-template-columns: 3fr 2fr; }
    .panel-row--2-1-1 { grid-template-columns: 2fr 1fr 1fr; }
    .panel-row--full  { grid-template-columns: 1fr; }

    /* ── Status badges ── */
    .status-badge {
      display: inline-block; font-family: 'DM Mono', monospace;
      font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase;
      padding: 3px 9px; border-radius: 20px; border: 1px solid; white-space: nowrap;

      &--scheduled  { background: rgba(0,128,255,0.12);  color: #0080ff; border-color: rgba(0,128,255,0.3); }
      &--in-session {
        background: rgba(0,255,0,0.1); color: var(--neon-lime); border-color: rgba(0,255,0,0.3);
        animation: pulse-lime 1.8s ease-in-out infinite;
      }
      &--editing    { background: rgba(157,0,255,0.12); color: var(--neon-purple); border-color: rgba(157,0,255,0.3); }
      &--delivered  { background: rgba(0,255,255,0.1);  color: var(--neon-cyan);   border-color: rgba(0,255,255,0.3); }
      &--archived   { background: rgba(255,255,255,0.04); color: var(--text-muted); border-color: rgba(255,255,255,0.1); }
    }
    @keyframes pulse-lime {
      0%, 100% { box-shadow: 0 0 0 0 rgba(0,255,0,0.4); }
      50%       { box-shadow: 0 0 0 4px rgba(0,255,0,0); }
    }

    /* ── Type badge ── */
    .type-badge {
      font-family: 'DM Mono', monospace; font-size: 0.58rem; letter-spacing: 0.08em;
      color: #f59e0b; background: rgba(245,158,11,0.12);
      padding: 2px 7px; border-radius: 4px; border: 1px solid rgba(245,158,11,0.25);
    }

    /* ── Shoot table ── */
    .shoot-name { font-weight: 700; font-size: 0.82rem; color: var(--text-primary); }
    .shoot-client { font-size: 0.72rem; color: var(--text-muted); margin-top: 2px; }
    .shoot-date { font-family: 'DM Mono', monospace; font-size: 0.7rem; color: var(--text-muted); }
    .photo-count {
      font-family: 'DM Mono', monospace; font-size: 0.7rem;
      color: #f59e0b; font-weight: 600;
    }

    /* ── Revenue progress ── */
    .rev-type { font-size: 0.8rem; font-weight: 700; }
    .rev-amount {
      font-family: 'DM Mono', monospace; font-size: 0.7rem;
      color: var(--text-muted); margin-left: auto;
    }

    /* ── Client feed ── */
    .client-item {
      display: flex; align-items: center; gap: 14px;
      padding: 11px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      &:last-child { border-bottom: none; }
    }
    .client-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.72rem; font-weight: 700; color: var(--dark-bg);
      border: 1.5px solid rgba(245,158,11,0.4);
    }
    .client-name { font-size: 0.82rem; font-weight: 700; }
    .client-meta { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; }
    .client-spend {
      margin-left: auto; font-family: 'DM Mono', monospace;
      font-size: 0.72rem; color: #f59e0b; font-weight: 600;
    }

    /* ── Equipment list ── */
    .equip-item {
      display: flex; align-items: center; gap: 12px;
      padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      &:last-child { border-bottom: none; }
    }
    .equip-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
      &--ready    { background: var(--neon-lime);   box-shadow: 0 0 6px var(--neon-lime); }
      &--in-use   { background: var(--neon-cyan);   box-shadow: 0 0 6px var(--neon-cyan); }
      &--charging { background: #f59e0b;             box-shadow: 0 0 6px #f59e0b; animation: pulse-amber 1.5s infinite; }
      &--service  { background: var(--neon-pink);   box-shadow: 0 0 6px var(--neon-pink); }
    }
    @keyframes pulse-amber {
      0%, 100% { opacity: 1; } 50% { opacity: 0.4; }
    }
    .equip-info { flex: 1; min-width: 0; }
    .equip-name { font-size: 0.78rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .equip-cat  { font-family: 'DM Mono', monospace; font-size: 0.62rem; color: var(--text-muted); }
    .equip-battery {
      font-family: 'DM Mono', monospace; font-size: 0.65rem;
      color: var(--text-muted); flex-shrink: 0; display: flex; align-items: center; gap: 4px;
      i { font-size: 0.75rem; }
    }

    /* ── Upcoming shoots ── */
    .upcoming-item {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      &:last-child { border-bottom: none; }
    }
    .upcoming-date-box {
      width: 42px; height: 42px; border-radius: 8px; flex-shrink: 0;
      background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    }
    .udb-day   { font-family: 'DM Serif Display', serif; font-size: 1.1rem; line-height: 1; color: #f59e0b; }
    .udb-month { font-family: 'DM Mono', monospace; font-size: 0.5rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-muted); }
    .upcoming-name { font-size: 0.8rem; font-weight: 700; }
    .upcoming-client { font-family: 'DM Mono', monospace; font-size: 0.65rem; color: var(--text-muted); margin-top: 2px; }

    /* ── Gallery grid ── */
    .gallery-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
    }
    .gallery-card {
      border-radius: 10px; overflow: hidden; position: relative;
      cursor: pointer; background: var(--dark-surface);
      border: 1px solid var(--border-color); transition: all 0.25s;
      &:hover {
        transform: translateY(-4px);
        border-color: rgba(245,158,11,0.4);
        box-shadow: 0 12px 32px rgba(245,158,11,0.15);
      }
      &:hover .gallery-overlay { opacity: 1; }
    }
    .gallery-cover {
      height: 130px; display: flex; align-items: center;
      justify-content: center; font-size: 2.5rem; position: relative;
    }
    .gallery-overlay {
      position: absolute; inset: 0; background: rgba(10,10,26,0.65);
      display: flex; align-items: center; justify-content: center;
      opacity: 0; transition: opacity 0.25s;
      span {
        font-family: 'DM Mono', monospace; font-size: 0.65rem;
        letter-spacing: 0.15em; color: #f59e0b;
      }
    }
    .gallery-meta {
      padding: 12px 14px;
    }
    .gallery-title {
      font-size: 0.82rem; font-weight: 700; white-space: nowrap;
      overflow: hidden; text-overflow: ellipsis;
    }
    .gallery-client {
      font-family: 'DM Mono', monospace; font-size: 0.63rem;
      color: var(--text-muted); margin-top: 2px;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .gallery-footer {
      display: flex; align-items: center; justify-content: space-between;
      margin-top: 8px;
    }
    .gallery-count {
      font-family: 'DM Mono', monospace; font-size: 0.65rem;
      color: #f59e0b; display: flex; align-items: center; gap: 4px;
    }

    /* ── Storage bar ── */
    .storage-row {
      display: flex; align-items: center; gap: 12px; margin-top: 16px;
      padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06);
    }
    .storage-label {
      font-family: 'DM Mono', monospace; font-size: 0.65rem;
      color: var(--text-muted); white-space: nowrap;
      em { font-style: normal; color: #f59e0b; }
    }
    .storage-track {
      flex: 1; height: 4px; background: rgba(255,255,255,0.08);
      border-radius: 99px; overflow: hidden;
    }
    .storage-fill {
      height: 100%; border-radius: 99px;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
      box-shadow: 0 0 8px rgba(245,158,11,0.5);
      transition: width 1s cubic-bezier(0.4,0,0.2,1);
    }

    @media (max-width: 900px) {
      .page { padding: 24px 20px; }
      .stat-grid { grid-template-columns: 1fr 1fr; }
      .panel-row--3-2, .panel-row--2-1-1 { grid-template-columns: 1fr; }
      .gallery-grid { grid-template-columns: 1fr 1fr; }
    }
  `],
  template: `
    <section class="page page-enter">

      <!-- ── Header ── -->
      <div class="pg-header page-enter-delay-1">
        <div>
          <h1 class="pg-title">Photo <em>Studio</em></h1>
          <div class="pg-sub">Bookings · Portfolio · Delivery</div>
        </div>
        <button class="pg-action">
          <i class="bi bi-plus-lg"></i>&nbsp;&nbsp;New Shoot
        </button>
      </div>

      <!-- ── Stat Cards ── -->
      <div class="stat-grid page-enter-delay-2">
        <app-stat-card
          label="Total Shoots"
          [value]="(stats()?.totalShoots ?? 0).toString()"
          [delta]="stats()?.shootsDelta ?? ''"
          [deltaUp]="true" icon="bi-camera2" accentColor="#f59e0b" />
        <app-stat-card
          label="Active Clients"
          [value]="(stats()?.activeClients ?? 0).toString()"
          [delta]="stats()?.clientsDelta ?? ''"
          [deltaUp]="true" icon="bi-people" accentColor="#00ffff" />
        <app-stat-card
          label="Photos Delivered"
          [value]="formatCount(stats()?.photosDelivered ?? 0)"
          [delta]="stats()?.deliveredDelta ?? ''"
          [deltaUp]="true" icon="bi-images" accentColor="#9d00ff" />
        <app-stat-card
          label="Revenue MTD"
          [value]="'$' + formatCount(stats()?.revenueMtd ?? 0)"
          [delta]="stats()?.revenueDelta ?? ''"
          [deltaUp]="true" icon="bi-currency-dollar" accentColor="#ff0080" />
      </div>

      <!-- ── Row 1: Shoots Table + Revenue Breakdown ── -->
      <div class="panel-row panel-row--3-2 page-enter-delay-3">

        <!-- Recent Shoots -->
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-calendar3" style="margin-right:6px;color:#f59e0b"></i>
              Shoot Schedule
            </span>
            <button class="panel__action">View All →</button>
          </div>
          <div class="panel__body" style="padding: 0 24px;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Shoot</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Photos</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (shoot of shoots(); track shoot._id) {
                  <tr>
                    <td>
                      <div class="shoot-name">{{ shoot.name }}</div>
                      <div class="shoot-client">{{ shoot.client }}</div>
                    </td>
                    <td><span class="type-badge">{{ shoot.type }}</span></td>
                    <td><span class="shoot-date">{{ formatDate(shoot.date) }}</span></td>
                    <td>
                      @if (shoot.photos > 0) {
                        <span class="photo-count">
                          <i class="bi bi-images"></i> {{ shoot.photos }}
                        </span>
                      } @else {
                        <span style="color:var(--text-muted);font-size:0.7rem">—</span>
                      }
                    </td>
                    <td>
                      <span class="status-badge"
                        [ngClass]="statusClass(shoot.status)">
                        {{ shoot.status }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Revenue by Shoot Type -->
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-bar-chart-line" style="margin-right:6px;color:#f59e0b"></i>
              Revenue by Type
            </span>
          </div>
          <div class="panel__body">
            @for (rev of stats()?.revenueByType ?? []; track rev.type) {
              <div class="progress-item">
                <div class="progress-label">
                  <span class="rev-type">{{ rev.type }}</span>
                  <span class="rev-amount">\${{ rev.amount.toLocaleString() }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill"
                       [style.width.%]="rev.pct"
                       [style.background]="rev.color"
                       [style.box-shadow]="'0 0 8px ' + rev.color + '55'">
                  </div>
                </div>
              </div>
            }

            <!-- Storage usage -->
            @if (stats()) {
              <div class="storage-row">
                <i class="bi bi-hdd" style="color:#f59e0b;font-size:0.9rem"></i>
                <div class="storage-track">
                  <div class="storage-fill"
                       [style.width.%]="storagePercent()">
                  </div>
                </div>
                <span class="storage-label">
                  <em>{{ stats()!.storageUsedGb.toFixed(2) }} TB</em>
                  / {{ stats()!.storageTotalGb.toFixed(1) }} TB
                </span>
              </div>
            }
          </div>
        </div>

      </div>

      <!-- ── Row 2: Client Roster + Equipment + Upcoming ── -->
      <div class="panel-row panel-row--2-1-1">

        <!-- Client Roster -->
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-person-vcard" style="margin-right:6px;color:#f59e0b"></i>
              Client Roster
            </span>
            <button class="panel__action">Manage →</button>
          </div>
          <div class="panel__body">
            @for (client of clients(); track client._id) {
              <div class="client-item">
                <div class="client-avatar">{{ initials(client.name) }}</div>
                <div>
                  <div class="client-name">{{ client.name }}</div>
                  <div class="client-meta">
                    {{ client.type }} · {{ client.totalShoots }} shoot{{ client.totalShoots > 1 ? 's' : '' }}
                    · Last: {{ formatDate(client.lastShoot) }}
                  </div>
                </div>
                <span class="client-spend">\${{ client.totalSpend.toLocaleString() }}</span>
              </div>
            }
          </div>
        </div>

        <!-- Equipment Status -->
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-camera" style="margin-right:6px;color:#f59e0b"></i>
              Gear
            </span>
          </div>
          <div class="panel__body" style="padding-top:12px">
            @for (item of equipment(); track item._id) {
              <div class="equip-item">
                <span class="equip-dot"
                      [ngClass]="equipDotClass(item.status)"></span>
                <div class="equip-info">
                  <div class="equip-name" [title]="item.name">{{ item.name }}</div>
                  <div class="equip-cat">{{ item.category }}</div>
                </div>
                @if (item.battery !== null) {
                  <span class="equip-battery">
                    <i class="bi bi-battery-half"></i>{{ item.battery }}%
                  </span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Upcoming Shoots -->
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-calendar-event" style="margin-right:6px;color:#f59e0b"></i>
              Upcoming
            </span>
          </div>
          <div class="panel__body" style="padding-top:12px">
            @for (shoot of upcomingShoots(); track shoot._id) {
              <div class="upcoming-item">
                <div class="upcoming-date-box">
                  <span class="udb-day">{{ shootDay(shoot.date) }}</span>
                  <span class="udb-month">{{ shootMonth(shoot.date) }}</span>
                </div>
                <div>
                  <div class="upcoming-name">{{ shoot.name }}</div>
                  <div class="upcoming-client">{{ shoot.client }}</div>
                  <div style="margin-top:4px">
                    <span class="type-badge" style="font-size:0.52rem">{{ shoot.type }}</span>
                  </div>
                </div>
              </div>
            }
            @if (upcomingShoots().length === 0) {
              <div style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:0.8rem">
                <i class="bi bi-calendar-x" style="display:block;font-size:1.5rem;margin-bottom:6px;opacity:0.4"></i>
                No upcoming shoots
              </div>
            }
          </div>
        </div>

      </div>

      <!-- ── Row 3: Gallery Grid ── -->
      <div class="panel-row panel-row--full">
        <div class="panel">
          <div class="panel__head">
            <span class="panel__title">
              <i class="bi bi-grid-3x3-gap" style="margin-right:6px;color:#f59e0b"></i>
              Recent Galleries
            </span>
            <button class="panel__action">All Galleries →</button>
          </div>
          <div class="panel__body">
            <div class="gallery-grid">
              @for (gallery of galleries(); track gallery._id) {
                <div class="gallery-card">
                  <div class="gallery-cover" [style.background]="gallery.coverGradient">
                    {{ gallery.coverEmoji }}
                    <div class="gallery-overlay"><span>VIEW GALLERY</span></div>
                  </div>
                  <div class="gallery-meta">
                    <div class="gallery-title" [title]="gallery.title">{{ gallery.title }}</div>
                    <div class="gallery-client">{{ gallery.client }}</div>
                    <div class="gallery-footer">
                      <span class="gallery-count">
                        <i class="bi bi-images"></i>
                        {{ gallery.count > 0 ? gallery.count + ' photos' : 'In progress' }}
                      </span>
                      <span class="status-badge" [ngClass]="statusClass(gallery.status)">
                        {{ gallery.status }}
                      </span>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- ── File Manager ── -->
      <app-file-manager category="photos"></app-file-manager>

    </section>
  `,
})
export class PhotosComponent implements OnInit {
  private api = inject(ApiService);

  stats     = signal<PhotoStats | null>(null);
  shoots    = signal<PhotoShoot[]>([]);
  clients   = signal<PhotoClient[]>([]);
  equipment = signal<PhotoEquipment[]>([]);
  galleries = signal<PhotoGallery[]>([]);

  // Only show Scheduled / In Session shoots in the upcoming panel
  upcomingShoots = () =>
    this.shoots().filter(s => s.status === 'Scheduled' || s.status === 'In Session');

  storagePercent = () => {
    const s = this.stats();
    if (!s) return 0;
    return (s.storageUsedGb / s.storageTotalGb) * 100;
  };

  ngOnInit() {
    this.api.getPhotoStats()     .subscribe({ next: d => this.stats.set(d) });
    this.api.getPhotoShoots()    .subscribe({ next: d => this.shoots.set(d) });
    this.api.getPhotoClients()   .subscribe({ next: d => this.clients.set(d) });
    this.api.getPhotoEquipment() .subscribe({ next: d => this.equipment.set(d) });
    this.api.getPhotoGalleries() .subscribe({ next: d => this.galleries.set(d) });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  formatCount(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });
  }

  shootDay(dateStr: string): string {
    return new Date(dateStr).getDate().toString();
  }

  shootMonth(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short' });
  }

  initials(name: string): string {
    const parts = name.trim().split(' ');
    return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
  }

  statusClass(status: string): Record<string, boolean> {
    return {
      'status-badge--scheduled':  status === 'Scheduled',
      'status-badge--in-session': status === 'In Session',
      'status-badge--editing':    status === 'Editing',
      'status-badge--delivered':  status === 'Delivered',
      'status-badge--archived':   status === 'Archived',
    };
  }

  equipDotClass(status: string): Record<string, boolean> {
    return {
      'equip-dot--ready':    status === 'Ready',
      'equip-dot--in-use':   status === 'In Use',
      'equip-dot--charging': status === 'Charging',
      'equip-dot--service':  status === 'Service',
    };
  }
}
