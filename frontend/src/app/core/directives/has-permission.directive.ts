import { Directive, Input, TemplateRef, ViewContainerRef, inject, OnDestroy } from '@angular/core';
import { RolesService } from '../../services/roles.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Structural directive to show/hide content based on user permissions
 * Usage:
 * @if (service.hasPermission('finance', 'read')); else noPerms) {
 *   <div>Finance content</div>
 * }
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true
})
export class HasRoleDirective implements OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private rolesService = inject(RolesService);
  private destroy$ = new Subject<void>();

  @Input()
  set appHasRole(roleName: string | string[]) {
    const roleNames = Array.isArray(roleName) ? roleName : [roleName];
    const hasRole = this.rolesService.hasAnyRole(roleNames);

    this.viewContainer.clear();
    if (hasRole) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  @Input()
  set appHasRoleElse(templateRef: TemplateRef<any>) {
    // For else template support
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective implements OnDestroy {
  private templateRef = inject(TemplateRef<any>);
  private viewContainer = inject(ViewContainerRef);
  private rolesService = inject(RolesService);
  private destroy$ = new Subject<void>();

  @Input()
  set appHasPermission(permission: { resource: string; action: string } | { resource: string; action: string }[]) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = this.rolesService.hasAnyPermission(permissions);

    this.viewContainer.clear();
    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
