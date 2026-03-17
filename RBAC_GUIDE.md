# Role-Based Access Control (RBAC) System

## Overview

The Nexus Dashboard now includes a comprehensive Role-Based Access Control system that allows you to manage user roles and permissions.

## System Architecture

### Three Main Layers

1. **Permissions** - Granular access rights (e.g., "finance.read", "fashion.manage")
2. **Roles** - Collections of permissions (e.g., "financeManager", "admin")
3. **Users** - Can have one or multiple roles

### Role Hierarchy

```
Admin (System)
├── financeManager (System)
├── fashionManager (System)
├── musicManager (System)
├── projectManager (System)
├── viewer (System)
└── [Custom Roles created by Admin]
    ├── Custom Finance Manager
    ├── Custom Fashion Analyst
    └── etc.
```

## System Roles

### 1. Admin
- **Description**: Super administrator with full system access
- **Permissions**: All permissions in the system
- **Can**: Create/edit/delete roles, assign roles to users, manage all modules

### 2. Finance Manager
- **Description**: Manages finance module and reports
- **Permissions**:
  - finance.read, finance.create, finance.update, finance.delete, finance.manage
  - reports.read, reports.create

### 3. Fashion Manager
- **Description**: Manages fashion module and inventory
- **Permissions**:
  - fashion.read, fashion.create, fashion.update, fashion.delete, fashion.manage
  - reports.read

### 4. Music Manager
- **Description**: Manages music module and content
- **Permissions**:
  - music.read, music.create, music.update, music.delete, music.manage
  - reports.read

### 5. Project Manager
- **Description**: Oversees projects across all modules
- **Permissions**:
  - finance.read, fashion.read, music.read
  - users.read
  - reports.read, reports.create, reports.manage

### 6. Viewer
- **Description**: Read-only access to all modules
- **Permissions**:
  - finance.read, fashion.read, music.read, reports.read

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Seed Role Data
```bash
node seed-roles.js
```

This will create:
- All permissions
- All system roles
- Assign "admin" role to the first user in the database

### 3. Run the Server
```bash
npm run dev
```

## API Endpoints

### Permissions
```
GET    /api/roles/permissions           # Get all permissions
POST   /api/roles/permissions           # Create permission (admin only)
```

### Roles
```
GET    /api/roles/roles                 # Get all roles
GET    /api/roles/roles/:id             # Get single role
POST   /api/roles/roles                 # Create custom role (admin only)
PUT    /api/roles/roles/:id             # Update role (admin only)
DELETE /api/roles/roles/:id             # Delete role (admin only)
```

### User Roles
```
GET    /api/roles/users/:userId/roles                 # Get user's roles
POST   /api/roles/users/:userId/roles                 # Assign roles to user (admin only)
POST   /api/roles/users/:userId/roles/:roleId         # Add role to user (admin only)
DELETE /api/roles/users/:userId/roles/:roleId         # Remove role from user (admin only)
```

### User Permissions
```
GET    /api/roles/me/permissions        # Get current user's permissions
```

## Frontend Usage

### 1. RolesService

Access role and permission data in your components:

```typescript
import { RolesService } from './services/roles.service';

export class MyComponent {
  rolesService = inject(RolesService);

  ngOnInit() {
    // Load roles
    this.rolesService.getRoles().subscribe();
    
    // Load permissions
    this.rolesService.getPermissions().subscribe();
    
    // Load current user's permissions
    this.rolesService.loadUserPermissions();
  }

  // Check if user has a role
  isAdmin(): boolean {
    return this.rolesService.hasRole('admin');
  }

  // Check if user has permission
  canManageFinance(): boolean {
    return this.rolesService.hasPermission('finance', 'manage');
  }

  // Check if user has any of multiple roles
  isManager(): boolean {
    return this.rolesService.hasAnyRole(['financeManager', 'fashionManager', 'musicManager']);
  }
}
```

### 2. Using Directives (in templates)

Show/hide content based on roles:

