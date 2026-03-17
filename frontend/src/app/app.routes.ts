import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
    title: 'Nexus — Login',
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent),
    title: 'Nexus — Overview',
  },
  {
    path: 'finance',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/finance/finance.component').then(m => m.FinanceComponent),
    title: 'Nexus — Finance',
  },
  {
    path: 'fashion',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/fashion/fashion.component').then(m => m.FashionComponent),
    title: 'Nexus — Fashion',
  },
  {
    path: 'music',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/music/music.component').then(m => m.MusicComponent),
    title: 'Nexus — Music & Audio',
  },
  {
    path: 'roles',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/roles/roles-management.component').then(m => m.RolesManagementComponent),
    title: 'Nexus — Role Management',
  },
  {
    path: 'projects',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/projects/projects.component').then(m => m.ProjectsComponent),
    title: 'Nexus — Project Management',
  },
  {
    path: 'photos',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/photos/photos.component').then(m => m.PhotosComponent),
    title: 'Nexus — Photo Studio',
  },
  { path: '**', redirectTo: 'login' },
];
