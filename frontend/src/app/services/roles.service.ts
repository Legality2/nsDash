import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { Permission, Role, UserPermissions } from '../models/roles.model';

export type { Permission, Role, UserPermissions };

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  private http = inject(HttpClient);
  private readonly API_URL = '/api/roles';

  // Signals
  roles = signal<Role[]>([]);
  permissions = signal<Permission[]>([]);
  userPermissions = signal<UserPermissions | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private userPermissionsSubject = new BehaviorSubject<UserPermissions | null>(null);
  userPermissions$ = this.userPermissionsSubject.asObservable();

  constructor() {
    this.loadUserPermissions();
  }

  /* ────────────────── PERMISSIONS ────────────────── */

  getPermissions(): Observable<Permission[]> {
    this.isLoading.set(true);
    return this.http.get<Permission[]>(`${this.API_URL}/permissions`).pipe(
      tap(perms => {
        this.permissions.set(perms);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error fetching permissions:', error);
        this.isLoading.set(false);
        this.error.set('Failed to fetch permissions');
        return of([]);
      })
    );
  }

  createPermission(perm: Partial<Permission>): Observable<{ success: boolean; permission: Permission }> {
    this.isLoading.set(true);
    return this.http.post<{ success: boolean; permission: Permission }>(`${this.API_URL}/permissions`, perm).pipe(
      tap(response => {
        this.permissions.update(perms => [...perms, response.permission]);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error creating permission:', error);
        this.isLoading.set(false);
        this.error.set(error.error?.error || 'Failed to create permission');
        throw error;
      })
    );
  }

  /* ────────────────── ROLES ────────────────── */

  getRoles(): Observable<Role[]> {
    this.isLoading.set(true);
    return this.http.get<Role[]>(`${this.API_URL}/roles`).pipe(
      tap(roles => {
        this.roles.set(roles);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error fetching roles:', error);
        this.isLoading.set(false);
        this.error.set('Failed to fetch roles');
        return of([]);
      })
    );
  }

  getRole(id: string): Observable<Role> {
    return this.http.get<Role>(`${this.API_URL}/roles/${id}`).pipe(
      catchError(error => {
        console.error('Error fetching role:', error);
        this.error.set('Failed to fetch role');
        throw error;
      })
    );
  }

  createRole(role: Partial<Role>): Observable<{ success: boolean; role: Role }> {
    this.isLoading.set(true);
    return this.http.post<{ success: boolean; role: Role }>(`${this.API_URL}/roles`, role).pipe(
      tap(response => {
        this.roles.update(roles => [...roles, response.role]);
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error creating role:', error);
        this.isLoading.set(false);
        this.error.set(error.error?.error || 'Failed to create role');
        throw error;
      })
    );
  }

  updateRole(id: string, updates: Partial<Role>): Observable<{ success: boolean; role: Role }> {
    this.isLoading.set(true);
    return this.http.put<{ success: boolean; role: Role }>(`${this.API_URL}/roles/${id}`, updates).pipe(
      tap(response => {
        this.roles.update(roles => 
          roles.map(r => r._id === id ? response.role : r)
        );
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error updating role:', error);
        this.isLoading.set(false);
        this.error.set(error.error?.error || 'Failed to update role');
        throw error;
      })
    );
  }

  deleteRole(id: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    return this.http.delete<{ success: boolean; message: string }>(`${this.API_URL}/roles/${id}`).pipe(
      tap(() => {
        this.roles.update(roles => roles.filter(r => r._id !== id));
        this.isLoading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting role:', error);
        this.isLoading.set(false);
        this.error.set(error.error?.error || 'Failed to delete role');
        throw error;
      })
    );
  }

  /* ────────────────── USER ROLES ────────────────── */

  getUserRoles(userId: string): Observable<Role[]> {
    return this.http.get<Role[]>(`${this.API_URL}/users/${userId}/roles`).pipe(
      catchError(error => {
        console.error('Error fetching user roles:', error);
        return of([]);
      })
    );
  }

  assignRoles(userId: string, roleIds: string[]): Observable<{ success: boolean; user: any }> {
    return this.http.post<{ success: boolean; user: any }>(`${this.API_URL}/users/${userId}/roles`, { roleIds }).pipe(
      tap(() => this.loadUserPermissions()),
      catchError(error => {
        console.error('Error assigning roles:', error);
        this.error.set(error.error?.error || 'Failed to assign roles');
        throw error;
      })
    );
  }

  addRoleToUser(userId: string, roleId: string): Observable<{ success: boolean; user: any }> {
    return this.http.post<{ success: boolean; user: any }>(`${this.API_URL}/users/${userId}/roles/${roleId}`, {}).pipe(
      tap(() => this.loadUserPermissions()),
      catchError(error => {
        console.error('Error adding role:', error);
        this.error.set(error.error?.error || 'Failed to add role');
        throw error;
      })
    );
  }

  removeRoleFromUser(userId: string, roleId: string): Observable<{ success: boolean; user: any }> {
    return this.http.delete<{ success: boolean; user: any }>(`${this.API_URL}/users/${userId}/roles/${roleId}`).pipe(
      tap(() => this.loadUserPermissions()),
      catchError(error => {
        console.error('Error removing role:', error);
        this.error.set(error.error?.error || 'Failed to remove role');
        throw error;
      })
    );
  }

  /* ────────────────── CURRENT USER PERMISSIONS ────────────────── */

  loadUserPermissions(): void {
    this.http.get<UserPermissions>(`${this.API_URL}/me/permissions`).subscribe({
      next: (data) => {
        this.userPermissions.set(data);
        this.userPermissionsSubject.next(data);
      },
      error: (error) => {
        console.error('Error loading user permissions:', error);
      }
    });
  }

  hasRole(roleName: string): boolean {
    const userPerms = this.userPermissions();
    return userPerms?.roles.includes(roleName) || false;
  }

  hasPermission(resource: string, action: string): boolean {
    const userPerms = this.userPermissions();
    if (!userPerms?.permissions) return false;
    
    return userPerms.permissions.some(
      perm => perm.resource === resource && perm.action === action
    );
  }

  hasAnyRole(roleNames: string[]): boolean {
    const userPerms = this.userPermissions();
    if (!userPerms?.roles) return false;
    
    return roleNames.some(roleName => userPerms.roles.includes(roleName));
  }

  hasAllRoles(roleNames: string[]): boolean {
    const userPerms = this.userPermissions();
    if (!userPerms?.roles) return false;
    
    return roleNames.every(roleName => userPerms.roles.includes(roleName));
  }

  hasAnyPermission(permissions: Array<{ resource: string; action: string }>): boolean {
    return permissions.some(perm => this.hasPermission(perm.resource, perm.action));
  }

  hasAllPermissions(permissions: Array<{ resource: string; action: string }>): boolean {
    return permissions.every(perm => this.hasPermission(perm.resource, perm.action));
  }
}
