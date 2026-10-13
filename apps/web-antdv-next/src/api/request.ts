/**
 * ABP vNext 请求客户端与全局拦截器配置
 */
import type { RequestClientOptions } from '@vben/request';

import { h } from 'vue';

import { useAppConfig } from '@vben/hooks';
import { Copy } from '@vben/icons';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useAuthStore } from '#/store';
import { copyToClipboard } from '#/utils/clipboard';
import {
  getAppId,
  getAppVersion,
  getDeviceId,
  getDeviceType,
} from '#/utils/device';
import { getRequestErrorMessage } from '#/utils/request-error';

import { createAbpAntiforgery } from './abp/antiforgery';
import { refreshTokenApi } from './core';

/**
 * 构造支持两行展示且支持一键复制的全局错误提示 VNode
 */
function renderErrorMessageNode(title: string, detail?: string) {
  const fullText = detail ? `${title}\n${detail}` : title;

  return h(
    'div',
    {
      class:
        'inline-flex items-center gap-2 max-w-[500px] text-left select-text',
      style: { cursor: 'text', userSelect: 'text', WebkitUserSelect: 'text' },
    },
    [
      h(
        'div',
        {
          class: 'flex-1 min-w-0 flex flex-col justify-center leading-snug',
        },
        [
          h(
            'div',
            {
              class:
                'font-medium text-[13px] text-foreground whitespace-pre-wrap break-words max-w-[440px]',
              title,
            },
            title,
          ),
          detail
            ? h(
                'div',
                {
                  class:
                    'text-[12px] text-muted-foreground whitespace-pre-wrap break-words max-w-[440px] opacity-85 mt-0.5 font-normal',
                  title: detail,
                },
                detail,
              )
            : null,
        ].filter(Boolean),
      ),
      h(
        'button',
        {
          class:
            'p-1 text-muted-foreground hover:text-primary hover:bg-black/5 dark:hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0 ml-1',
          title: '复制错误信息',
          onClick: async (e: MouseEvent) => {
            e.stopPropagation();
            try {
              await copyToClipboard(fullText);
              message.success({
                content: '错误信息已复制',
                duration: 1.5,
                key: 'copy-toast',
              });
            } catch {
              message.warning({
                content: '复制失败，请手动选中文本',
                duration: 1.5,
                key: 'copy-toast',
              });
            }
          },
        },
        [h(Copy, { class: 'size-3.5' })],
      ),
    ],
  );
}

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);
const authURL =
  (import.meta.env.VITE_GLOB_AUTH_URL as string) || '/auth-server';


/**
 * 重新认证逻辑
 */
async function doReAuthenticate() {
  console.warn('Access token or refresh token is invalid or expired.');
  const accessStore = useAccessStore();
  const authStore = useAuthStore();
  accessStore.setAccessToken(null);
  if (
    preferences.app.loginExpiredMode === 'modal' &&
    accessStore.isAccessChecked
  ) {
    accessStore.setLoginExpired(true);
  } else {
    await authStore.logout();
  }
}

/**
 * 刷新token逻辑
 */
async function doRefreshToken() {
  const accessStore = useAccessStore();
  const resp = await refreshTokenApi();
  const newToken = resp.data;
  accessStore.setAccessToken(newToken);
  return newToken;
}

function formatToken(token: null | string) {
  return token ? `Bearer ${token}` : null;
}

/**
 * 统一 ABP 与 OAuth2 错误弹窗提示
 */
function handleUnifiedError(msg: string, error: unknown) {
  const { message: title, details: detail } = getRequestErrorMessage(error, msg || '请求失败');
  // RequestClient throws response.data. Preserve status information for empty HTTP errors.
  if (error && typeof error === 'object' && 'response' in error && error.response && typeof error.response === 'object') {
    const response = error.response as { data?: unknown; status?: number };
    if (typeof response.status === 'number' && (response.data === undefined || response.data === null || response.data === '')) {
      response.data = { error: { message: title, details: detail } };
    }
  }

  message.error({
    content: renderErrorMessageNode(title, detail),
    duration: 4,
  });
}

/**
 * 从 document.cookie 中读取指定 Cookie 键值
 */
