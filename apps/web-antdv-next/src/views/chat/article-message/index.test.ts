// @vitest-environment happy-dom
/* eslint-disable vue/one-component-per-file -- Minimal UI stubs for workflow tests. */
import type { App, PropType } from 'vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  accounts: vi.fn(),
  sessions: vi.fn(),
  send: vi.fn(),
  history: vi.fn(),
  schedules: vi.fn(),
  createSchedule: vi.fn(),
  changeSchedule: vi.fn(),
  rollback: vi.fn(),
  cms: vi.fn(),
  cmsUrl: vi.fn(),
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
vi.mock('#/api/chat/chat-object', () => ({
  ChatObjectTypeEnums: { Official: 3, Subscription: 4 },
  getChatObjectsApi: api.accounts,
}));
vi.mock('#/api/chat/article-message', () => ({
  articleManagementPermission:
    'ChatPermissions.MessageSenderPermission.ManageArticle',
  getArticleSenderSessionsApi: api.sessions,
  sendArticleMessageApi: api.send,
  getArticleChatHistoryApi: api.history,
  getArticleSchedulesApi: api.schedules,
  createArticleScheduleApi: api.createSchedule,
  changeArticleScheduleApi: api.changeSchedule,
  rollbackArticleMessageApi: api.rollback,
}));
vi.mock('#/api/cms/articles', () => ({
  getArticlesApi: api.cms,
  getArticleWebUrl: api.cmsUrl,
}));
vi.mock('#/api/cms/types', () => ({ ArticleStatus: { Published: 4 } }));
vi.mock('antdv-next', () => {
  const block = defineComponent({
    setup:
      (_, { slots }) =>
      () =>
        h('div', slots.default?.()),
  });
  const input = (tag: string) =>
    defineComponent({
      props: { value: { type: String, default: '' } },
      emits: ['update:value'],
      setup:
        (props, { attrs, emit }) =>
        () =>
          h(tag, {
            ...attrs,
            value: props.value,
            onInput: (event: Event) =>
              emit('update:value', (event.target as HTMLInputElement).value),
          }),
    });
  const select = defineComponent({
    props: {
      value: { type: [String, Number], default: undefined },
      options: {
        type: Array as PropType<{ label: string; value: number | string }[]>,
        default: () => [],
      },
    },
    emits: ['update:value'],
    setup:
      (props, { attrs, emit }) =>
      () =>
        h(
          'select',
          {
            ...attrs,
            value: props.value,
            onChange: (event: Event) =>
              emit('update:value', (event.target as HTMLSelectElement).value),
          },
          props.options.map((option) =>
            h('option', { value: option.value }, option.label),
          ),
        ),
  });
  return {
    Alert: defineComponent({
      props: { message: { type: String, default: '' } },
      setup: (props) => () => h('div', props.message),
    }),
    Card: block,
    Tag: block,
    Tabs: Object.assign(block, { TabPane: block }),
    Input: Object.assign(input('input'), { TextArea: input('textarea') }),
    Select: select,
    Button: defineComponent({
      setup:
        (_, { attrs, slots }) =>
        () =>
          h('button', attrs, slots.default?.()),
    }),
    Modal: Object.assign(
      defineComponent({
        props: { open: Boolean },
        setup:
          (props, { slots }) =>
          () =>
            props.open ? h('aside', slots.default?.()) : null,
      }),
      { confirm: ({ onOk }: { onOk: () => Promise<void> }) => onOk() },
    ),
    message: { success: vi.fn(), warning: vi.fn() },
  };
});
import ArticleMessagePage from './index.vue';

