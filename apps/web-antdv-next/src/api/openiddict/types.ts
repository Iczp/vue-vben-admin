import type { PagedAndSortedResultRequestDto } from '#/api/abp/types';

export interface ApplicationDto {
  applicationType?: string;
  clientId?: string;
  clientType?: string;
  clientUri?: string;
  concurrencyStamp?: string;
  consentType?: string;
  displayName?: string;
  displayNames?: Record<string, string>;
  grantTypes?: string[];
  id: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  scopes?: string[];
  type?: string;
}

export interface ApplicationDetailDto extends ApplicationDto {
  creationTime?: string;
  extraProperties?: Record<string, any>;
  jsonWebKeySet?: string;
  properties?: Record<string, any>;
  settings?: Record<string, any>;
}

export interface ApplicationCreateInput {
  applicationType?: string;
  clientId: string;
  clientSecret?: string;
  clientType?: string;
  clientUri?: string;
  consentType?: string;
  displayName?: string;
  grantTypes?: string[];
  jsonWebKeySet?: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  scopes?: string[];
  settings?: string;
  type?: string;
}

export interface ApplicationUpdateInput {
  applicationType?: string;
  clientId: string;
  clientType?: string;
  clientUri?: string;
  consentType?: string;
  displayName?: string;
  grantTypes?: string[];
  jsonWebKeySet?: string;
  logoUri?: string;
  permissions?: string[];
  postLogoutRedirectUris?: string[];
  redirectUris?: string[];
  requirements?: string[];
  scopes?: string[];
  settings?: string;
  type?: string;
}

export interface GetApplicationsInput extends PagedAndSortedResultRequestDto {
  clientId?: string;
  clientType?: string;
  clientUri?: string;
  consentType?: string;
  displayName?: string;
  endCreationTime?: string;
  keyword?: string;
  logoUri?: string;
  postLogoutRedirectUri?: string;
  redirectUri?: string;
  startCreationTime?: string;
}

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

export interface GetScopesInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  name?: string;
}

export interface AuthorizationDto {
  applicationId?: string;
  creationDate?: string;
  creationTime?: string;
  id: string;
  scopes?: string[];
  status?: string;
  subject?: string;
  type?: string;
}

export interface GetAuthorizationsInput extends PagedAndSortedResultRequestDto {
  applicationId?: string;
  creationDate?: string;
  status?: string;
  subject?: string;
  type?: string;
}

export interface TokenDto {
  applicationId?: string;
  authorizationId?: string;
  creationDate?: string;
  creationTime?: string;
  expirationDate?: string;
  id: string;
  payload?: string;
  referenceId?: string;
  status?: string;
  subject?: string;
  type?: string;
}

export interface GetTokensInput extends PagedAndSortedResultRequestDto {
  applicationId?: string;
  authorizationId?: string;
  referenceId?: string;
  status?: string;
  subject?: string;
  type?: string;
}
