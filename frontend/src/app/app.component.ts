import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { TopbarComponent }  from './layout/topbar/topbar.component';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { signal } from '@angular/core';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, CommonModule],
  template: `
    <div class="shell" [class.shell--login]="isLoginPage()">
      @if (!isLoginPage()) {
        <app-sidebar />
      }
      <div class="shell__main">
        @if (!isLoginPage()) {
          <app-topbar />
        }
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
    }
    .shell__main {
      flex: 1;
      display: flex;
      flex-direction: column;
      margin-left: var(--sidebar-w);
      min-width: 0;
    }
    .shell__content {
      flex: 1;
      padding-top: var(--topbar-h);
    }

    .shell--login {
      justify-content: center;
      align-items: center;
      
      .shell__main {
        margin-left: 0;
        padding-top: 0;
      }

      .shell__content {
        padding-top: 0;
      }
    }

    @media (max-width: 900px) {
      .shell__main { margin-left: 0; }
      .shell--login { justify-content: center; }
    }
  `],
})
export class AppComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  isLoginPage = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.isLoginPage.set(event.url === '/login');
      });

    // Check initial route
    this.isLoginPage.set(this.router.url === '/login');
  }
}