function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(^|;\\s*)(${name})=([^;]*)`));
  return match ? decodeURIComponent(match[3] || '') : undefined;
}

/**
 * 为请求客户端统一注入公共 Header
 * 包含：App-Id、App-Device-Id (浏览器指纹)、App-Device-Type、App-Version、Accept-Language、__tenant、RequestVerificationToken
 */
const getAntiforgeryToken = createAbpAntiforgery({
  loadConfiguration: (service) => requestClient.get(service.configurationPath, {
    params: { includeLocalizationResources: false },
    withCredentials: true,
  }),
  readCookie: getCookie,
});

function applyCommonHeadersInterceptor(client: RequestClient, business = false) {
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      config.headers = config.headers || {};

      const appId = getAppId();
      const deviceId = await getDeviceId();
      const deviceType = await getDeviceType();
      const version = getAppVersion();

      config.headers['App-Id'] = appId;
      config.headers['App-Device-Id'] = deviceId;
      config.headers['App-Device-Type'] = deviceType;
      config.headers['App-Version'] = version;

      if (preferences.app?.locale) {
        config.headers['Accept-Language'] = preferences.app.locale;
      }

      const tenantId =
        localStorage.getItem('__tenant') ||
        sessionStorage.getItem('__tenant') ||
        undefined;
      if (tenantId && tenantId !== 'undefined' && tenantId !== 'null') {
        config.headers.__tenant = tenantId;
      }

      // Each independent API owns a distinct cookie/token pair.
      const xsrfToken = business
        ? await getAntiforgeryToken(config.url || '', config.method || 'GET', `${useAccessStore().accessToken || ''}:${tenantId || ''}`)
        : getCookie('XSRF-TOKEN');
      const token = xsrfToken || (/^\/(?:api\/)?chat\/scan-login(?:\/|$)/.test(config.url || '') ? getCookie('XSRF-TOKEN') : undefined);
      if (token) {
        config.headers.RequestVerificationToken = token;
        config.headers['X-XSRF-TOKEN'] = token;
      }
      if (business) config.withCredentials = true;

      return config;
    },
  });
}

/**
 * 创建业务 API 请求客户端
 */
function createBusinessRequestClient(
  baseURL: string,
  options?: RequestClientOptions,
) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 1. 注入公共设备指纹与租户等 Headers
  applyCommonHeadersInterceptor(client, true);

  // 2. 自动注入 Authorization Bearer Token
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const token = formatToken(accessStore.accessToken);
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = token;
      }
      return config;
    },
  });

  // 3. 响应数据格式处理 (适配 ABP REST 响应与常规格式)
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: (res) => (res && res.data !== undefined ? res.data : res),
      successCode: (code) => code === 0 || code === 200 || code === undefined,
    }),
  );

  // 4. 401 Token 无感刷新与重新认证
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // 5. ABP 统一错误处理拦截器
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      handleUnifiedError(msg, error);
    }),
  );

  return client;
}

/**
 * 创建 Auth 认证请求客户端
 * (专门对接 OpenIddict /connect/token /connect/userinfo 等认证端点，严格禁用 401 自动刷新以避免死循环)
 */
function createAuthRequestClient(
  baseURL: string,
  options?: RequestClientOptions,
) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  // 1. 注入公共设备指纹与租户等 Headers
  applyCommonHeadersInterceptor(client);

  // 2. Auth 请求按需注入已有 Token (例如 /connect/userinfo)
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const token = formatToken(accessStore.accessToken);
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = token;
      }
      return config;
    },
  });

  // 3. 响应数据格式处理
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: (res) => (res && res.data !== undefined ? res.data : res),
      successCode: (code) => code === 0 || code === 200 || code === undefined,
    }),
  );

  // 4. 认证专用统一错误处理拦截器 (不添加 authenticateResponseInterceptor)
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      handleUnifiedError(msg, error);
    }),
  );

  return client;
}

/**
 * 创建基础客户端 (带公共 Headers 注入)
 */
function createBaseRequestClient(
  baseURL: string,
  options?: RequestClientOptions,
) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });
  applyCommonHeadersInterceptor(client);
  return client;
}

// 业务 API 请求客户端 (基准前缀 /api)
export const requestClient = createBusinessRequestClient(apiURL, {
  responseReturn: 'body',
});

// 基础 API 请求客户端
export const baseRequestClient = createBaseRequestClient(apiURL);

// OpenIddict 认证服务器请求客户端 (基准前缀 /auth-server 或 /connect)
export const authRequestClient = createAuthRequestClient(authURL, {
  responseReturn: 'body',
});

// 基础认证请求客户端
export const authBaseRequestClient = createBaseRequestClient(authURL);
