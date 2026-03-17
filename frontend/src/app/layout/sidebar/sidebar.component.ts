import { Component, signal, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  pill?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent {
  authService = inject(AuthService);
  isOpen = signal(false);

  channels: NavItem[] = [
    { label: 'Finance',      icon: 'bi-graph-up-arrow', route: '/finance', pill: '+2.4%' },
    { label: 'Fashion',      icon: 'bi-bag-heart',      route: '/fashion', pill: 'Hot'   },
    { label: 'Music & Audio',icon: 'bi-vinyl',          route: '/music'                  },
    { label: 'Photo Studio', icon: 'bi-camera2',        route: '/photos'                 },
    { label: 'Projects',     icon: 'bi-kanban',         route: '/projects'               },
  ];

  toggle() { this.isOpen.update(v => !v); }
  close()  { this.isOpen.set(false); }

  logout() {
    this.authService.logout();
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'US';
    const parts = user.username.split(' ');
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }
}
