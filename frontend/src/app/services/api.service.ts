import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

/* ── Re-export from models for backward compatibility ── */
export type { Portfolio, Ticker, Transaction, ExcelParseResult } from '../models/finance.model';
export type { FashionStats, Look, Brand } from '../models/fashion.model';
export type { MusicStats, Track } from '../models/music.model';
export type { OverviewStats } from '../models/overview.model';
export type { UploadedFile } from '../models/files.model';
export type { PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery, PhotoPackage, ShootFormData, ClientFormData } from '../models/photos.model';
export type { TradingBot, BotOrder, ExchangeConfig, BotFormData } from '../models/trading.model';

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
import type { PhotoStats, PhotoShoot, PhotoClient, PhotoEquipment, PhotoGallery, PhotoPackage, ShootFormData, ClientFormData } from '../models/photos.model';
import type { TradingBot, BotOrder, ExchangeConfig, BotFormData } from '../models/trading.model';

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
  createPhotoShoot(data: Partial<ShootFormData>): Observable<PhotoShoot> {
    return this.http.post<PhotoShoot>(`${this.base}/photos/shoots`, data);
  }
  updatePhotoShoot(id: string, data: Partial<ShootFormData>): Observable<PhotoShoot> {
    return this.http.patch<PhotoShoot>(`${this.base}/photos/shoots/${id}`, data);
  }
  deletePhotoShoot(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/photos/shoots/${id}`);
  }
  createPhotoClient(data: Partial<ClientFormData>): Observable<PhotoClient> {
    return this.http.post<PhotoClient>(`${this.base}/photos/clients`, data);
  }
  updatePhotoClient(id: string, data: Partial<PhotoClient>): Observable<PhotoClient> {
    return this.http.patch<PhotoClient>(`${this.base}/photos/clients/${id}`, data);
  }
  deletePhotoClient(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/photos/clients/${id}`);
  }
  getPhotoPackages(): Observable<PhotoPackage[]> {
    return this.http.get<PhotoPackage[]>(`${this.base}/photos/packages`);
  }
  updateEquipmentStatus(id: string, status: string): Observable<PhotoEquipment> {
    return this.http.patch<PhotoEquipment>(`${this.base}/photos/equipment/${id}/status`, { status });
  }
  updateGalleryStatus(id: string, status: string): Observable<PhotoGallery> {
    return this.http.patch<PhotoGallery>(`${this.base}/photos/galleries/${id}/status`, { status });
  }

  /* — Trading: Exchanges — */
  getExchangeConfigs(): Observable<ExchangeConfig[]> {
    return this.http.get<ExchangeConfig[]>(`${this.base}/trading/exchanges`);
  }
  saveExchangeConfig(exchange: string, environment: string, label: string): Observable<ExchangeConfig> {
    return this.http.post<ExchangeConfig>(`${this.base}/trading/exchanges`, { exchange, environment, label });
  }
  saveExchangeCredentials(
    exchange: string,
    apiKey: string,
    apiSecret: string,
    passphrase?: string
  ): Observable<{ message: string; config: ExchangeConfig }> {
    return this.http.post<{ message: string; config: ExchangeConfig }>(
      `${this.base}/trading/exchanges/credentials`,
      { exchange, apiKey, apiSecret, passphrase }
    );
  }
  clearExchangeCredentials(exchange: string): Observable<{ message: string; config: ExchangeConfig }> {
    return this.http.delete<{ message: string; config: ExchangeConfig }>(
      `${this.base}/trading/exchanges/${exchange}/credentials`
    );
  }

  /* — Trading: Bots — */
  getTradingBots(): Observable<TradingBot[]> {
    return this.http.get<TradingBot[]>(`${this.base}/trading/bots`);
  }
  createTradingBot(payload: Partial<BotFormData>): Observable<TradingBot> {
    return this.http.post<TradingBot>(`${this.base}/trading/bots`, payload);
  }
  setBotStatus(id: string, status: string): Observable<TradingBot> {
    return this.http.patch<TradingBot>(`${this.base}/trading/bots/${id}/status`, { status });
  }
  deleteTradingBot(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.base}/trading/bots/${id}`);
  }

  /* — Trading: Orders — */
  getBotOrders(botId?: string): Observable<BotOrder[]> {
    const params = botId ? `?botId=${botId}` : '';
    return this.http.get<BotOrder[]>(`${this.base}/trading/orders${params}`);
  }
}
