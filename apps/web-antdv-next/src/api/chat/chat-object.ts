import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 聊天对象类型枚举
 * 0=Anonymous, 1=Personal, 2=Room, 3=Official, 4=Subscription, 5=Square, 6=Robot, 7=ShopKeeper, 8=ShopWaiter, 9=Customer
 */
export enum ChatObjectTypeEnums {
  Anonymous = 0,
  Personal = 1,
  Room = 2,
  Official = 3,
  Subscription = 4,
  Square = 5,
  Robot = 6,
  ShopKeeper = 7,
  ShopWaiter = 8,
  Customer = 9,
}

/**
 * 验证方式枚举
 * 0=Free, 1=Password, 2=Verify
 */
export enum VerificationMethodEnums {
  Free = 0,
  Password = 1,
  Verify = 2,
}

export interface ChatObjectDto {
  categoryIds?: string[];
  chatObjectTypeId?: string;
  code?: string;
  creationTime?: string;
  creatorId?: string;
  description?: string;
  displayName?: string;
  gender?: number;
  id: number | string;
  isEnabled: boolean;
  isPublic?: boolean;
  name: string;
  objectType: ChatObjectTypeEnums;
  portrait?: string;
  thumbnail?: string;
  verificationMethod?: VerificationMethodEnums;
}

export interface ChatObjectDetailDto extends ChatObjectDto {
  categories?: { id: string; name: string }[];
  chatObjectType?: { id: string; name: string };
  serviceStatus?: number;
  stat?: Record<string, any>;
}

export interface GetChatObjectInput extends PagedAndSortedResultRequestDto {
  categoryIds?: string[];
  chatObjectTypeId?: string;
  gender?: number;
  isEnabled?: boolean;
  isPublic?: boolean;
  keyword?: string;
  objectType?: ChatObjectTypeEnums;
  verificationMethod?: VerificationMethodEnums;
}

export interface ChatObjectCreateInput {
  categoryIds?: string[];
  chatObjectTypeId: string;
  code?: string;
  description?: string;
  displayName?: string;
  gender?: number;
  isEnabled?: boolean;
  isPublic?: boolean;
  name: string;
  objectType: ChatObjectTypeEnums;
  password?: string;
  portrait?: string;
  thumbnail?: string;
  verificationMethod?: VerificationMethodEnums;
}

export interface ChatObjectUpdateInput {
  categoryIds?: string[];
  code?: string;
  description?: string;
  displayName?: string;
  gender?: number;
  isEnabled?: boolean;
  isPublic?: boolean;
  name?: string;
  portrait?: string;
  thumbnail?: string;
}

export interface SetVerificationMethodInput {
  id: number | string;
  password?: string;
  verificationMethod: VerificationMethodEnums;
}

/**
 * 分页获取聊天对象列表
 */
export async function getChatObjectsApi(params?: GetChatObjectInput) {
  return requestClient.get<PagedResultDto<ChatObjectDto>>('/chat/chat-object', {
    params,
  });
}

/**
 * 获取聊天对象详情
 */
export async function getChatObjectDetailApi(id: number | string) {
  return requestClient.get<ChatObjectDetailDto>(
    `/chat/chat-object/${id}/detail`,
  );
}

/**
 * 创建聊天对象
 */
export async function createChatObjectApi(data: ChatObjectCreateInput) {
  return requestClient.post<ChatObjectDto>('/chat/chat-object', data);
}

/**
 * 更新聊天对象基础信息
 */
export async function updateChatObjectApi(
  id: number | string,
  data: ChatObjectUpdateInput,
) {
  return requestClient.post<ChatObjectDto>(
    `/chat/chat-object/${id}/update`,
    data,
  );
}

/**
 * 删除聊天对象
 */
export async function deleteChatObjectApi(id: number | string) {
  return requestClient.post(`/chat/chat-object/${id}/delete`);
}

/**
 * 设置聊天对象验证方式
 */
export async function setVerificationMethodApi(
  data: SetVerificationMethodInput,
) {
  return requestClient.post<ChatObjectDto>(
    `/chat/chat-object/${data.id}/set-verification-method`,
    null,
    {
      params: {
        verificationMethod: data.verificationMethod,
      },
    },
  );
}

/**
 * 修改聊天对象名称
 */
export async function updateChatObjectNameApi(params: {
  id: number | string;
  name: string;
}) {
  return requestClient.post(
    `/chat/chat-object/${params.id}/update-name`,
    null,
    {
      params: { name: params.name },
    },
  );
}
