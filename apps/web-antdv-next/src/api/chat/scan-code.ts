import type {
  PagedAndSortedResultRequestDto,
  PagedResultDto,
} from '#/api/abp/types';

import { requestClient } from '#/api/request';

/**
 * 扫码处理器结果 DTO
 */
export interface ScanHandlerResultDto {
  actionType?: number;
  data?: any;
  extraProperties?: Record<string, any>;
  handlerFullName?: string;
  id?: string;
  isSuccess?: boolean;
  message?: string;
}

/**
 * 扫码记录 DTO
 */
export interface ScanCodeDto {
  clientId?: string;
  content?: string;
  creationTime?: string;
  creatorId?: string;
  deviceId?: string;
  execution?: string;
  extraProperties?: Record<string, any>;
  handlerCount?: number;
  id: string;
  scanHandlerList?: ScanHandlerResultDto[];
  type?: string;
  userId?: string;
}

export interface ScanCodeDetailDto extends ScanCodeDto {}

export interface ScanCodeInput {
  content: string;
  deviceId?: string;
  type?: string;
}

export interface GetScanCodeInput extends PagedAndSortedResultRequestDto {
  actionType?: number;
  handlerFullName?: string;
  keyword?: string;
  success?: boolean;
}

/**
 * 分页获取扫码日志记录
 */
export async function getScanCodeListApi(params?: GetScanCodeInput) {
  return requestClient.get<PagedResultDto<ScanCodeDto>>('/chat/scan-code', {
    params,
  });
}

/**
 * 获取扫码记录详情
 */
export async function getScanCodeDetailApi(id: string) {
  return requestClient.get<ScanCodeDetailDto>(`/chat/scan-code/${id}`);
}

/**
 * 模拟/触发扫码动作测试
 */
export async function simulateScanCodeApi(data: ScanCodeInput) {
  return requestClient.post<any>('/chat/scan-code/scan', data);
}
