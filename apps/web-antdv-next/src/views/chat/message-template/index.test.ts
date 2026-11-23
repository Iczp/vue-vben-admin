// @vitest-environment happy-dom
/* eslint-disable vue/one-component-per-file -- Workflow tests use small UI controls. */
import { createApp, defineComponent, h, nextTick } from 'vue';

import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  list: vi.fn(),
  detail: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
  preview: vi.fn(),
  accounts: vi.fn(),
}));
vi.mock('@vben/access', () => ({
  useAccess: () => ({ hasAccessByCodes: () => true }),
}));
vi.mock('@vben/common-ui', () => ({
  Page: defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('main', slots.default?.()),
  }),
}));
vi.mock('#/api/chat/chat-object', () => ({ getChatObjectsApi: api.accounts }));
vi.mock('#/api/chat/article-message', () => ({
  getArticleSenderSessionsApi: vi.fn(),
}));
vi.mock('#/api/chat/message-template', () => ({
  templatePermission: 'ChatPermissions.MessageTemplatePermission',
  getMessageTemplateListApi: api.list,
  getMessageTemplateApi: api.detail,
  getTemplateSenderAccountsApi: api.accounts,
  updateMessageTemplateApi: api.update,
  publishMessageTemplateApi: api.publish,
  previewMessageTemplateApi: api.preview,
  createMessageTemplateApi: vi.fn(),
  getMessageTemplateRevisionApi: vi.fn(),
  getMessageTemplateRevisionsApi: vi.fn(),
  sendTemplateContentMessageApi: vi.fn(),
  setMessageTemplateEnabledApi: vi.fn(),
}));
vi.mock('#/utils/request-error', () => ({
  getRequestErrorMessage: (err: Error) => ({ message: err.message }),
}));
vi.mock('./template-preview.vue', () => ({
  default: defineComponent({ setup: () => () => h('aside', '预览') }),
}));
vi.mock('antdv-next', () => {
  const Container = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });
  const Input = defineComponent({
    props: ['value'],
    emits: ['update:value'],
    setup:
      (props, { emit }) =>
      () =>
        h('input', {
          value: props.value,
          onInput: (e: Event) =>
            emit('update:value', (e.target as HTMLInputElement).value),
        }),
  });
  const Overlay = defineComponent({
    props: ['open'],
    setup:
      (props, { slots }) =>
      () =>
        props.open
          ? h('section', { 'data-editor': 'open' }, slots.default?.())
          : null,
  });
  return {
    Button: defineComponent({
      props: ['disabled'],
      setup:
        (props, { slots }) =>
        () =>
          h('button', { disabled: props.disabled }, slots.default?.()),
    }),
    Card: Container,
    Space: Container,
    Tag: Container,
    Alert: defineComponent({
      props: ['message'],
      setup: (props) => () => h('p', { role: 'alert' }, props.message),
    }),
    Input: Object.assign(Input, { TextArea: Input }),
    Drawer: Overlay,
    Modal: Overlay,
    Select: defineComponent({
      props: ['options', 'value'],
      setup: () => () => h('select'),
    }),
    Table: defineComponent({
      props: ['dataSource'],
      setup:
        (props, { slots }) =>
        () =>
          h(
            'div',
            (props.dataSource || []).map((record: object) =>
              slots.bodyCell?.({ column: { key: 'action' }, record }),
            ),
          ),
    }),
  };
});
import Page from './index.vue';
import { newDefinition } from './template-draft';

async function flush() {
  for (let i = 0; i < 12; i++) {
    await Promise.resolve();
    await nextTick();
  }
}
describe('模板管理真实页面工作流', () => {
  const record = {
    id: 'template',
    name: '通知',
    ownerId: '9007199254740993',
    visibility: 0,
    isEnabled: true,
    publishedVersion: 1,
    concurrencyStamp: 'original',
  };
  beforeEach(() => {
    vi.resetAllMocks();
    api.list.mockResolvedValue({ items: [record], totalCount: 1 });
    api.accounts.mockResolvedValue({ items: [], totalCount: 0 });
    api.detail.mockResolvedValue({ ...record, draftJson: newDefinition() });
    api.preview.mockResolvedValue({ isValid: true });
    api.publish.mockResolvedValue({ version: 2 });
  });
  async function mount() {
    const host = document.createElement('div');
    const app = createApp(Page);
    app.mount(host);
    await flush();
    return {
      host,
      app,
      click: async (text: string) => {
        const button = [...host.querySelectorAll('button')].find(
          (b) => b.textContent?.trim() === text,
        );
        expect(button, text).toBeDefined();
        button!.click();
        await flush();
      },
    };
  }
  it('分页项无draftJson时先取详情，更新携带服务端戳，409保留本地草稿', async () => {
    const { host, app, click } = await mount();
    try {
      await click('编辑');
      expect(api.detail).toHaveBeenCalledWith('template');
      api.update.mockRejectedValue(new Error('409 并发冲突'));
      await click('保存草稿');
      expect(api.update).toHaveBeenCalledWith(
        'template',
        expect.objectContaining({
          concurrencyStamp: 'original',
          definition: expect.any(String),
          name: '通知',
        }),
      );
      expect(host.querySelector('[data-editor="open"]')).not.toBeNull();
      expect(host.textContent).toContain('409 并发冲突');
    } finally {
      app.unmount();
    }
  });
  it('发布前调用正式preview且携带列表版本戳', async () => {
    const { app, click } = await mount();
    try {
      await click('发布');
      expect(api.preview).toHaveBeenCalledWith(
        expect.objectContaining({
          templateId: 'template',
          data: { title: '示例' },
        }),
      );
      expect(api.publish).toHaveBeenCalledWith('template', {
        concurrencyStamp: 'original',
      });
    } finally {
      app.unmount();
    }
  });
});
