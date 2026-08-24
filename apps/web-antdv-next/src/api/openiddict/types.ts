import type { PagedAndSortedResultRequestDto } from '#/api/abp/types';

export interface ApplicationDto {
  clientId?: string;
  clientType?: string;
  clientUri?: string;
  concurrencyStamp?: string;
  consentType?: string;
  displayName?: string;
  id: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  type?: string;
}

export interface ApplicationCreateInput {
  clientId: string;
  clientSecret?: string;
  clientType?: string;
  clientUri?: string;
  consentType?: string;
  displayName?: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  type?: string;
}

export interface ApplicationUpdateInput {
  clientId: string;
  clientType?: string;
  clientUri?: string;
  consentType?: string;
  displayName?: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  type?: string;
}

export interface GetApplicationsInput extends PagedAndSortedResultRequestDto {}

export interface ScopeDto {
  description?: string;
  descriptions?: Record<string, string>;
  displayName?: string;
  displayNames?: Record<string, string>;
  id: string;
  name: string;
  resources?: string[];
}

export interface ScopeCreateInput {
  description?: string;
  displayName?: string;
  name: string;
  resources?: string[];
}

export interface ScopeUpdateInput {
  description?: string;
  displayName?: string;
  name: string;
  resources?: string[];
}

export interface GetScopesInput extends PagedAndSortedResultRequestDto {}
