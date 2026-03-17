import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [NgClass],
  template: `
    <div class="stat-card" [style.--card-color]="accentColor">
      <div class="stat-card__icon"><i [class]="'bi ' + icon"></i></div>
      <div class="stat-card__label">{{ label }}</div>
      <div class="stat-card__value">{{ value }}</div>
      <div class="stat-card__delta" [ngClass]="deltaUp ? 'delta-up' : 'delta-down'">
        <i class="bi" [class.bi-arrow-up-short]="deltaUp" [class.bi-arrow-down-short]="!deltaUp"></i>
        {{ delta }}
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      background: var(--dark-card);
      border-radius: 12px;
      padding: 22px 24px;
      border: 1px solid var(--border-color);
      position: relative;
      overflow: hidden;
      transition: all 0.3s ease;
      box-shadow: 0 0 20px rgba(0, 255, 255, 0.05);

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(0, 255, 255, 0.3);
        box-shadow: 0 12px 32px rgba(0, 255, 255, 0.15);
      }

      &::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 3px;
        background: var(--card-color, var(--neon-cyan));
        box-shadow: 0 0 10px var(--card-color, var(--neon-cyan));
      }

      &__icon {
        position: absolute;
        top: 18px; right: 20px;
        font-size: 2.5rem;
        opacity: 0.08;
        color: var(--card-color, var(--neon-cyan));
      }

      &__label {
        font-family: 'DM Mono', monospace;
        font-size: 0.62rem;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: var(--text-muted);
        margin-bottom: 10px;
      }

      &__value {
        font-family: 'DM Serif Display', serif;
        font-size: 2rem;
        letter-spacing: -1px;
        line-height: 1;
        margin-bottom: 6px;
        color: var(--text-primary);
      }
    }
  `],
})
export class StatCardComponent {
  @Input() label       = '';
  @Input() value       = '';
  @Input() delta       = '';
  @Input() deltaUp     = true;
  @Input() icon        = 'bi-graph-up';
  @Input() accentColor = 'var(--neon-cyan)';
}