```html
<!-- Using if/else syntax -->
@if (rolesService.hasRole('admin')) {
  <div>Admin only content</div>
} @else {
  <div>Non-admin content</div>
}

<!-- Using directives -->
@if (rolesService.hasPermission('finance', 'manage')) {
  <button (click)="exportData()">Export Data</button>
}
```

### 3. Role Management Page

Navigate to `/roles` (admin only) to:
- View all system and custom roles
- View all permissions
- Create custom roles based on existing roles
- Edit custom roles
- Delete custom roles (if not assigned to users)
- Assign/remove roles from users

## Creating Custom Roles

### Example: Custom Finance Analyst

1. Go to `/roles` page
2. Click "+ New Custom Role"
3. Fill in:
   - **Name**: `financeAnalyst`
   - **Description**: `Finance analyst with read and report access`
   - **Parent Role**: `financeManager` (optional)
   - **Permissions**: Select specific permissions
4. Click Create

### Inheriting from Parent Roles

When creating a custom role with a parent role, the child role inherits the parent's permissions but can have additional permissions added or removed.

## Creating Permissions

### Backend (Seed Data)

Add to `seed-roles.js`:

```javascript
{
  name: 'custom.action',
  description: 'Custom action description',
  resource: 'custom_resource',
  action: 'action_name'
}
```

Then run: `node seed-roles.js`

### Via API

```bash
curl -X POST http://localhost:3000/api/roles/permissions \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "custom.action",
    "description": "Custom action description",
    "resource": "custom_resource",
    "action": "action_name"
  }'
```

## Securing Routes

### Backend Route Protection

```typescript
import { requirePermission, requireRole, requireAdmin } from './middleware/auth.middleware.js';

// Require specific permission
router.get('/finance/export', requirePermission('finance', 'manage'), handler);

// Require specific role
router.post('/users', requireRole('admin'), handler);

// Require admin
router.delete('/system/reset', requireAdmin, handler);
```

### Frontend Route Guards

Routes are already protected with `authGuard`. To add role-specific protection:

```typescript
{
  path: 'admin-panel',
  canActivate: [authGuard],
  loadComponent: ...,
  // Can add additional role check in component
}
```

## Permission Structure

### Resources
- `finance` - Finance module
- `fashion` - Fashion module  
- `music` - Music module
- `users` - User management
- `roles` - Role management
- `reports` - Reports module
- `settings` - System settings

### Actions
- `read` - View/read data
- `create` - Create new records
- `update` - Edit existing records
- `delete` - Delete records
- `manage` - Full control (all actions)

## Signals & Reactive Updates

The RolesService uses Angular signals for reactive state management:

```typescript
// These are signals that auto-update
rolesService.roles()          // All roles
rolesService.permissions()    // All permissions
rolesService.userPermissions() // Current user's permissions
rolesService.isLoading()      // Loading state
rolesService.error()          // Error message
```

## Best Practices

1. **Principle of Least Privilege**: Assign only necessary permissions to roles
2. **Use Custom Roles**: Create custom roles for specific team needs
3. **Regular Audits**: Periodically review user roles and permissions
4. **System Roles**: Don't modify system roles, create custom roles instead
5. **Admin Account**: Keep admin role secure and rarely used
6. **Permission Checking**: Always check permissions on both backend AND frontend

## Troubleshooting

### User can't access a feature
1. Check user's roles via `/api/roles/users/:userId/roles`
2. Verify role has required permission
3. Check if permission is assigned to role

### Can't delete a role
- Role is assigned to users - remove from users first
- Role is a system role - create custom role instead

### Permissions not updating
- Run `node seed-roles.js` to ensure all permissions exist
- Clear browser cache
- Log out and log back in

## Database Models

### User
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String (hashed),
  roles: [ObjectId],  // Array of Role IDs
  isActive: Boolean,
  createdAt: Date
}
```

### Role
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  type: 'system' | 'custom',
  parentRole: ObjectId (optional),
  permissions: [ObjectId],
  createdBy: ObjectId (for custom roles),
  createdAt: Date,
  updatedAt: Date
}
```

### Permission
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  resource: String,
  action: String,
  createdAt: Date
}
```
