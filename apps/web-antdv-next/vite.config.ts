import { defineConfig } from '@vben/vite-config';
import { loadEnv } from 'vite';

export default defineConfig(async (configEnv) => {
  const env = loadEnv(configEnv.mode || 'development', process.cwd());
  const apiTarget = env.VITE_API_BASE_URL || 'http://10.0.5.20:8044';
  const authTarget = env.VITE_AUTH_BASE_URL || 'http://10.0.5.20:8043';

  return {
    application: {},
    vite: {
      server: {
        proxy: {
          '/api': {
            changeOrigin: true,
            target: apiTarget,
            ws: true,
          },
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
