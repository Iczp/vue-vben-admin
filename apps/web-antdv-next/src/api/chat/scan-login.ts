import { requestClient } from '#/api/request';

/**
 * 扫码登录会话生成结果
 */
export interface GeneratedDto {
  actionUrl?: string;
  code: string;
  expires: number;
  qrCodeUrl?: string;
}

/**
 * 扫码登录发送测试指令入参
 */
export interface SendMessageInput {
  connectionId?: string;
  data?: any;
  method: string;
  userId?: string;
}

/**
 * 生成扫码登录标识码
 */
export async function generateScanLoginCodeApi() {
  return requestClient.get<GeneratedDto>('/chat/scan-login/generate');
}

/**
 * 移动端扫码通知
 */
export async function mobileScanCodeApi(code: string) {
  return requestClient.get<void>('/chat/scan-login/scan', { params: { code } });
}

/**
 * 移动端授权允许登录
 */
export async function mobileGrantLoginApi(code: string) {
  return requestClient.get<void>('/chat/scan-login/grant', {
    params: { code },
  });
}

/**
 * 移动端拒绝登录
 */
export async function mobileRejectLoginApi(code: string) {
  return requestClient.get<void>('/chat/scan-login/reject', {
    params: { code },
  });
}

/**
 * 取消扫码登录
 */
export async function cancelScanLoginApi(code: string) {
  return requestClient.get<void>('/chat/scan-login/cancel', {
    params: { code },
  });
}

/**
 * 发送扫码登录指令
 */
export async function sendScanLoginCommandApi(data: SendMessageInput) {
  return requestClient.post<void>('/chat/scan-login/send', data);
}
