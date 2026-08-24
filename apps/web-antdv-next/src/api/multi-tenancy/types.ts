import type { PagedAndSortedResultRequestDto } from '#/api/abp/types';

export interface TenantDto {
  concurrencyStamp?: string;
  extraProperties?: Record<string, any>;
  id: string;
  name: string;
}

export interface TenantCreateDto {
  adminEmailAddress: string;
  adminPassword?: string;
  extraProperties?: Record<string, any>;
  name: string;
}

export interface TenantUpdateDto {
  concurrencyStamp?: string;
  extraProperties?: Record<string, any>;
  name: string;
}

export interface GetTenantsInput extends PagedAndSortedResultRequestDto {}
