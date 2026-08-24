/**
 * ABP vNext 核心 DTO 与通用响应结构
 */

export interface PagedResultDto<T> {
  items: T[];
  totalCount: number;
}

export interface ListResultDto<T> {
  items: T[];
}

export interface PagedAndSortedResultRequestDto {
  filter?: string;
  maxResultCount?: number;
  skipCount?: number;
  sorting?: string;
}

export interface RemoteServiceErrorInfo {
  code?: string;
  data?: Record<string, any>;
  details?: string;
  message?: string;
  validationErrors?: {
    members?: string[];
    message?: string;
  }[];
}

export interface RemoteServiceErrorResponse {
  error?: RemoteServiceErrorInfo;
}

export interface CurrentUserDto {
  email?: string;
  emailVerified?: boolean;
  id?: string;
  isAuthenticated?: boolean;
  name?: string;
  phoneNumber?: string;
  phoneNumberVerified?: boolean;
  roles?: string[];
  surName?: string;
  tenantId?: string;
  userName?: string;
}

export interface CurrentTenantDto {
  id?: string;
  isAvailable?: boolean;
  name?: string;
}

export interface ApplicationAuthConfigurationDto {
  grantedPolicies?: Record<string, boolean>;
}

export interface ApplicationSettingConfigurationDto {
  values?: Record<string, string>;
}

export interface LanguageInfoDto {
  cultureName?: string;
  displayName?: string;
  flagIcon?: string;
  uiCultureName?: string;
}

export interface ApplicationLocalizationConfigurationDto {
  currentCulture?: {
    cultureName?: string;
    displayName?: string;
    englishName?: string;
    isRightToLeft?: boolean;
    name?: string;
    nativeName?: string;
    twoLetterISOLanguageName?: string;
  };
  languages?: LanguageInfoDto[];
  values?: Record<string, Record<string, string>>;
}

export interface ApplicationConfigurationDto {
  auth?: ApplicationAuthConfigurationDto;
  currentTenant?: CurrentTenantDto;
  currentUser?: CurrentUserDto;
  localization?: ApplicationLocalizationConfigurationDto;
  setting?: ApplicationSettingConfigurationDto;
}
