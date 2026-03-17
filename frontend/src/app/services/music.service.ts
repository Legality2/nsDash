import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import { MusicStats, Track } from '../models/music.model';

@Injectable({ providedIn: 'root' })
export class MusicService {
  private api = inject(ApiService);

  stats  = signal<MusicStats | null>(null);
  tracks = signal<Track[]>([]);

  loadAll(): void {
    this.api.getMusicStats().subscribe({ next: d => this.stats.set(d) });
    this.api.getTracks(5).subscribe({ next: d => this.tracks.set(d) });
  }
}
