import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 将平铺数组转换为树形结构
 */
export function listToTree<T extends { children?: T[]; id: string; parentId?: null | string }>(
  items: T[],
  parentId: null | string = null,
): T[] {
  return items
    .filter((item) => (item.parentId || null) === (parentId || null))
    .map((item) => {
      const children = listToTree(items, item.id);
      return {
        ...item,
        ...(children.length > 0 ? { children } : {}),
      };
    });
}

/**
 * 聊天对象分类 DTO
 */
export interface ChatObjectCategoryDto {
  children?: ChatObjectCategoryDto[];
  creationTime?: string;
  creatorId?: string;
  depth?: number;
  description?: string;
  id: string;
  name: string;
  parentId?: null | string;
  sorting?: number;
}

export interface ChatObjectCategoryCreateInput {
  description?: string;
  name: string;
  parentId?: null | string;
  sorting?: number;
}

export interface ChatObjectCategoryUpdateInput {
  description?: string;
  name: string;
  parentId?: null | string;
  sorting?: number;
}

/**
 * 聊天对象类型 DTO
 */
export interface ChatObjectTypeDto {
  chatObjectCount?: number;
  creationTime?: string;
  description?: string;
  id: string;
  isHasChild?: boolean;
  maxDepth?: number;
  name: string;
}

export interface ChatObjectTypeCreateInput {
  description?: string;
  id: string;
  isHasChild?: boolean;
  maxDepth?: number;
  name: string;
}

export interface ChatObjectTypeUpdateInput {
  description?: string;
  isHasChild?: boolean;
  maxDepth?: number;
  name: string;
}

// ==================== 分类 API ====================

/**
 * 分页获取分类列表
 */
export async function getCategoriesApi(params?: PagedAndSortedResultRequestDto) {
  return requestClient.get<PagedResultDto<ChatObjectCategoryDto>>(
    '/chat/chat-object-category',
    { params },
  );
}

/**
 * 获取全量分类列表并组装为树结构
 */
export async function getCategoryTreeApi() {
  const res = await requestClient.get<PagedResultDto<ChatObjectCategoryDto>>(
    '/chat/chat-object-category',
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
 * 获取分类详情
 */
export async function getCategoryDetailApi(id: string) {
  return requestClient.get<ChatObjectCategoryDto>(
    `/chat/chat-object-category/${id}`,
  );
}

/**
 * 创建分类
 */
export async function createCategoryApi(data: ChatObjectCategoryCreateInput) {
  return requestClient.post<ChatObjectCategoryDto>(
    '/chat/chat-object-category',
    data,
  );
}

/**
 * 更新分类
 */
export async function updateCategoryApi(
  id: string,
  data: ChatObjectCategoryUpdateInput,
) {
  return requestClient.post<ChatObjectCategoryDto>(
    `/chat/chat-object-category/${id}/update`,
    data,
  );
}

/**
 * 删除分类
 */
export async function deleteCategoryApi(id: string) {
  return requestClient.post(`/chat/chat-object-category/${id}/delete`);
}

// ==================== 类型 API ====================

/**
 * 分页获取聊天对象类型列表
 */
export async function getChatObjectTypesApi(
  params?: PagedAndSortedResultRequestDto,
) {
  return requestClient.get<PagedResultDto<ChatObjectTypeDto>>(
    '/chat/chat-object-type',
    { params },
  );
}

/**
 * 获取聊天对象类型详情
 */
export async function getChatObjectTypeDetailApi(id: string) {
  return requestClient.get<ChatObjectTypeDto>(`/chat/chat-object-type/${id}`);
}

/**
 * 创建聊天对象类型
 */
export async function createChatObjectTypeApi(data: ChatObjectTypeCreateInput) {
  return requestClient.post<ChatObjectTypeDto>('/chat/chat-object-type', data);
}

/**
 * 更新聊天对象类型
 */
export async function updateChatObjectTypeApi(
  id: string,
  data: ChatObjectTypeUpdateInput,
) {
  return requestClient.post<ChatObjectTypeDto>(
    `/chat/chat-object-type/${id}/update`,
    data,
  );
}

/**
 * 删除聊天对象类型
 */
export async function deleteChatObjectTypeApi(id: string) {
  return requestClient.post(`/chat/chat-object-type/${id}/delete`);
}
