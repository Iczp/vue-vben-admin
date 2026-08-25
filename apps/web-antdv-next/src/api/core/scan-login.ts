/**
 * 扫码登录专用 API
 */
import type { AuthApi } from './auth';

import { authRequestClient } from '#/api/request';
import { scanLoginConfig } from '#/signalr/config';

interface ScanLoginTokenCache {
  accessToken: string;
  expireTime: number;
}

let inMemoryTokenCache: null | ScanLoginTokenCache = null;

const DEFAULT_AUTH_TOKEN_PATH =
  (import.meta.env.VITE_AUTH_TOKEN_PATH as string) || '/connect/token';
const DEFAULT_CLIENT_ID =
  (import.meta.env.VITE_AUTH_CLIENT_ID as string) || 'IM_Mobile';
const DEFAULT_CLIENT_SECRET =
  (import.meta.env.VITE_AUTH_CLIENT_SECRET as string) || '1q2w3e*';
const DEFAULT_AUTH_SCOPE =
  (import.meta.env.VITE_AUTH_SCOPE as string) ||
  'IM offline_access roles profile phone email address';

/**
 * 获取待登录端连接 ScanLogin Hub 所需的 client_credentials 匿名 Token
 * 具备内存及 SessionStorage 缓存能力，避免短时间内重复申请
 */
export async function fetchScanLoginHubTokenApi(
  forceRefresh = false,
): Promise<string> {
  const now = Date.now();

  // 1. 检查内存缓存
  if (
    !forceRefresh &&
    inMemoryTokenCache &&
    inMemoryTokenCache.expireTime > now + 30 * 1000
  ) {
    return inMemoryTokenCache.accessToken;
  }

  // 2. 检查 SessionStorage 缓存
  const STORAGE_KEY = '__scan_login_hub_token__';
  if (!forceRefresh) {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: ScanLoginTokenCache = JSON.parse(stored);
        if (parsed?.accessToken && parsed.expireTime > now + 30 * 1000) {
          inMemoryTokenCache = parsed;
          return parsed.accessToken;
        }
      }
    } catch {
      // 忽略解析错误
    }
  }

  // 3. 发起 client_credentials 认证请求
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', scanLoginConfig.clientId);
  if (scanLoginConfig.clientSecret) {
    params.append('client_secret', scanLoginConfig.clientSecret);
  }
  params.append('scope', scanLoginConfig.scope);

  const res = await authRequestClient.post<AuthApi.LoginResult>(
    scanLoginConfig.tokenPath,
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  const token = res.access_token || res.accessToken || '';
  const expiresIn = res.expires_in || 3600;

  if (token) {
    const cacheData: ScanLoginTokenCache = {
      accessToken: token,
      expireTime: now + expiresIn * 1000,
    };
    inMemoryTokenCache = cacheData;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));
    } catch {
      // 忽略存储错误
    }
  }

  return token;
}

/**
 * 待登录端收到手机端授权确认 (granted) 后，使用 scan_token 兑换正式用户 OAuth 会话 Token
 */
export async function exchangeScanTokenLoginApi(scanToken: string) {
  const authPayload = new URLSearchParams();
  authPayload.append('grant_type', 'scan-token');
  authPayload.append('client_id', DEFAULT_CLIENT_ID);
  if (DEFAULT_CLIENT_SECRET) {
    authPayload.append('client_secret', DEFAULT_CLIENT_SECRET);
  }
  authPayload.append('scope', DEFAULT_AUTH_SCOPE);
  authPayload.append('scan_token', scanToken);

  const res = await authRequestClient.post<AuthApi.LoginResult>(
    DEFAULT_AUTH_TOKEN_PATH,
    authPayload,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  return {
    accessToken: res.access_token || res.accessToken || '',
    ...res,
  };
}
