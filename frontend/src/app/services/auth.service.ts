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
    const userRaw = localStorage.getItem('user');
    
    if (!token || !userRaw) return;

    try {
      const parsedUser = JSON.parse(userRaw) as AuthUser;
      this.currentUser.set(parsedUser);
      this.isAuthenticated.set(true);
      this.verifyToken(token).subscribe({
        next: (result) => {
          if (!result.success) {
            this.invalidateSessionIfUnchanged(token);
          }
        }
      });
    } catch {
      // Corrupt/legacy localStorage value (e.g. "undefined")
      this.logout();
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
    this.clearAuthState();
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

  private clearAuthState() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
    this.error.set(null);
  }

  private invalidateSessionIfUnchanged(checkedToken: string) {
    // Avoid clobbering a brand-new successful login with a stale verify request result.
    if (localStorage.getItem('token') !== checkedToken) return;
    this.clearAuthState();
    this.router.navigate(['/login']);
  }
}
