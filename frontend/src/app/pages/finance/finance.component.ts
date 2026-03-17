import {
  Component, OnInit, OnDestroy, AfterViewInit,
  ViewChild, ElementRef,
  inject, signal, computed, effect,
} from '@angular/core';
import { DecimalPipe, DatePipe, NgClass } from '@angular/common';
import { Chart, registerables }           from 'chart.js';
import { ApiService }                     from '../../services/api.service';
import { Portfolio, Ticker, Transaction, ExcelParseResult } from '../../models/finance.model';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

Chart.register(...registerables);

@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [DecimalPipe, DatePipe, NgClass, StatCardComponent, FileManagerComponent],
  templateUrl: './finance.component.html',
  styleUrls: ['./finance.component.scss'],
})
export class FinanceComponent implements OnInit, AfterViewInit, OnDestroy {
  private api = inject(ApiService);

  /* DB signals */
  portfolio    = signal<Portfolio | null>(null);
  tickers      = signal<Ticker[]>([]);
  transactions = signal<Transaction[]>([]);

  /* Excel / source signals */
  dataSource        = signal<'db' | 'excel'>('db');
  excelTickers      = signal<Partial<Ticker>[]>([]);
  excelTransactions = signal<Partial<Transaction>[]>([]);
  excelFileName     = signal<string | null>(null);
  excelParsing      = signal(false);
  excelError        = signal<string | null>(null);
  isDragging        = signal(false);

  /* Computed active data */
  displayTickers = computed<Partial<Ticker>[]>(() =>
    this.dataSource() === 'excel' && this.excelTickers().length
      ? this.excelTickers()
      : this.tickers()
  );
  displayTransactions = computed<Partial<Transaction>[]>(() =>
    this.dataSource() === 'excel' && this.excelTransactions().length
      ? this.excelTransactions()
      : this.transactions()
  );

  /* Chart refs */
  @ViewChild('priceChartCanvas')  priceRef!:  ElementRef<HTMLCanvasElement>;
  @ViewChild('sectorChartCanvas') sectorRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('txChartCanvas')     txRef!:     ElementRef<HTMLCanvasElement>;

  private priceChart?:  Chart;
  private sectorChart?: Chart;
  private txChart?:     Chart;
  private chartsReady = false;

  constructor() {
    // Re-render whenever active data changes
    effect(() => {
      void this.displayTickers();
      void this.portfolio();
      void this.displayTransactions();
      if (this.chartsReady) this.renderAll();
    });
  }

  ngOnInit() {
    this.api.getPortfolio()    .subscribe({ next: d => this.portfolio.set(d)    });
    this.api.getTickers()      .subscribe({ next: d => this.tickers.set(d)      });
    this.api.getTransactions() .subscribe({ next: d => this.transactions.set(d) });
  }

  ngAfterViewInit() {
    this.chartsReady = true;
    this.renderAll();
  }

  ngOnDestroy() {
    this.priceChart?.destroy();
    this.sectorChart?.destroy();
    this.txChart?.destroy();
  }

  /* Data source */
  setSource(src: 'db' | 'excel') { this.dataSource.set(src); }

