export interface ProjectAccessEntry {
  user: { _id: string; username: string; email: string };
  permission: 'view' | 'edit';
  grantedAt?: string;
}

export interface Project {
  _id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  owner: { _id: string; username: string; email: string };
  teamMembers: { _id: string; username: string; email: string }[];
  visibility: 'private' | 'public';
  accessList: ProjectAccessEntry[];
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  actualCost: number;
  progress: number;
  category: 'finance' | 'fashion' | 'music' | 'general';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  title: string;
  description: string;
  project: string;
  status: 'todo' | 'in-progress' | 'in-review' | 'completed' | 'blocked';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string | { _id: string; username: string; email: string };
  reporter: { _id: string; username: string; email: string };
  dueDate?: Date;
  estimatedHours?: number;
  actualHours: number;
  subtasks: { title: string; completed: boolean; assignee?: string }[];
  dependencies: string[];
  labels: string[];
  attachments: { name: string; url: string; uploadedAt: string }[];
  comments: { author: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overallProgress: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}
