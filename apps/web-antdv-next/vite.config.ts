import type { ProxyOptions } from 'vite';

import process from 'node:process';

import { defineConfig } from '@vben/vite-config';

import { loadEnv } from 'vite';

function serviceProxy(target: string, serviceName: string): ProxyOptions {
  return {
    changeOrigin: true,
    target,
    ws: true,
    configure(proxy) {
      // Compatibility with deployed APIs still using ABP's default readable cookie.
      proxy.on('proxyRes', (response, request) => {
        if (/^\/api\/chat\/scan-login(?:\/|$)/.test(request.url || '')) return;
        const cookies = response.headers['set-cookie'];
        if (cookies)
          response.headers['set-cookie'] = cookies.map((cookie) => {
            if (
              !cookie.startsWith('XSRF-TOKEN=') &&
              !cookie.startsWith(`${serviceName}.XSRF-TOKEN=`)
            )
              return cookie;
            return cookie
              .replace(/^XSRF-TOKEN=/, `${serviceName}.XSRF-TOKEN=`)
              .replaceAll(/;\s*samesite=none/gi, '; SameSite=Strict');
          });
      });
    },
  };
}

export default defineConfig(async (configEnv) => {
  const env = loadEnv(configEnv.mode || 'development', process.cwd());
  const apiTarget = env.VITE_API_BASE_URL || 'http://10.0.5.20:8044';
  const authTarget = env.VITE_AUTH_BASE_URL || 'http://10.0.5.20:8043';
  const chatTarget = env.VITE_CHAT_API_BASE_URL || apiTarget;
  const cmsTarget = env.VITE_CMS_API_BASE_URL || 'http://10.0.5.20:51611';
  const statisticTarget =
    env.VITE_APP_STATISTIC_API_BASE_URL || 'http://10.0.5.20:51621';
  const deviceTarget = env.VITE_APP_DEVICE_API_BASE_URL;

  return {
    application: {},
    vite: {
      server: {
        proxy: {
          ...(deviceTarget
            ? {
                '/api/app-device/abp/application-configuration': {
                  ...serviceProxy(deviceTarget, 'AppDevice'),
                  rewrite: (path: string) =>
                    path.replace('/api/app-device/abp/', '/api/abp/'),
                },
                '/api/app-device': serviceProxy(deviceTarget, 'AppDevice'),
              }
            : {}),
          '/api/chat/abp/application-configuration': {
            ...serviceProxy(chatTarget, 'Chat'),
            rewrite: (path) => path.replace('/api/chat/abp/', '/api/abp/'),
          },
          '/api/cms/abp/application-configuration': {
            ...serviceProxy(cmsTarget, 'Cms'),
            rewrite: (path) => path.replace('/api/cms/abp/', '/api/abp/'),
          },
          '/api/app-statistic/abp/application-configuration': {
            ...serviceProxy(statisticTarget, 'AppStatistic'),
            rewrite: (path) =>
              path.replace('/api/app-statistic/abp/', '/api/abp/'),
          },
          '/api/chat': serviceProxy(apiTarget, 'Chat'),
          '/api/cms': serviceProxy(cmsTarget, 'Cms'),
          '/api/app-statistic': serviceProxy(statisticTarget, 'AppStatistic'),
          '/api': serviceProxy(apiTarget, 'IM'),
          '/auth-server': {
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/auth-server/, ''),
            target: authTarget,
            ws: true,
          },
          '/connect': {
            changeOrigin: true,
            target: authTarget,
            ws: true,
          },
          '/signalr-hubs': {
            changeOrigin: true,
            target: apiTarget,
            ws: true,
          },
        },
      },
    },
  };
});
