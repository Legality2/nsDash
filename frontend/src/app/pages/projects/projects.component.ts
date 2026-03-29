import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ProjectService, Project, Task, ProjectStats, ProjectUserOption } from '../../services/project.service';
import { AuthService } from '../../services/auth.service';

type TabType = 'overview' | 'projects' | 'board';
type StatusFilter = 'all' | 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss']
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private destroy$ = new Subject<void>();

  // UI State
  activeTab: TabType = 'overview';
  statusFilter: StatusFilter = 'all';
  priorityFilter = 'all';
  showCreateModal = false;
  showTaskModal = false;
  selectedProject: Project | null = null;
  selectedTask: Task | null = null;
  searchQuery = '';

  // Form data
  newProject = {
    name: '',
    description: '',
    category: 'general',
    priority: 'medium',
    visibility: 'private',
    startDate: '',
    endDate: '',
    budget: 0
  };

  shareForm: Record<string, { userId: string; query: string; permission: 'view' | 'edit' }> = {};
  userPickerResults: Record<string, ProjectUserOption[]> = {};
  isSearchingUsers: Record<string, boolean> = {};

  newTask = {
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    estimatedHours: 0,
    labels: ''
  };

  // Service Signals & Observables
  projects = this.projectService.projects;
  tasks = this.projectService.tasks;
  isLoading = this.projectService.isLoading;
  currentProject = this.projectService.currentProject;
  stats = this.getStats.bind(this);

  statusOptions = [
    { value: 'all', label: 'All Projects' },
    { value: 'planning', label: 'Planning' },
    { value: 'active', label: 'Active' },
    { value: 'on-hold', label: 'On Hold' },
    { value: 'completed', label: 'Completed' },
    { value: 'archived', label: 'Archived' }
  ];

  priorityOptions = ['all', 'low', 'medium', 'high', 'critical'];
  categoryOptions = ['finance', 'fashion', 'music', 'general'];

  taskStatusGroups = [
    { status: 'todo', label: 'To Do', icon: '📋' },
    { status: 'in-progress', label: 'In Progress', icon: '⚙️' },
    { status: 'in-review', label: 'In Review', icon: '👀' },
    { status: 'completed', label: 'Completed', icon: '✅' },
    { status: 'blocked', label: 'Blocked', icon: '🚫' }
  ];

  ngOnInit() {
    this.loadProjects();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadProjects() {
    const filters = this.statusFilter !== 'all' ? { status: this.statusFilter } : undefined;
    this.projectService.getProjects(1, 50, filters)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error loading projects:', err)
      });
  }

  selectProject(project: Project) {
    this.selectedProject = project;
    this.projectService.getProjectById(project._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error loading project:', err)
      });
    this.activeTab = 'board';
  }

  createProject() {
    if (!this.newProject.name.trim()) return;

    const projectData: Partial<Project> = {
      name: this.newProject.name,
      description: this.newProject.description,
      category: this.newProject.category as 'finance' | 'fashion' | 'music' | 'general',
      priority: this.newProject.priority as 'low' | 'medium' | 'high' | 'critical',
      visibility: this.newProject.visibility as 'private' | 'public',
      startDate: this.newProject.startDate ? new Date(this.newProject.startDate) : undefined,
      endDate: this.newProject.endDate ? new Date(this.newProject.endDate) : undefined,
      budget: this.newProject.budget || undefined
    };

    this.projectService.createProject(projectData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showCreateModal = false;
          this.resetProjectForm();
          this.loadProjects();
        },
        error: (err) => console.error('Error creating project:', err)
      });
  }

  updateProjectStatus(project: Project, newStatus: string) {
    this.projectService.updateProject(project._id, { status: newStatus as 'planning' | 'active' | 'on-hold' | 'completed' | 'archived' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error updating project:', err)
      });
  }

  updateProjectVisibility(project: Project, visibility: 'private' | 'public') {
    this.projectService.updateProject(project._id, { visibility })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error updating project visibility:', err)
      });
  }

  deleteProject(project: Project) {
    if (confirm(`Delete project "${project.name}"? This action cannot be undone.`)) {
      this.projectService.deleteProject(project._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Error deleting project:', err)
        });
    }
  }

  grantProjectAccess(project: Project, event?: Event) {
    event?.stopPropagation();
    const form = this.shareForm[project._id];
    if (!form?.userId?.trim()) return;

    this.projectService.grantProjectAccess(project._id, form.userId.trim(), form.permission)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.shareForm[project._id] = { userId: '', query: '', permission: form.permission };
          this.userPickerResults[project._id] = [];
        },
        error: (err) => console.error('Error granting project access:', err)
      });
  }

  revokeProjectAccess(project: Project, userId: string, event?: Event) {
    event?.stopPropagation();
    this.projectService.revokeProjectAccess(project._id, userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error revoking project access:', err)
      });
  }

  createTask() {
    if (!this.selectedProject || !this.newTask.title.trim()) return;

    const taskData: Partial<Task> = {
      title: this.newTask.title,
      description: this.newTask.description,
      priority: this.newTask.priority as 'low' | 'medium' | 'high' | 'critical',
      assignee: this.newTask.assignee || undefined,
      dueDate: this.newTask.dueDate ? new Date(this.newTask.dueDate) : undefined,
      estimatedHours: this.newTask.estimatedHours || undefined,
      labels: this.newTask.labels ? this.newTask.labels.split(',').map(l => l.trim()) : []
    };

    this.projectService.createTask(this.selectedProject._id, taskData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showTaskModal = false;
          this.resetTaskForm();
        },
        error: (err) => console.error('Error creating task:', err)
      });
  }

  updateTaskStatus(task: Task, newStatus: string) {
    if (!this.selectedProject) return;

    this.projectService.updateTask(this.selectedProject._id, task._id, { status: newStatus as 'todo' | 'in-progress' | 'in-review' | 'completed' | 'blocked' })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error updating task:', err)
      });
  }

  deleteTask(task: Task) {
    if (!this.selectedProject) return;

    if (confirm(`Delete task "${task.title}"?`)) {
      this.projectService.deleteTask(this.selectedProject._id, task._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (err) => console.error('Error deleting task:', err)
        });
    }
  }

  getFilteredProjects(): Project[] {
    let filtered = this.projects();

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    if (this.priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === this.priorityFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  getTasksByStatus(status: string): Task[] {
    return this.tasks().filter(t => t.status === status);
  }

  getStats(): ProjectStats {
    return this.projectService.getProjectStats();
  }

  getProgressColor(progress: number): string {
    if (progress >= 80) return 'var(--neon-lime)';
    if (progress >= 50) return 'var(--neon-cyan)';
    if (progress >= 20) return 'var(--neon-magenta)';
    return 'var(--neon-pink)';
  }

  resetProjectForm() {
    this.newProject = {
      name: '',
      description: '',
      category: 'general',
      priority: 'medium',
      visibility: 'private',
      startDate: '',
      endDate: '',
      budget: 0
    };
  }

  canManageSharing(project: Project | null): boolean {
    if (!project) return false;
    return project.owner?._id === this.getCurrentUserId();
  }

  canEditProject(project: Project | null): boolean {
    if (!project) return false;
    const userId = this.getCurrentUserId();
    if (!userId) return false;
    if (project.owner?._id === userId) return true;
    if (project.teamMembers?.some(m => m._id === userId)) return true;
    return project.accessList?.some(a => a.user?._id === userId && a.permission === 'edit') || false;
  }

  getShareForm(projectId: string): { userId: string; query: string; permission: 'view' | 'edit' } {
    if (!this.shareForm[projectId]) {
      this.shareForm[projectId] = { userId: '', query: '', permission: 'view' };
    }
    return this.shareForm[projectId];
  }

  searchUsersForProject(projectId: string, query: string) {
    const form = this.getShareForm(projectId);
    form.query = query;

    if (query.trim().length < 2) {
      this.userPickerResults[projectId] = [];
      form.userId = '';
      return;
    }

    this.isSearchingUsers[projectId] = true;
    this.projectService.searchUsers(query.trim())
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (users) => {
          this.userPickerResults[projectId] = users;
          this.isSearchingUsers[projectId] = false;
        },
        error: (err) => {
          console.error('Error searching users:', err);
          this.userPickerResults[projectId] = [];
          this.isSearchingUsers[projectId] = false;
        }
      });
  }

  selectShareUser(projectId: string, user: ProjectUserOption, event?: Event) {
    event?.stopPropagation();
    const form = this.getShareForm(projectId);
    form.userId = user._id;
    form.query = `${user.username} (${user.email})`;
    this.userPickerResults[projectId] = [];
  }

  private getCurrentUserId(): string | null {
    const user = this.authService.currentUser();
    return (user as any)?.id || (user as any)?._id || null;
  }

  resetTaskForm() {
    this.newTask = {
      title: '',
      description: '',
      priority: 'medium',
      assignee: '',
      dueDate: '',
      estimatedHours: 0,
      labels: ''
    };
  }

  getStatusBadgeClass(status: string): string {
    return `status-badge status-${status}`;
  }

  getPriorityBadgeClass(priority: string): string {
    return `priority-badge priority-${priority}`;
  }
}
