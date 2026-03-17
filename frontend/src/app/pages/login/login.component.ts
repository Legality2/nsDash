import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isLogin = signal(true);
  email = '';
  password = '';
  username = '';
  confirmPassword = '';

  toggleMode() {
    this.isLogin.update(v => !v);
    this.resetForm();
  }

  submit() {
    if (this.isLogin()) {
      this.authService.login(this.email, this.password).subscribe({
        error: () => {} // Error handled by service
      });
    } else {
      this.authService.register(this.username, this.email, this.password, this.confirmPassword).subscribe({
        next: () => this.router.navigate(['/']),
        error: () => {} // Error handled by service
      });
    }
  }

  private resetForm() {
    this.email = '';
    this.password = '';
    this.username = '';
    this.confirmPassword = '';
    this.authService.error.set(null);
  }
}
