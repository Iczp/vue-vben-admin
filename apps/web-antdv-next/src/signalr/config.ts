/**
 * SignalR 与扫码登录全局配置
 */

function parseReconnectDelays(delaysStr?: string): number[] {
  if (!delaysStr) {
    return [0, 2000, 10000, 30000];
  }
  const parsed = delaysStr
    .split(',')
    .map((item) => Number(item.trim()))
    .filter((n) => !Number.isNaN(n));
  return parsed.length > 0 ? parsed : [0, 2000, 10000, 30000];
}

/** SignalR 通用基础配置 */
export const signalRConfig = {
  /** SignalR 根地址 */
  baseUrl:
    (import.meta.env.VITE_SIGNALR_BASE_URL as string) ||
    (import.meta.env.VITE_API_BASE_URL as string) ||
    'http://10.0.5.20:8044',
  /** 默认重连延迟序列（毫秒） */
  reconnectDelays: parseReconnectDelays(
    import.meta.env.VITE_SIGNALR_RECONNECT_DELAYS_MS as string,
  ),
  /** 是否跳过协商 */
  skipNegotiation:
    (import.meta.env.VITE_SIGNALR_SKIP_NEGOTIATION as string) !== 'false',
};

/** 聊天 Hub 配置（供未来扩展） */
export const chatHubConfig = {
  baseUrl: signalRConfig.baseUrl,
  hubPath:
    (import.meta.env.VITE_SIGNALR_HUB_PATH as string) || '/signalr-hubs/chat',
};

/** 扫码登录专用配置 */
export const scanLoginConfig = {
  /** OAuth Client Credentials 授权根地址 */
  authBaseUrl:
    (import.meta.env.VITE_SCAN_LOGIN_AUTH_BASE_URL as string) ||
    (import.meta.env.VITE_AUTH_BASE_URL as string) ||
    'http://10.0.5.20:8043',
  /** OAuth 客户端 ID */
  clientId:
    (import.meta.env.VITE_SCAN_LOGIN_AUTH_CLIENT_ID as string) || 'IM_Mobile',
  /** OAuth 客户端密钥 */
  clientSecret:
    (import.meta.env.VITE_SCAN_LOGIN_AUTH_CLIENT_SECRET as string) || '1q2w3e*',
  /** 二维码兜底过期秒数 */
  expiresSeconds:
    Number(import.meta.env.VITE_SCAN_LOGIN_QR_EXPIRES_SECONDS) || 90,
  /** 扫码 Hub 路径 */
  hubPath:
    (import.meta.env.VITE_SCAN_LOGIN_HUB_PATH as string) ||
    '/signalr-hubs/scan-login',
  /** scope */
  scope: (import.meta.env.VITE_SCAN_LOGIN_AUTH_SCOPE as string) || 'IM',
  /** 扫码 SignalR 服务端根地址 */
  signalRBaseUrl:
    (import.meta.env.VITE_SCAN_LOGIN_SIGNALR_BASE_URL as string) ||
    signalRConfig.baseUrl,
  /** 二维码协议模板 */
  template:
    (import.meta.env.VITE_SCAN_LOGIN_TEMPLATE as string) ||
    'gotoim://scan-login?code={code}',
  /** OAuth Token 路径 */
  tokenPath:
    (import.meta.env.VITE_SCAN_LOGIN_AUTH_TOKEN_PATH as string) ||
    '/connect/token',
};
