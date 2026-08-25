import {
  authBaseRequestClient,
  authRequestClient,
  baseRequestClient,
  requestClient,
} from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    client_id?: string;
    client_secret?: string;
    grant_type?: string;
    password?: string;
    scope?: string;
    username?: string;
    userName?: string;
  }

  /** 登录接口返回值 */
  export interface LoginResult {
    access_token?: string;
    accessToken?: string;
    expires_in?: number;
    id_token?: string;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  }

  export interface RefreshTokenResult {
    data: string;
    status: number;
  }
}

const DEFAULT_AUTH_TOKEN_PATH =
  (import.meta.env.VITE_AUTH_TOKEN_PATH as string) || '/connect/token';
const DEFAULT_CLIENT_ID =
  (import.meta.env.VITE_AUTH_CLIENT_ID as string) || 'IM_Mobile';
const DEFAULT_CLIENT_SECRET =
  (import.meta.env.VITE_AUTH_CLIENT_SECRET as string) || '1q2w3e*';
const DEFAULT_AUTH_SCOPE =
  (import.meta.env.VITE_AUTH_SCOPE as string) ||
  'IM offline_access roles profile phone email address';
const DEFAULT_GRANT_TYPE =
  (import.meta.env.VITE_AUTH_LOGIN_GRANT_TYPE as string) || 'password';

/**
 * 登录 (优先对接 OpenIddict 认证服务器 /connect/token 端点，按需兼容 Account API)
 */
export async function loginApi(data: AuthApi.LoginParams) {
  const username = data.username || data.userName || '';
  const password = data.password || '';

  // 构造 OpenIddict OAuth2 密码模式认证参数
  const authPayload = new URLSearchParams();
  authPayload.append('grant_type', data.grant_type || DEFAULT_GRANT_TYPE);
  authPayload.append('client_id', data.client_id || DEFAULT_CLIENT_ID);
  if (data.client_secret || DEFAULT_CLIENT_SECRET) {
    authPayload.append(
      'client_secret',
      data.client_secret || DEFAULT_CLIENT_SECRET,
    );
  }
  authPayload.append('scope', data.scope || DEFAULT_AUTH_SCOPE);
  authPayload.append('username', username);
  authPayload.append('password', password);

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

/**
 * 刷新accessToken
 */
export async function refreshTokenApi() {
  return authBaseRequestClient.post<AuthApi.RefreshTokenResult>(
    '/connect/token',
    {
      withCredentials: true,
    },
  );
}

/**
 * 退出登录
 */
export async function logoutApi() {
  return baseRequestClient.post('/auth/logout', {
    withCredentials: true,
  });
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
