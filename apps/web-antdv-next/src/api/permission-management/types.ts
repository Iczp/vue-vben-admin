export interface ProviderInfoDto {
  providerKey?: string;
  providerName?: string;
}

export interface PermissionGrantInfoDto {
  allowedProviders?: string[];
  displayName?: string;
  grantedProviders?: ProviderInfoDto[];
  isGranted?: boolean;
  name: string;
  parentName?: string;
}

export interface PermissionGroupDto {
  displayName?: string;
  displayNameKey?: string;
  displayNameResource?: string;
  name: string;
  permissions?: PermissionGrantInfoDto[];
}

export interface GetPermissionListResultDto {
  entityDisplayName?: string;
  groups?: PermissionGroupDto[];
}

export interface UpdatePermissionDto {
  isGranted: boolean;
  name: string;
}

export interface UpdatePermissionsDto {
  permissions: UpdatePermissionDto[];
}

export interface GetPermissionParams {
  providerKey: string;
  providerName: 'C' | 'R' | 'T' | 'U' | string;
}
