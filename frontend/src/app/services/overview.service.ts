import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { OverviewStats } from '../models/overview.model';

@Injectable({ providedIn: 'root' })
export class OverviewService {
  private api = inject(ApiService);

  stats = signal<OverviewStats | null>(null);

  getOverview(): Observable<OverviewStats> {
    return this.api.getOverview();
  }

  load(): void {
    this.api.getOverview().subscribe({ next: d => this.stats.set(d) });
  }
}