let app: App | undefined;
let host: HTMLDivElement;
function button(text: string) {
  return [...host.querySelectorAll('button')].find(
    (node) => node.textContent?.trim() === text,
  )!;
}
function setField(label: string, value: string) {
  const element = [...host.querySelectorAll('label')]
    .find((node) => node.textContent?.startsWith(label))!
    .querySelector('input')!;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
async function ready() {
  host = document.createElement('div');
  document.body.append(host);
  app = createApp(ArticleMessagePage);
  app.mount(host);
  await vi.waitFor(() => expect(api.accounts).toHaveBeenCalled());
  await nextTick();
  const account = host.querySelectorAll('select')[1]!;
  account.value = '123';
  account.dispatchEvent(new Event('change'));
  await vi.waitFor(() => expect(api.sessions).toHaveBeenCalled());
  await nextTick();
  setField('标题', '文章标题');
  setField('阅读地址', 'https://example.com/article');
  await nextTick();
}
beforeEach(() => {
  vi.clearAllMocks();
  api.accounts.mockResolvedValue({
    items: [{ id: 123, name: '公众号', isEnabled: true }],
    totalCount: 1,
  });
  api.sessions.mockResolvedValue({
    items: [{ id: 'sender-unit', destination: { id: 123, name: '公众号' } }],
    totalCount: 1,
  });
  api.history.mockResolvedValue({
    items: [],
    totalCount: 0,
    extra: { hasMore: false },
  });
  api.schedules.mockResolvedValue({ items: [], totalCount: 0 });
  api.send.mockResolvedValue({ id: '1234567890123456789' });
  api.createSchedule.mockResolvedValue({ id: 'task' });
  api.cmsUrl.mockReturnValue('https://example.com/cms');
  api.rollback.mockResolvedValue({});
});
afterEach(() => {
  app?.unmount();
  host?.remove();
});

describe('article message management workflow', () => {
  it('selects published CMS articles and resolves relative reading and cover URLs', async () => {
    api.cms.mockResolvedValue({
      items: [{ id: 'cms-article', title: 'CMS 文章', summary: '已发布摘要', status: 4, isVisible: true, coverUrl: '/covers/article.png' }],
      totalCount: 1,
    });
    api.cmsUrl.mockReturnValue('/articles/cms-article');
    await ready();
    button('从 CMS 选择').click();
    await vi.waitFor(() => expect(button('选择')).toBeDefined());
    button('选择').click();
    await nextTick();
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledOnce());
    expect(api.cms.mock.calls[0]?.[0]).toMatchObject({ status: 4, isVisible: true, maxResultCount: 20 });
    expect(api.send.mock.calls[0]?.[1].content.items[1]).toMatchObject({
      title: 'CMS 文章',
      description: '已发布摘要',
      originalUrl: new URL('/articles/cms-article', window.location.origin).href,
      coverImageUrl: new URL('/covers/article.png', window.location.origin).href,
    });
  });
  it('loads older history by its exact cursor and recalls the exact message id', async () => {
    const messageId = '1234567890123456789';
    const cursor = '1234567890123456788';
    api.history.mockResolvedValueOnce({
      items: [{ id: messageId, senderId: '123', messageType: 11, content: { items: [{ title: '历史文章', originalUrl: 'https://example.com/history' }] } }],
      extra: { hasMore: true, nextCursorId: cursor },
    });
    await ready();
    button('刷新历史').click();
    await vi.waitFor(() => expect(button('加载更早消息')).toBeDefined());
    button('加载更早消息').click();
    await vi.waitFor(() => expect(api.history).toHaveBeenCalledWith('sender-unit', cursor));
    await vi.waitFor(() => expect(button('加载更早消息')).toBeUndefined());
    button('撤回').click();
    await vi.waitFor(() => expect(api.rollback).toHaveBeenCalledWith(messageId));
  });
  it('failed submit retries use the same client id and the selected sender session', async () => {
    api.send.mockRejectedValueOnce(new Error('network failure'));
    await ready();
    button('立即发送').click();
    await vi.waitFor(() =>
      expect(host.textContent).toContain('network failure'),
    );
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledTimes(2));
    expect(api.send.mock.calls[0]?.[0]).toBe('sender-unit');
    expect(api.send.mock.calls[0]?.[1].clientMessageId).toBe(
      api.send.mock.calls[1]?.[1].clientMessageId,
    );
    await vi.waitFor(() =>
      expect(api.history).toHaveBeenCalledWith('sender-unit', undefined),
    );
  });
  it('scheduled submission saves a UTC time and the article snapshot', async () => {
    await ready();
    const planned = new Date(Date.now() + 86_400_000);
    setField('计划时间', planned.toISOString().slice(0, 16));
    await nextTick();
    button('定时发送').click();
    await vi.waitFor(() => expect(api.createSchedule).toHaveBeenCalledOnce());
    const input = api.createSchedule.mock.calls[0]?.[0];
    expect(input.senderSessionUnitId).toBe('sender-unit');
    expect(input.scheduledAt.endsWith('Z')).toBe(true);
    expect(input.message.content.items[0].title).toBe('文章标题');
    await vi.waitFor(() => expect(api.schedules).toHaveBeenCalled());
  });
});
