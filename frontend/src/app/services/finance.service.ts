import { Injectable, inject, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Portfolio, Ticker, Transaction, ExcelParseResult } from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private api = inject(ApiService);

  portfolio    = signal<Portfolio | null>(null);
  tickers      = signal<Ticker[]>([]);
  transactions = signal<Transaction[]>([]);

  loadAll(): void {
    this.loadPortfolio();
    this.loadTickers();
    this.loadTransactions();
  }

  loadPortfolio(): void {
    this.api.getPortfolio().subscribe({ next: d => this.portfolio.set(d) });
  }

  loadTickers(): void {
    this.api.getTickers().subscribe({ next: d => this.tickers.set(d) });
  }

  loadTransactions(): void {
    this.api.getTransactions().subscribe({ next: d => this.transactions.set(d) });
  }

  parseExcelFile(file: File): Observable<ExcelParseResult> {
    return this.api.parseExcelFile(file);
  }
}
