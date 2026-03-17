import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { Project, Task, ProjectStats, PaginationMeta } from '../models/project.model';

export type { Project, Task, ProjectStats, PaginationMeta };

/* ── Service ── */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private http = inject(HttpClient);
  private apiUrl = '/api/projects';

  // Signals for reactive state
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  currentProject = signal<Project | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);
  pagination = signal<PaginationMeta>({ page: 1, limit: 10, total: 0, pages: 0 });

  // Observable for subscriptions
  projects$ = new BehaviorSubject<Project[]>([]);
  tasks$ = new BehaviorSubject<Task[]>([]);

  /* ─── PROJECT METHODS ─── */

  getProjects(
    page: number = 1,
    limit: number = 10,
    filters?: { status?: string; priority?: string; category?: string }
  ): Observable<{ success: boolean; data: Project[]; pagination: PaginationMeta }> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.priority) params = params.set('priority', filters.priority);
    if (filters?.category) params = params.set('category', filters.category);

    return this.http.get<any>(this.apiUrl, { params }).pipe(
      map(res => {
        this.projects.set(res.data);
        this.pagination.set(res.pagination);
        this.projects$.next(res.data);
        this.isLoading.set(false);
        return res;
      })
    );
  }

  getProjectById(id: string): Observable<{ success: boolean; data: Project & { tasks: Task[] } }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(res => {
        this.currentProject.set(res.data);
        this.tasks.set(res.data.tasks);
        this.tasks$.next(res.data.tasks);
        this.isLoading.set(false);
      })
    );
  }

  createProject(project: Partial<Project>): Observable<{ success: boolean; data: Project }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<any>(this.apiUrl, project).pipe(
      tap(res => {
        this.projects.update(projects => [...projects, res.data]);
        this.projects$.next([...this.projects()]);
        this.isLoading.set(false);
      })
    );
  }

  updateProject(id: string, updates: Partial<Project>): Observable<{ success: boolean; data: Project }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.put<any>(`${this.apiUrl}/${id}`, updates).pipe(
      tap(res => {
        this.projects.update(projects =>
          projects.map(p => p._id === id ? res.data : p)
        );
        this.projects$.next([...this.projects()]);
        if (this.currentProject()?._id === id) {
          this.currentProject.set(res.data);
        }
        this.isLoading.set(false);
      })
    );
  }

  deleteProject(id: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        this.projects.update(projects => projects.filter(p => p._id !== id));
        this.projects$.next([...this.projects()]);
        this.isLoading.set(false);
      })
    );
  }

  addTeamMember(projectId: string, userId: string): Observable<{ success: boolean; data: Project }> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/team`, { userId }).pipe(
      tap(res => {
        this.projects.update(projects =>
          projects.map(p => p._id === projectId ? res.data : p)
        );
        this.projects$.next([...this.projects()]);
      })
    );
  }

  removeTeamMember(projectId: string, userId: string): Observable<{ success: boolean; data: Project }> {
    return this.http.delete<any>(`${this.apiUrl}/${projectId}/team`, {
      body: { userId }
    }).pipe(
      tap(res => {
        this.projects.update(projects =>
          projects.map(p => p._id === projectId ? res.data : p)
        );
        this.projects$.next([...this.projects()]);
      })
    );
  }

  /* ─── TASK METHODS ─── */

  getTasksByProject(
    projectId: string,
    filters?: { status?: string; priority?: string; assignee?: string }
  ): Observable<{ success: boolean; data: Task[]; pagination: PaginationMeta }> {
    this.isLoading.set(true);
    this.error.set(null);

    let params = new HttpParams();
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.priority) params = params.set('priority', filters.priority);
    if (filters?.assignee) params = params.set('assignee', filters.assignee);

    return this.http.get<any>(`${this.apiUrl}/${projectId}/tasks`, { params }).pipe(
      tap(res => {
        this.tasks.set(res.data);
        this.tasks$.next(res.data);
        this.isLoading.set(false);
      })
    );
  }

  getTaskById(projectId: string, taskId: string): Observable<{ success: boolean; data: Task }> {
    return this.http.get<any>(`${this.apiUrl}/${projectId}/tasks/${taskId}`);
  }

  createTask(projectId: string, task: Partial<Task>): Observable<{ success: boolean; data: Task }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.post<any>(`${this.apiUrl}/${projectId}/tasks`, task).pipe(
      tap(res => {
        this.tasks.update(tasks => [...tasks, res.data]);
        this.tasks$.next([...this.tasks()]);
        this.isLoading.set(false);
      })
    );
  }

  updateTask(projectId: string, taskId: string, updates: Partial<Task>): Observable<{ success: boolean; data: Task }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.put<any>(`${this.apiUrl}/${projectId}/tasks/${taskId}`, updates).pipe(
      tap(res => {
        this.tasks.update(tasks =>
          tasks.map(t => t._id === taskId ? res.data : t)
        );
        this.tasks$.next([...this.tasks()]);
        this.isLoading.set(false);
      })
    );
  }

  deleteTask(projectId: string, taskId: string): Observable<{ success: boolean; message: string }> {
    this.isLoading.set(true);
    this.error.set(null);

    return this.http.delete<any>(`${this.apiUrl}/${projectId}/tasks/${taskId}`).pipe(
      tap(() => {
        this.tasks.update(tasks => tasks.filter(t => t._id !== taskId));
        this.tasks$.next([...this.tasks()]);
        this.isLoading.set(false);
      })
    );
  }

  addTaskComment(projectId: string, taskId: string, text: string): Observable<{ success: boolean; data: Task }> {
    return this.http.post<any>(`${this.apiUrl}/${projectId}/tasks/${taskId}/comments`, { text });
  }

  /* ─── UTILITY METHODS ─── */

  getProjectStats(): ProjectStats {
    const projects = this.projects();
    const allTasks = this.tasks();

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'active').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const overallProgress = projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length)
      : 0;
    const tasksCompleted = allTasks.filter(t => t.status === 'completed').length;
    const tasksTotal = allTasks.length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overallProgress,
      tasksCompleted,
      tasksTotal
    };
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  getProjectsByStatus(status: string): Project[] {
    return this.projects().filter(p => p.status === status);
  }

  getOverdueTasks(): Task[] {
    const now = new Date();
    return this.tasks().filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < now;
    });
  }

  getHighPriorityTasks(): Task[] {
    return this.tasks().filter(t => t.priority === 'critical' || t.priority === 'high');
  }
}
