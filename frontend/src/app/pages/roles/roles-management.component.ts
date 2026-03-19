import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService, Role, Permission } from '../../services/roles.service';

interface RolePermissionView {
  displayed: Permission[];
  remainingCount: number;
}

@Component({
  selector: 'app-roles-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles-management.component.html',
  styleUrls: ['./roles-management.component.scss'],
})
export class RolesManagementComponent implements OnInit {
  rolesService = inject(RolesService);
  activeTab = signal<'roles' | 'permissions'>('roles');

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.rolesService.getRoles().subscribe();
    this.rolesService.getPermissions().subscribe();
  }

  openCreateRoleModal() {
    // TODO: Implement create role modal
    console.log('Open create role modal');
  }

  editRole(role: Role) {
    // TODO: Implement edit role
    console.log('Edit role:', role);
  }

  deleteRole(roleId: string) {
    if (confirm('Are you sure you want to delete this role?')) {
      this.rolesService.deleteRole(roleId).subscribe({
        next: () => {
          console.log('Role deleted');
        },
        error: (error) => {
          console.error('Error deleting role:', error);
        }
      });
    }
  }

  getPermissionView(permissions: Permission[] | undefined, limit: number = 3): RolePermissionView {
    if (!permissions || permissions.length === 0) {
      return { displayed: [], remainingCount: 0 };
    }
    return {
      displayed: permissions.slice(0, limit),
      remainingCount: Math.max(0, permissions.length - limit)
    };
  }
}
