/* eslint-disable vue/one-component-per-file -- Minimal rendering stubs for permission boundary tests. */
import type { App } from 'vue';

import { createApp, defineComponent, h, nextTick, reactive } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import RouteEntry from './route-entry.vue';

const calls = vi.hoisted(() => ({
  refresh: vi.fn(),
  replace: vi.fn(),
  resetAccess: vi.fn(),
  mounted: vi.fn(),
}));
let state: {
  appDeviceConfigurationLoaded: boolean;
  appDeviceConfigurationError: boolean;
  hasPermission: (policy: string) => boolean;
  policies: Record<string, boolean>;
  refreshAppDeviceConfiguration: () => Promise<void>;
};
vi.mock('#/store/abp', () => ({ useAbpStore: () => state }));
vi.mock('@vben/stores', () => ({
  useAccessStore: () => ({ setIsAccessChecked: calls.resetAccess }),
}));
vi.mock('vue-router', () => ({
  useRoute: () => ({ fullPath: '/app-device/devices' }),
  useRouter: () => ({ replace: calls.replace }),
}));
vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('main', slots.default?.()),
  }),
}));
vi.mock('antdv-next', () => ({
  Spin: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  }),
  Button: defineComponent({
    emits: ['click'],
    setup:
      (_, { slots, emit }) =>
      () =>
        h('button', { onClick: () => emit('click') }, slots.default?.()),
  }),
  Result: defineComponent({
    props: {
      title: { type: String, default: '' },
      subTitle: { type: String, default: '' },
    },
    setup:
      (props, { slots }) =>
      () =>
        h('section', [h('h1', props.title), props.subTitle, slots.extra?.()]),
  }),
}));
vi.mock('./devices/index.vue', () => ({
  default: defineComponent({
    setup: () => {
      calls.mounted();
      return () => h('div', '设备列表');
    },
  }),
}));
vi.mock('./groups/index.vue', () => ({
  default: defineComponent({ setup: () => () => h('div', '分组列表') }),
}));
let app: App | undefined;
let host: HTMLDivElement;
async function flush() {
  for (let i = 0; i < 10; i++) {
    await Promise.resolve();
    await nextTick();
  }
}
beforeEach(() => {
  vi.clearAllMocks();
  host = document.createElement('div');
  document.body.append(host);
  state = reactive({
    appDeviceConfigurationLoaded: true,
    appDeviceConfigurationError: false,
    policies: {} as Record<string, boolean>,
    hasPermission: (policy: string) => state.policies[policy] === true,
    refreshAppDeviceConfiguration: calls.refresh,
  });
});
afterEach(() => {
  app?.unmount();
  host.remove();
});
describe('known device page access', () => {
  it('shows a permission explanation instead of 404 and never mounts protected content', async () => {
    app = createApp(() =>
      h(RouteEntry, { permission: 'AppDevice.Devices.Read', view: 'devices' }),
    );
    app.mount(host);
    await flush();
    expect(host.textContent).toContain('没有访问权限');
    expect(host.textContent).toContain('AppDevice.Devices.Read');
    expect(calls.mounted).not.toHaveBeenCalled();
  });
  it('mounts the actual page when the service grants permission', async () => {
    state.policies = { 'AppDevice.Devices.Read': true };
    app = createApp(() =>
      h(RouteEntry, { permission: 'AppDevice.Devices.Read', view: 'devices' }),
    );
    app.mount(host);
    await flush();
    expect(host.textContent).toContain('设备列表');
    expect(calls.mounted).toHaveBeenCalledOnce();
  });
  it('retries service configuration and opens the page after a grant arrives', async () => {
    calls.refresh.mockImplementation(async () => {
      state.policies = { 'AppDevice.Devices.Read': true };
      state.appDeviceConfigurationLoaded = true;
    });
    app = createApp(() =>
      h(RouteEntry, { permission: 'AppDevice.Devices.Read', view: 'devices' }),
    );
    app.mount(host);
    await flush();
    host.querySelector('button')?.click();
    await flush();
    expect(calls.refresh).toHaveBeenCalledOnce();
    expect(calls.resetAccess).toHaveBeenCalledWith(false);
    expect(calls.replace).toHaveBeenCalledWith('/app-device/devices');
    expect(host.textContent).toContain('设备列表');
  });
});
