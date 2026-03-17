import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { FashionStats, Look, Brand } from '../models/fashion.model';

@Injectable({ providedIn: 'root' })
export class FashionService {
  private api = inject(ApiService);

  stats  = signal<FashionStats | null>(null);
  looks  = signal<Look[]>([]);
  brands = signal<Brand[]>([]);

  loadAll(): void {
    this.api.getFashionStats().subscribe({ next: d => this.stats.set(d) });
    this.api.getLooks(6).subscribe({ next: d => this.looks.set(d) });
    this.api.getBrands().subscribe({ next: d => this.brands.set(d) });
  }

  toggleSaveLook(id: string): Observable<Look> {
    return this.api.toggleSaveLook(id);
  }
}
