import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

import { listToTree } from './category-type';

/**
 * 属性录入类型枚举
 * 0=Text, 1=Number, 2=Date, 3=DateTime, 4=Boolean, 5=Choice
 */
export enum EntryInputTypeEnums {
  Text = 0,
  Number = 1,
  Date = 2,
  DateTime = 3,
  Boolean = 4,
  Choice = 5,
}

/**
 * 属性字典名/键定义 DTO (EntryName)
 */
export interface EntryNameDto {
  children?: EntryNameDto[];
  code?: string;
  creationTime?: string;
  defaultValue?: string;
  depth?: number;
  description?: string;
  help?: string;
  id: string;
  inputType?: EntryInputTypeEnums;
  isChoice?: boolean;
  isRequired?: boolean;
  name: string;
  parentId?: null | string;
  regex?: string;
  sorting?: number;
}

export interface EntryNameCreateInput {
  code?: string;
  defaultValue?: string;
  description?: string;
  help?: string;
  inputType?: EntryInputTypeEnums;
  isChoice?: boolean;
  isRequired?: boolean;
  name: string;
  parentId?: null | string;
  regex?: string;
  sorting?: number;
}

export interface EntryNameUpdateInput {
  code?: string;
  defaultValue?: string;
  description?: string;
  help?: string;
  inputType?: EntryInputTypeEnums;
  isChoice?: boolean;
  isRequired?: boolean;
  name: string;
  parentId?: null | string;
  regex?: string;
  sorting?: number;
}

/**
 * 字典项/属性可选值 DTO (EntryValue)
 */
export interface EntryValueDto {
  creationTime?: string;
  description?: string;
  entryNameId: string;
  id: string;
  name: string;
  sorting?: number;
  value: string;
}

export interface EntryValueCreateInput {
  description?: string;
  entryNameId: string;
  name: string;
  sorting?: number;
  value: string;
}

export interface EntryValueUpdateInput {
  description?: string;
  name: string;
  sorting?: number;
  value: string;
}

export interface GetEntryValueInput extends PagedAndSortedResultRequestDto {
  entryNameId?: string;
  keyword?: string;
}

// ==================== EntryName 字典键 API ====================

/**
 * 分页获取字典键列表
 */
export async function getEntryNamesApi(params?: PagedAndSortedResultRequestDto) {
  return requestClient.get<PagedResultDto<EntryNameDto>>('/chat/entry-name', {
    params,
  });
}

/**
 * 获取全量字典键并组装为树结构
 */
export async function getEntryNameTreeApi() {
  const res = await requestClient.get<PagedResultDto<EntryNameDto>>(
    '/chat/entry-name',
    {
      params: {
        maxResultCount: 1000,
        skipCount: 0,
      },
    },
  );
  return listToTree(res.items || []);
}

/**
 * 获取字典键详情
 */
export async function getEntryNameDetailApi(id: string) {
  return requestClient.get<EntryNameDto>(`/chat/entry-name/${id}`);
}

/**
 * 创建字典键
 */
export async function createEntryNameApi(data: EntryNameCreateInput) {
  return requestClient.post<EntryNameDto>('/chat/entry-name', data);
}

/**
 * 更新字典键
 */
export async function updateEntryNameApi(
  id: string,
  data: EntryNameUpdateInput,
) {
  return requestClient.post<EntryNameDto>(`/chat/entry-name/${id}/update`, data);
}

/**
 * 删除字典键
 */
export async function deleteEntryNameApi(id: string) {
  return requestClient.post(`/chat/entry-name/${id}/delete`);
}

// ==================== EntryValue 字典项 API ====================

/**
 * 分页获取字典项列表
 */
export async function getEntryValuesApi(params?: GetEntryValueInput) {
  return requestClient.get<PagedResultDto<EntryValueDto>>('/chat/entry-value', {
    params,
  });
}

/**
 * 获取字典项详情
 */
export async function getEntryValueDetailApi(id: string) {
  return requestClient.get<EntryValueDto>(`/chat/entry-value/${id}`);
}

/**
 * 创建字典项
 */
export async function createEntryValueApi(data: EntryValueCreateInput) {
  return requestClient.post<EntryValueDto>('/chat/entry-value', data);
}

/**
 * 更新字典项
 */
export async function updateEntryValueApi(
  id: string,
  data: EntryValueUpdateInput,
) {
  return requestClient.post<EntryValueDto>(
    `/chat/entry-value/${id}/update`,
    data,
  );
}

/**
 * 删除字典项
 */
export async function deleteEntryValueApi(id: string) {
  return requestClient.post(`/chat/entry-value/${id}/delete`);
}
