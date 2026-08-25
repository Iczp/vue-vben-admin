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

import { refreshTokenApi } from './core';

/**
 * 构造支持两行展示且支持一键复制的全局错误提示 VNode
 */
function renderErrorMessageNode(title: string, detail?: string) {
  const fullText = detail ? `${title}\n${detail}` : title;

  return h(
    'div',
    {
      class: 'inline-flex items-center gap-2 max-w-[500px] text-left select-text',
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
              class: 'font-medium text-[13px] text-foreground truncate max-w-[440px]',
              title,
            },
            title,
          ),
          detail
            ? h(
                'div',
                {
                  class:
                    'text-[12px] text-muted-foreground truncate max-w-[440px] opacity-85 mt-0.5 font-normal',
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
const authURL = (import.meta.env.VITE_GLOB_AUTH_URL as string) || '/auth-server';

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

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

  // 请求头处理：注入 Token、Accept-Language 和 __tenant 租户头
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      const accessStore = useAccessStore();
      const tenantId =
        localStorage.getItem('__tenant') ||
        sessionStorage.getItem('__tenant') ||
        undefined;

      config.headers.Authorization = formatToken(accessStore.accessToken);
      config.headers['Accept-Language'] = preferences.app.locale;
      if (tenantId) {
        config.headers.__tenant = tenantId;
      }
      return config;
    },
  });

  // 处理返回的响应数据格式：适配 ABP REST 响应与常规返回
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: (res) => (res && res.data !== undefined ? res.data : res),
      successCode: (code) => code === 0 || code === 200 || code === undefined,
    }),
  );

  // token过期的处理
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      client,
      doReAuthenticate,
      doRefreshToken,
      enableRefreshToken: preferences.app.enableRefreshToken,
      formatToken,
    }),
  );

  // ABP 统一错误处理拦截器
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      const abpError = responseData?.error;
      let title = msg || '请求失败';
      let detail = '';

      if (typeof abpError === 'object' && abpError !== null) {
        if (abpError.message) {
          title = abpError.message;
        }
        if (
          Array.isArray(abpError.validationErrors) &&
          abpError.validationErrors.length > 0
        ) {
          detail = abpError.validationErrors
            .map((v: { message?: string }) => v.message)
            .filter(Boolean)
            .join('; ');
        } else if (abpError.details && abpError.details !== abpError.message) {
          detail = abpError.details;
        }
      } else if (responseData?.error_description) {
        title = typeof abpError === 'string' ? abpError : '认证失败';
        detail = responseData.error_description;
      } else if (typeof abpError === 'string') {
        title = abpError;
      } else if (responseData?.message) {
        title = responseData.message;
      }

      message.error({
        content: renderErrorMessageNode(title, detail),
        duration: 4,
      });
    }),
  );

  return client;
}

// 业务 API 请求客户端 (基准前缀 /api)
export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'body',
});

// 基础 API 请求客户端
export const baseRequestClient = new RequestClient({ baseURL: apiURL });

// OpenIddict 认证服务器请求客户端 (基准前缀 /auth-server 或 /connect)
export const authRequestClient = createRequestClient(authURL, {
  responseReturn: 'body',
});

// 基础认证请求客户端
export const authBaseRequestClient = new RequestClient({ baseURL: authURL });
