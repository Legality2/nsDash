export interface Permission {
  _id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface Role {
  _id: string;
  name: string;
  description: string;
  type: 'system' | 'custom';
  permissions: Permission[];
  parentRole?: Role;
  createdBy?: any;
}

export interface UserPermissions {
  roles: string[];
  permissions: Permission[];
}
