import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ── Re-export from models for backward compatibility ── */
export type { Portfolio, Ticker, Transaction, ExcelParseResult } from '../models/finance.model';
export type { FashionStats, Look, Brand } from '../models/fashion.model';
export type { MusicStats, Track } from '../models/music.model';
export type { OverviewStats } from '../models/overview.model';
export type { UploadedFile } from '../models/files.model';
export type { PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery } from '../models/photos.model';

/* ── Local imports for use within this service ── */
import type { Portfolio } from '../models/finance.model';
import type { Ticker } from '../models/finance.model';
import type { Transaction } from '../models/finance.model';
import type { ExcelParseResult } from '../models/finance.model';
import type { FashionStats } from '../models/fashion.model';
import type { Look } from '../models/fashion.model';
import type { Brand } from '../models/fashion.model';
import type { MusicStats } from '../models/music.model';
import type { Track } from '../models/music.model';
import type { OverviewStats } from '../models/overview.model';
import type { UploadedFile } from '../models/files.model';
import type { PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery } from '../models/photos.model';

/* ── Service ── */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = '/api';

  /* — Stats — */
  getOverview(): Observable<OverviewStats> {
    return this.http.get<OverviewStats>(`${this.base}/stats/overview`);
  }

  /* — Finance — */
  getPortfolio(): Observable<Portfolio> {
    return this.http.get<Portfolio>(`${this.base}/finance/portfolio`);
  }
  getTickers(): Observable<Ticker[]> {
    return this.http.get<Ticker[]>(`${this.base}/finance/tickers`);
  }
  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/finance/transactions`);
  }

  /* — Fashion — */
  getFashionStats(): Observable<FashionStats> {
    return this.http.get<FashionStats>(`${this.base}/fashion/stats`);
  }
  getLooks(limit = 6): Observable<Look[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Look[]>(`${this.base}/fashion/looks`, { params });
  }
  getBrands(): Observable<Brand[]> {
    return this.http.get<Brand[]>(`${this.base}/fashion/brands`);
  }
  toggleSaveLook(id: string): Observable<Look> {
    return this.http.patch<Look>(`${this.base}/fashion/looks/${id}/save`, {});
  }

  /* — Music — */
  getMusicStats(): Observable<MusicStats> {
    return this.http.get<MusicStats>(`${this.base}/music/stats`);
  }
  getTracks(limit = 10): Observable<Track[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<Track[]>(`${this.base}/music/tracks`, { params });
  }

  /* — Finance: Excel — */
  parseExcelFile(file: File): Observable<ExcelParseResult> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<ExcelParseResult>(`${this.base}/finance/excel/parse`, fd);
  }

  /* — Files — */
  getFiles(category?: string): Observable<UploadedFile[]> {
    let params = new HttpParams();
    if (category) params = params.set('category', category);
    return this.http.get<UploadedFile[]>(`${this.base}/files`, { params });
  }
  uploadFile(file: File, category: string): Observable<UploadedFile> {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', category);
    return this.http.post<UploadedFile>(`${this.base}/files/upload`, fd);
  }
  deleteFile(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/files/${id}`);
  }
  getFileDownloadUrl(id: string): string {
    return `${this.base}/files/${id}`;
  }

  /* — Photography — */
  getPhotoStats(): Observable<PhotoStats> {
    return this.http.get<PhotoStats>(`${this.base}/photos/stats`);
  }
  getPhotoShoots(): Observable<PhotoShoot[]> {
    return this.http.get<PhotoShoot[]>(`${this.base}/photos/shoots`);
  }
  getPhotoClients(): Observable<PhotoClient[]> {
    return this.http.get<PhotoClient[]>(`${this.base}/photos/clients`);
  }
  getPhotoEquipment(): Observable<PhotoEquipment[]> {
    return this.http.get<PhotoEquipment[]>(`${this.base}/photos/equipment`);
  }
  getPhotoGalleries(): Observable<PhotoGallery[]> {
    return this.http.get<PhotoGallery[]>(`${this.base}/photos/galleries`);
  }
  updateShootStatus(id: string, status: string): Observable<PhotoShoot> {
    return this.http.patch<PhotoShoot>(`${this.base}/photos/shoots/${id}/status`, { status });
  }
}
