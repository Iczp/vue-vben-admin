import { fileURLToPath } from 'node:url';

import { defineConfig, mergeConfig } from 'vitest/config';

import base from '../../vitest.config.ts';
export default mergeConfig(
  base,
  defineConfig({
    resolve: {
      alias: { '#': fileURLToPath(new URL('./src', import.meta.url)) },
    },
  }),
);
