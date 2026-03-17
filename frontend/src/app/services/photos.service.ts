import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery } from '../models/photos.model';

@Injectable({ providedIn: 'root' })
export class PhotosService {
  private api = inject(ApiService);

  stats     = signal<PhotoStats | null>(null);
  shoots    = signal<PhotoShoot[]>([]);
  clients   = signal<PhotoClient[]>([]);
  equipment = signal<PhotoEquipment[]>([]);
  galleries = signal<PhotoGallery[]>([]);

  loadAll(): void {
    this.api.getPhotoStats()     .subscribe({ next: d => this.stats.set(d) });
    this.api.getPhotoShoots()    .subscribe({ next: d => this.shoots.set(d) });
    this.api.getPhotoClients()   .subscribe({ next: d => this.clients.set(d) });
    this.api.getPhotoEquipment() .subscribe({ next: d => this.equipment.set(d) });
    this.api.getPhotoGalleries() .subscribe({ next: d => this.galleries.set(d) });
  }

  updateShootStatus(id: string, status: string): Observable<PhotoShoot> {
    return this.api.updateShootStatus(id, status);
  }
}
