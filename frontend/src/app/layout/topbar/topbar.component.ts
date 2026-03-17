import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
})
export class TopbarComponent implements OnInit {
  authService = inject(AuthService);
  today = '';

  ngOnInit() {
    this.today = new Date().toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
    });
  }

  getInitials(): string {
    const user = this.authService.currentUser();
    if (!user) return 'US';
    const parts = user.username.split(' ');
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }
}
