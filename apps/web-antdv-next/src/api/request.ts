/**
 * ABP vNext 请求客户端与全局拦截器配置
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
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

import { refreshTokenApi } from './core';

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
      let errorMsg = '';

      if (typeof abpError === 'object' && abpError !== null) {
        if (abpError.message) {
          errorMsg = abpError.message;
        }
        if (abpError.details && abpError.details !== abpError.message) {
          errorMsg += `\n${abpError.details}`;
        }
        if (
          Array.isArray(abpError.validationErrors) &&
          abpError.validationErrors.length > 0
        ) {
          const valMsgs = abpError.validationErrors
            .map((v: { message?: string }) => v.message)
            .filter(Boolean)
            .join('; ');
          if (valMsgs) {
            errorMsg += ` (${valMsgs})`;
          }
        }
      } else if (typeof abpError === 'string') {
        errorMsg = abpError;
      } else if (responseData?.message) {
        errorMsg = responseData.message;
      }

      message.error(errorMsg || msg);
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