  /* Excel upload */
  onDragOver(e: DragEvent)  { e.preventDefault(); this.isDragging.set(true); }
  onDragLeave(e: DragEvent) {
    if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
      this.isDragging.set(false);
    }
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) this.parseExcel(f);
  }
  onFileSelect(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (f) this.parseExcel(f);
    (e.target as HTMLInputElement).value = '';
  }
  clearExcel() {
    this.excelTickers.set([]);
    this.excelTransactions.set([]);
    this.excelFileName.set(null);
    this.excelError.set(null);
    this.dataSource.set('db');
  }
  parseExcel(file: File) {
    this.excelParsing.set(true);
    this.excelError.set(null);
    this.api.parseExcelFile(file).subscribe({
      next: (data: ExcelParseResult) => {
        this.excelTickers.set(data.tickers);
        this.excelTransactions.set(data.transactions);
        this.excelFileName.set(file.name);
        this.excelParsing.set(false);
        this.dataSource.set('excel');
      },
      error: () => {
        this.excelError.set('Could not parse file. Ensure it is a valid .xlsx or .csv.');
        this.excelParsing.set(false);
      },
    });
  }

  /* Chart rendering */
  private renderAll() {
    this.renderPriceChart();
    this.renderSectorChart();
    this.renderTxChart();
  }

  private renderPriceChart() {
    if (!this.priceRef?.nativeElement) return;
    const tickers = this.displayTickers();

    this.priceChart?.destroy();
    this.priceChart = new Chart(this.priceRef.nativeElement, {
      type: 'bar',
      data: {
        labels: tickers.map(t => t.symbol ?? ''),
        datasets: [{
          label: 'Price ($)',
          data: tickers.map(t => t.price ?? 0),
          backgroundColor: tickers.map(t => (t.change ?? 0) >= 0
            ? 'rgba(42,157,92,0.18)' : 'rgba(212,85,106,0.18)'),
          borderColor: tickers.map(t => (t.change ?? 0) >= 0 ? '#2a9d5c' : '#d4556a'),
          borderWidth: 1.5,
          borderRadius: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => ` $${(ctx.raw as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              afterLabel: ctx => {
                const chg = (tickers[ctx.dataIndex]?.change ?? 0);
                return ` Change: ${chg >= 0 ? '+' : ''}${chg}%`;
              },
            },
          },
        },
        scales: {
          y: {
            grid: { color: 'rgba(10,10,15,0.05)' },
            ticks: {
              font: { family: "'DM Mono', monospace", size: 10 },
              color: '#8a8a9a',
              callback: v => `$${Number(v).toLocaleString()}`,
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'DM Mono', monospace", size: 10 }, color: '#8a8a9a' },
          },
        },
      },
    });
  }

  private renderSectorChart() {
    if (!this.sectorRef?.nativeElement) return;
    const sectors = this.portfolio()?.sectors ?? [];

    this.sectorChart?.destroy();
    if (!sectors.length) return;

    this.sectorChart = new Chart(this.sectorRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: sectors.map(s => s.name),
        datasets: [{
          data: sectors.map(s => s.allocation),
          backgroundColor: sectors.map(s => this.sectorColor(s.name) + 'bb'),
          borderColor:     sectors.map(s => this.sectorColor(s.name)),
          borderWidth: 1,
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { family: "'DM Mono', monospace", size: 9 },
              color: '#8a8a9a', boxWidth: 10, padding: 10,
            },
          },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.label}: ${ctx.raw}%` },
          },
        },
      },
    });
  }

  private renderTxChart() {
    if (!this.txRef?.nativeElement) return;
    const txns = this.displayTransactions();
    if (!txns.length) return;

    // Group by month
    const months: Record<string, { buy: number; sell: number }> = {};
    for (const tx of txns) {
      const key = new Date(tx.date ?? Date.now())
        .toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!months[key]) months[key] = { buy: 0, sell: 0 };
      if (tx.type === 'SELL') months[key].sell += tx.amount ?? 0;
      else                    months[key].buy  += tx.amount ?? 0;
    }
    const labels = Object.keys(months);

    this.txChart?.destroy();
    this.txChart = new Chart(this.txRef.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Buy',
            data: labels.map(l => months[l].buy),
            backgroundColor: 'rgba(42,157,92,0.22)',
            borderColor: '#2a9d5c',
            borderWidth: 1.5,
            borderRadius: 4,
          },
          {
            label: 'Sell',
            data: labels.map(l => months[l].sell),
            backgroundColor: 'rgba(212,85,106,0.22)',
            borderColor: '#d4556a',
            borderWidth: 1.5,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              font: { family: "'DM Mono', monospace", size: 9 },
              color: '#8a8a9a', boxWidth: 10, padding: 12,
            },
          },
          tooltip: {
            callbacks: {
              label: ctx => ` ${ctx.dataset.label}: $${(ctx.raw as number).toLocaleString()}`,
            },
          },
        },
        scales: {
          y: {
            grid: { color: 'rgba(10,10,15,0.05)' },
            stacked: false,
            ticks: {
              font: { family: "'DM Mono', monospace", size: 10 },
              color: '#8a8a9a',
              callback: v => `$${Number(v).toLocaleString()}`,
            },
          },
          x: {
            grid: { display: false },
            ticks: { font: { family: "'DM Mono', monospace", size: 10 }, color: '#8a8a9a' },
          },
        },
      },
    });
  }

  /* Helpers */
  news = [
    { source: 'Reuters · 14m',   title: 'Fed signals possible rate pause through Q2'         },
    { source: 'Bloomberg · 1h',  title: 'AI chip demand propels NVIDIA to record highs'       },
    { source: 'WSJ · 2h',        title: 'Dollar strengthens amid geopolitical tensions'       },
  ];

  formatMoney(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return n.toFixed(2);
  }

  toSparkPoints(data: number[]): string {
    if (!data?.length) return '';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step  = 80 / (data.length - 1);
    return data.map((v, i) => `${i * step},${28 - ((v - min) / range) * 24}`).join(' ');
  }

  sectorColor(name: string): string {
    const map: Record<string, string> = {
      Technology: '#6c63ff', Healthcare: '#2a9d8f',
      Consumer: 'var(--accent-gold)', Energy: '#e76f51', Other: 'var(--muted)',
    };
    return map[name] ?? '#888';
  }
}
