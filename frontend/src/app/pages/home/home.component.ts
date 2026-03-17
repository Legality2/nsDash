import { Component, OnInit, inject } from '@angular/core';
import { RouterLink }       from '@angular/router';
import { OverviewService }       from '../../services/overview.service';
import { StatCardComponent }    from '../../shared/stat-card/stat-card.component';
import { FileManagerComponent } from '../../shared/file-manager/file-manager.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, StatCardComponent, FileManagerComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  overviewService = inject(OverviewService);
  today = '';

  channels = [
    { name: 'Finance',       score: 84, color: 'var(--neon-cyan)'     },
    { name: 'Fashion',       score: 71, color: 'var(--neon-magenta)'  },
    { name: 'Music & Audio', score: 93, color: 'var(--neon-lime)'     },
    { name: 'Automations',   score: 57, color: 'var(--neon-blue)'     },
  ];

  feed = [
    { emoji: '📈', bg: 'linear-gradient(135deg,rgba(0,255,255,0.1),rgba(0,255,255,0.2))', source: 'Finance · 2m ago',  title: 'NVDA surges 4.2% on earnings beat'      },
    { emoji: '👗', bg: 'linear-gradient(135deg,rgba(255,0,255,0.1),rgba(255,0,255,0.2))', source: 'Fashion · 18m ago', title: 'Valentino drops new capsule collection'  },
    { emoji: '🎵', bg: 'linear-gradient(135deg,rgba(0,255,0,0.1),rgba(0,255,0,0.2))',   source: 'Music · 1h ago',    title: "Kendrick's new LP hits #1 globally"      },
  ];

  quickNav = [
    { label: 'Finance',       emoji: '📊', route: '/finance', color: 'var(--neon-cyan)'    },
    { label: 'Fashion',       emoji: '👗', route: '/fashion', color: 'var(--neon-magenta)' },
    { label: 'Music & Audio', emoji: '🎵', route: '/music',   color: 'var(--neon-lime)'    },
  ];

  ngOnInit() {
    this.today = new Date().toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    this.overviewService.load();
  }

  formatNum(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(0) + 'K';
    return String(n);
  }
  formatStreams(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    return String(n);
  }
}
