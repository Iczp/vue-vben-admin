import type { PagedAndSortedResultRequestDto } from '#/api/abp/types';

export interface IdentityUserDto {
  accessFailedCount?: number;
  concurrencyStamp?: string;
  creationTime?: string;
  creatorId?: string;
  deleterId?: string;
  deletionTime?: string;
  email?: string;
  emailConfirmed?: boolean;
  entityVersion?: number;
  extraProperties?: Record<string, any>;
  id: string;
  isActive?: boolean;
  isDeleted?: boolean;
  lastModificationTime?: string;
  lastModifierId?: string;
  lastPasswordChangeTime?: string;
  lockoutEnabled?: boolean;
  lockoutEnd?: string;
  name?: string;
  phoneNumber?: string;
  phoneNumberConfirmed?: boolean;
  surname?: string;
  tenantId?: string;
  userName: string;
}

export interface IdentityUserCreateDto {
  email: string;
  extraProperties?: Record<string, any>;
  isActive?: boolean;
  lockoutEnabled?: boolean;
  name?: string;
  password?: string;
  phoneNumber?: string;
  roleNames?: string[];
  surname?: string;
  userName: string;
}

export interface IdentityUserUpdateDto {
  concurrencyStamp?: string;
  email: string;
  extraProperties?: Record<string, any>;
  isActive?: boolean;
  lockoutEnabled?: boolean;
  name?: string;
  phoneNumber?: string;
  roleNames?: string[];
  surname?: string;
  userName: string;
}

export interface GetIdentityUsersInput extends PagedAndSortedResultRequestDto {
  isLockedOut?: boolean;
  notActive?: boolean;
  roleId?: string;
}

export interface IdentityRoleDto {
  concurrencyStamp?: string;
  extraProperties?: Record<string, any>;
  id: string;
  isDefault?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
  name: string;
}

export interface IdentityRoleCreateDto {
  extraProperties?: Record<string, any>;
  isDefault?: boolean;
  isPublic?: boolean;
  name: string;
}

export interface IdentityRoleUpdateDto {
  concurrencyStamp?: string;
  extraProperties?: Record<string, any>;
  isDefault?: boolean;
  isPublic?: boolean;
  name: string;
}

export interface GetIdentityRolesInput extends PagedAndSortedResultRequestDto {}

/**
 * ABP 内置组织机构 / 部门 (OrganizationUnit) DTO
 */
export interface OrganizationUnitDto {
  children?: OrganizationUnitDto[];
  code?: string;
  concurrencyStamp?: string;
  creationTime?: string;
  creatorId?: string;
  displayName: string;
  extraProperties?: Record<string, any>;
  id: string;
  lastModificationTime?: string;
  lastModifierId?: string;
  parentId?: null | string;
  roles?: IdentityRoleDto[];
}

export interface OrganizationUnitCreateDto {
  displayName: string;
  extraProperties?: Record<string, any>;
  parentId?: null | string;
}

export interface OrganizationUnitUpdateDto {
  concurrencyStamp?: string;
  displayName: string;
  extraProperties?: Record<string, any>;
}

export interface GetOrganizationUnitInput
  extends PagedAndSortedResultRequestDto {}
