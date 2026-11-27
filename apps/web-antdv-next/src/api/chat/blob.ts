import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 对象存储/二进制数据元数据 DTO
 */
export interface BlobDto {
  container?: string;
  fileName?: string;
  fileSize?: number;
  id: string;
  isOption?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
  mimeType?: string;
  name?: string;
  suffix?: string;
}

export interface BlobDetailDto extends BlobDto {
  creationTime?: string;
  creatorId?: string;
  extraProperties?: Record<string, any>;
}

export interface BlobUpdateInput {
  fileName?: string;
  isPublic?: boolean;
  isStatic?: boolean;
}

export interface GetBlobInput extends PagedAndSortedResultRequestDto {
  isOption?: boolean;
  isPublic?: boolean;
  isStatic?: boolean;
  keyword?: string;
}

/**
 * 分页获取二进制对象存储列表 (ChatAdmin)
 */
export async function getBlobListApi(params?: GetBlobInput) {
  return requestClient.get<PagedResultDto<BlobDto>>('/chat/admin/blob', {
    params,
  });
}

/**
 * 获取二进制对象详情 (ChatAdmin)
 */
export async function getBlobDetailApi(id: string) {
  return requestClient.get<BlobDetailDto>(`/chat/admin/blob/${id}`);
}

/**
 * 获取多个指定 ID 的二进制对象 (ChatAdmin)
 */
export async function getBlobManyApi(idList?: string[]) {
  return requestClient.get<BlobDto[]>('/chat/admin/blob/many', {
    params: { idList },
  });
}

/**
 * 更新二进制对象元数据 (ChatAdmin)
 */
export async function updateBlobApi(id: string, data: BlobUpdateInput) {
  return requestClient.put<BlobDto>(`/chat/admin/blob/${id}`, data);
}

/**
 * 删除二进制对象 (ChatAdmin)
 */
export async function deleteBlobApi(id: string) {
  return requestClient.delete<void>(`/chat/admin/blob/${id}`);
}
