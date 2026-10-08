/* eslint-disable vue/one-component-per-file -- Minimal UI stubs for selector interaction tests. */
import type { App } from 'vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, describe, expect, it, vi } from 'vitest';
const api = vi.hoisted(() => ({
  getAssets: vi.fn(),
  getAsset: vi.fn(),
  upload: vi.fn(),
  warning: vi.fn(),
}));
vi.mock('#/api/cms', () => ({
  AssetType: { Image: 1, Video: 2, Audio: 3, File: 4 },
  AssetStatus: { Normal: 1 },
  getAssetsApi: api.getAssets,
  getAssetApi: api.getAsset,
  uploadAssetApi: api.upload,
}));
vi.mock('antdv-next', () => {
  const block = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });
  const button = defineComponent({
    setup:
      (_, { attrs, slots }) =>
      () =>
        h('button', attrs, slots.default?.()),
  });
  const modal = defineComponent({
    props: { open: Boolean },
    emits: ['ok', 'update:open'],
    setup:
      (props, { slots, emit }) =>
      () =>
        props.open
          ? h('section', [
              slots.default?.(),
              h(
                'button',
                { 'data-confirm': '', onClick: () => emit('ok') },
                '确认',
              ),
              h(
                'button',
                {
                  'data-cancel': '',
                  onClick: () => emit('update:open', false),
                },
                '取消',
              ),
            ])
          : null,
  });
  const pagination = defineComponent({
    emits: ['change', 'update:current'],
    setup:
      (_, { emit }) =>
      () =>
        h(
          'button',
          {
            'data-page': '',
            onClick: () => {
              emit('update:current', 2);
              emit('change', 2);
            },
          },
          '下一页',
        ),
  });
  return {
    Button: button,
    Empty: block,
    Input: block,
    InputSearch: block,
    Modal: modal,
    Pagination: pagination,
    Select: block,
    Spin: block,
    Tabs: Object.assign(block, { TabPane: block }),
    UploadDragger: block,
    Image: defineComponent({
      props: { src: { type: String, default: '' } },
      setup: (props) => () => h('img', { src: props.src }),
    }),
    message: { warning: api.warning, success: vi.fn(), error: vi.fn() },
  };
});
import MediaSelector from './MediaSelector.vue';
const assets = [
  {
    id: 'one',
    url: '/one',
    type: 1,
    fileName: 'image.png',
    fileSize: 100,
    width: 640,
    height: 480,
    mimeType: 'image/png',
    variants: [],
  },
  {
    id: 'two',
    url: '/two',
    type: 2,
    fileName: 'video.mp4',
    fileSize: 1024,
    width: 1920,
    height: 1080,
    duration: 65,
    mimeType: 'video/mp4',
    variants: [],
  },
  {
    id: 'three',
    url: '/three',
    type: 3,
    fileName: 'audio.mp3',
    fileSize: 1024,
    duration: 10,
    mimeType: 'audio/mpeg',
    variants: [],
  },
];
let app: App | undefined;
let host: HTMLDivElement;
async function flush() {
  await new Promise((resolve) => setTimeout(resolve, 0));
  await nextTick();
}
function click(selector: string) {
  (host.querySelector(selector) as HTMLButtonElement).click();
}
async function mount(props: Record<string, unknown> = {}) {
  api.getAssets.mockReset();
  api.warning.mockClear();
  api.getAssets.mockImplementation(async (input: { skipCount: number }) => ({
    items: input.skipCount ? assets.slice(1) : assets.slice(0, 1),
    totalCount: 30,
  }));
  host = document.createElement('div');
  document.body.append(host);
  app = createApp(MediaSelector, props);
  app.mount(host);
  const button = [...host.querySelectorAll('button')].find(
    (item) => item.textContent === '选择媒体',
  );
  button?.click();
  await flush();
}
afterEach(() => {
  app?.unmount();
  host?.remove();
});
describe('media selector interaction', () => {
  it('preserves cross-page choices, enforces maximum, and returns DTOs on confirmation', async () => {
    const values = vi.fn();
    const selected = vi.fn();
    await mount({
      multiple: true,
      maxCount: 2,
      'onUpdate:values': values,
      onSelect: selected,
    });
    click('button[aria-pressed]');
    await flush();
    click('[data-page]');
    await flush();
    const choices = host.querySelectorAll<HTMLButtonElement>(
      'button[aria-pressed]',
    );
    choices[0]?.click();
    await flush();
    choices[1]?.click();
    await flush();
    expect(api.warning).toHaveBeenCalledWith('最多选择 2 个素材');
    click('[data-confirm]');
    await flush();
    expect(values).toHaveBeenCalledWith(['/one', '/two']);
    expect(selected).toHaveBeenCalledWith([assets[0], assets[1]]);
  });
  it('does not commit cancelled choices and starts a new draft when reopened', async () => {
    const changed = vi.fn();
    await mount({ 'onUpdate:value': changed });
    click('button[aria-pressed]');
    await flush();
    click('[data-cancel]');
    await flush();
    expect(changed).not.toHaveBeenCalled();
    [...host.querySelectorAll('button')]
      .find((item) => item.textContent === '选择媒体')
      ?.click();
    await flush();
    expect(
      host.querySelector('button[aria-pressed]')?.getAttribute('aria-pressed'),
    ).toBe('false');
  });
  it('shows video playback and dimensions in the reusable preview', async () => {
    await mount();
    click('[data-page]');
    await flush();
    [...host.querySelectorAll('button')]
      .find((item) => item.textContent?.includes('详细信息'))
      ?.click();
    await flush();
    expect(host.querySelector('video')?.getAttribute('src')).toBe('/two');
    expect(host.textContent).toContain('1920 × 1080 px');
    expect(host.textContent).toContain('01:05');
  });
});
