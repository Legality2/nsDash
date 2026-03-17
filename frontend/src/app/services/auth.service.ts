import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { AuthUser, AuthResponse } from '../models/auth.model';

export type { AuthUser, AuthResponse };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private readonly API_URL = '/api/auth';

  // Signals
  isAuthenticated = signal<boolean>(false);
  currentUser = signal<AuthUser | null>(null);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);

  constructor() {
    this.loadStoredAuth();
  }

  private loadStoredAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      this.currentUser.set(JSON.parse(user));
      this.isAuthenticated.set(true);
      this.verifyToken(token).subscribe({
        error: () => this.logout()
      });
    }
  }

  register(username: string, email: string, password: string, confirmPassword: string): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.API_URL}/register`, {
      username,
      email,
      password,
      confirmPassword
    }).pipe(
      tap(response => {
        this.storeAuth(response.token, response.user);
        this.isAuthenticated.set(true);
        this.currentUser.set(response.user);
        this.isLoading.set(false);
      }),
      catchError(err => {
        const errorMsg = err.error?.error || 'Registration failed';
        this.error.set(errorMsg);
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<AuthResponse>(`${this.API_URL}/login`, { email, password }).pipe(
      tap(response => {
        this.storeAuth(response.token, response.user);
        this.isAuthenticated.set(true);
        this.currentUser.set(response.user);
        this.isLoading.set(false);
        this.router.navigate(['/']);
      }),
      catchError(err => {
        const errorMsg = err.error?.error || 'Login failed';
        this.error.set(errorMsg);
        this.isLoading.set(false);
        throw err;
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.error.set(null);
    this.router.navigate(['/login']);
  }

  verifyToken(token?: string): Observable<{ success: boolean; user: AuthUser }> {
    const storedToken = token || localStorage.getItem('token');
    
    if (!storedToken) {
      return of({ success: false, user: null as any });
    }

    return this.http.post<{ success: boolean; user: AuthUser }>(`${this.API_URL}/verify`, {}, {
      headers: { Authorization: `Bearer ${storedToken}` }
    }).pipe(
      map(response => {
        if (response.success) {
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
        }
        return response;
      }),
      catchError(() => {
        this.logout();
        return of({ success: false, user: null as any });
      })
    );
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private storeAuth(token: string, user: AuthUser) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }
}
