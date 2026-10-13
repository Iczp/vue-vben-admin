// @vitest-environment happy-dom
/* eslint-disable vue/one-component-per-file -- Minimal UI stubs for workflow tests. */
import type { App, PropType } from 'vue';

import { createApp, defineComponent, h, nextTick } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  accounts: vi.fn(),
  sessions: vi.fn(),
  findSession: vi.fn(),
  send: vi.fn(),
  history: vi.fn(),
  schedules: vi.fn(),
  createSchedule: vi.fn(),
  changeSchedule: vi.fn(),
  rollback: vi.fn(),
  cms: vi.fn(),
  cmsCategories: vi.fn(),
  cmsTags: vi.fn(),
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
  findArticleSenderSessionApi: api.findSession,
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
vi.mock('#/api/cms/categories', () => ({ getCategoriesApi: api.cmsCategories }));
vi.mock('#/api/cms/tags', () => ({ getTagsApi: api.cmsTags }));
vi.mock('#/api/cms', () => ({ ArticleStatus: { Draft: 0, PendingReview: 1, Approved: 2, Scheduled: 3, Published: 4, Offline: 5, Archived: 6 } }));
vi.mock('#/api/cms/types', () => ({
  ArticleStatus: { Published: 4 },
  AssetType: { Image: 1 },
}));
vi.mock('#/views/cms/components/MediaSelector.vue', () => ({
  default: defineComponent({
    props: {
      value: { type: String, default: '' },
      assetTypes: { type: Array as PropType<number[]>, default: () => [] },
      disabled: Boolean,
    },
    emits: ['update:value'],
    setup: (props, { emit }) => () => h('div', { 'data-testid': 'cover-selector' }, [
      h('input', { value: props.value, disabled: props.disabled }),
      h('button', {
        disabled: props.disabled,
        'data-asset-types': props.assetTypes.join(','),
        onClick: () => emit('update:value', '/api/cms/assets/cover/content'),
      }, '选择媒体'),
    ]),
  }),
}));
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
              emit('update:value', props.options.find((option) => String(option.value) === (event.target as HTMLSelectElement).value)?.value),
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
    Spin: block,
    Empty: block,
    Pagination: block,
    Tree: block,
    Checkbox: defineComponent({
      props: { checked: Boolean, disabled: Boolean },
      emits: ['change'],
      setup: (props, { attrs, emit }) => () => h('input', { ...attrs, type: 'checkbox', checked: props.checked, disabled: props.disabled, onChange: (event: Event) => emit('change', event) }),
    }),
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
            props.open ? h('aside', [slots.default?.(), slots.footer?.()]) : null,
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
function setField(label: string, value: string, scope: ParentNode = host) {
  const element = [...scope.querySelectorAll('label')]
    .find((node) => node.textContent?.startsWith(label))!
    .querySelector('input')!;
  element.value = value;
  element.dispatchEvent(new Event('input', { bubbles: true }));
}
async function ready(ownerId = '123') {
  host = document.createElement('div');
  document.body.append(host);
  app = createApp(ArticleMessagePage);
  app.mount(host);
  await vi.waitFor(() => expect(api.accounts).toHaveBeenCalled());
  await nextTick();
  const account = host.querySelectorAll('select')[1]!;
  account.value = ownerId;
  account.dispatchEvent(new Event('change'));
  await vi.waitFor(() => expect(api.findSession).toHaveBeenCalledWith(ownerId, ownerId));
  await nextTick();
  button('添加外部文章').click();
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
  api.findSession.mockResolvedValue('sender-unit');
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
  api.cmsCategories.mockResolvedValue({ items: [], totalCount: 0 });
  api.cmsTags.mockResolvedValue({ items: [], totalCount: 0 });
});
afterEach(() => {
  app?.unmount();
  host?.remove();
  vi.unstubAllGlobals();
});

describe('article message management workflow', () => {
  it('sends bounded client IDs and schedules UUIDs on HTTP pages without crypto.randomUUID', async () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) });
    await ready();
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledOnce());
    const uuid = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;
    const clientId = api.send.mock.calls[0]?.[1].clientMessageId;
    expect(clientId).toHaveLength(26);
    expect(clientId).toMatch(/^art:[\w-]{22}$/);
    await vi.waitFor(() => expect(button('立即发送').disabled).toBe(false));
    setField('计划时间', new Date(Date.now() + 86_400_000).toISOString().slice(0, 16));
    await nextTick();
    button('定时发送').click();
    await vi.waitFor(() => expect(api.createSchedule).toHaveBeenCalledOnce());
    const scheduled = api.createSchedule.mock.calls[0]?.[0];
    expect(scheduled.id).toMatch(uuid);
    expect(scheduled.message.clientMessageId).toHaveLength(26);
    expect(scheduled.message.clientMessageId).toMatch(/^art:[\w-]{22}$/);
    expect(scheduled.message.clientMessageId).not.toBe(clientId);
  });
  it('shows the actual 400 response details and keeps the same client ID on retry', async () => {
    api.send.mockRejectedValueOnce({ error: {
      message: '文章发送失败',
      details: '当前账号不允许发言',
      validationErrors: [{ message: '封面地址无效', members: ['Content.Items[0].CoverImageUrl'] }],
    } });
    await ready();
    button('立即发送').click();
    await vi.waitFor(() => expect(host.textContent).toContain('文章发送失败'));
    expect(host.textContent).toContain('当前账号不允许发言');
    expect(host.textContent).toContain('Content.Items[0].CoverImageUrl: 封面地址无效');
    expect(api.history).not.toHaveBeenCalled();
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledTimes(2));
    expect(api.send.mock.calls[1]?.[1].clientMessageId).toBe(api.send.mock.calls[0]?.[1].clientMessageId);
  });
  it('finds the public account session using the same owner and destination, without paging sessions', async () => {
    api.accounts.mockResolvedValue({ items: [{ id: 5874, name: '日春官方号', isEnabled: true }], totalCount: 1 });
    await ready('5874');
    expect(api.findSession).toHaveBeenCalledWith('5874', '5874');
    expect(api.sessions).not.toHaveBeenCalled();
    expect(button('搜索会话')).toBeUndefined();
    expect(button('重新查询会话')).toBeUndefined();
    expect(host.querySelectorAll('select')).toHaveLength(2);
    expect(host.textContent).toContain('已自动选定会话，可直接发送。');
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledWith('sender-unit', expect.anything()));
  });
  it('keeps sending disabled when the public account session lookup fails', async () => {
    api.findSession.mockRejectedValueOnce(new Error('session not found'));
    await ready();
    await vi.waitFor(() => expect(host.textContent).toContain('session not found'));
    expect(button('立即发送').disabled).toBe(true);
    expect(api.sessions).not.toHaveBeenCalled();
    expect(api.send).not.toHaveBeenCalled();
  });
  it('lets service accounts choose their actual target session instead of using the public self session', async () => {
    api.sessions.mockResolvedValue({ items: [{ id: 'target-unit', destination: { id: 456, name: '目标用户' } }], totalCount: 1 });
    await ready();
    await vi.waitFor(() => expect(button('立即发送').disabled).toBe(false));
    const type = host.querySelectorAll('select')[0]!;
    type.value = '3';
    type.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(api.accounts).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(host.querySelectorAll('select')[1]!.disabled).toBe(false));
    const account = host.querySelectorAll('select')[1]!;
    account.value = '123';
    account.dispatchEvent(new Event('change'));
    await vi.waitFor(() => expect(api.sessions).toHaveBeenCalledWith('123', 0, ''));
    await nextTick();
    const target = host.querySelectorAll('select')[2]!;
    target.value = 'target-unit';
    target.dispatchEvent(new Event('change'));
    await nextTick();
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledWith('target-unit', expect.anything()));
    expect(api.findSession).toHaveBeenCalledOnce();
  });
  it('dynamically adds, reorders and removes articles while keeping each CMS cover attached to its article', async () => {
    await ready();
    button('添加外部文章').click();
    await nextTick();
    let editors = host.querySelectorAll('[data-testid="article-editor"]');
    expect(editors).toHaveLength(2);
    setField('标题', '第二篇', editors[1]!);
    setField('阅读地址', 'https://example.com/second', editors[1]!);
    const coverButton = editors[1]!.querySelector('[data-testid="cover-selector"] button') as HTMLButtonElement;
    expect(coverButton.dataset.assetTypes).toBe('1');
    coverButton.click();
    await nextTick();
    const expectedCover = new URL('/api/cms/assets/cover/content', window.location.origin).href;
    expect((editors[1]!.querySelector('[data-testid="cover-selector"] input') as HTMLInputElement).value).toBe(expectedCover);
    const moveUp = [...editors[1]!.querySelectorAll('button')].find((node) => node.textContent?.trim() === '上移')!;
    moveUp.click();
    await nextTick();
    editors = host.querySelectorAll('[data-testid="article-editor"]');
    expect((editors[0]!.querySelector('label input') as HTMLInputElement).value).toBe('第二篇');
    button('立即发送').click();
    await vi.waitFor(() => expect(api.send).toHaveBeenCalledOnce());
    expect(api.send.mock.calls[0]?.[1].content.items.map((item: { title: string }) => item.title)).toEqual(['第二篇', '文章标题']);
    expect(api.send.mock.calls[0]?.[1].content.items[0].coverImageUrl).toBe(expectedCover);
    await vi.waitFor(() => expect(button('立即发送').disabled).toBe(false));
    [...editors[1]!.querySelectorAll('button')].find((node) => node.textContent?.trim() === '移除')!.click();
    await nextTick();
    expect(host.querySelectorAll('[data-testid="article-editor"]')).toHaveLength(1);
  });
  it('selects published CMS articles and resolves relative reading and cover URLs', async () => {
    api.cms.mockResolvedValue({
      items: [{ id: 'cms-article', title: 'CMS 文章', summary: '已发布摘要', status: 4, isVisible: true, coverUrl: '/covers/article.png',
        categories: [{ id: 'news', name: '新闻栏目' }], mainCategoryId: 'news', tags: [{ id: 'feature', name: '专题标签' }], publishTime: '2026-10-12T08:00:00Z' }],
      totalCount: 1,
    });
    api.cmsUrl.mockReturnValue('/articles/cms-article');
    await ready();
    button('从 CMS 选择').click();
    await vi.waitFor(() => expect(host.querySelector('[data-testid="cms-article-row"]')).not.toBeNull());
    const row = host.querySelector('[data-testid="cms-article-row"]')!;
    expect(row.querySelector('img')?.getAttribute('src')).toBe(new URL('/covers/article.png', window.location.origin).href);
    expect(row.textContent).toContain('新闻栏目 · 主栏目');
    expect(row.textContent).toContain('专题标签');
    expect(row.textContent).toContain('2026-10-12');
    expect(row.querySelector('a')?.getAttribute('href')).toBe('/articles/cms-article');
    expect(row.querySelector('a')?.getAttribute('rel')).toBe('noopener noreferrer');
    (row.querySelector('input[type="checkbox"]') as HTMLInputElement).click();
    await nextTick();
    expect(host.querySelectorAll('[data-testid="article-editor"]')).toHaveLength(1);
    button('确定选择（1）').click();
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
  it('shows placeholders for absent CMS metadata and failed cover images', async () => {
    api.cms.mockResolvedValue({
      items: [
        { id: 'broken-cover', title: '封面加载失败', status: 4, isVisible: true, coverUrl: '/covers/missing.png' },
        { id: 'no-cover', title: '未设置封面', status: 4, isVisible: true },
      ],
      totalCount: 2,
    });
    await ready();
    button('从 CMS 选择').click();
    await vi.waitFor(() => expect(host.querySelectorAll('[data-testid="cms-article-row"]')).toHaveLength(2));
    const rows = host.querySelectorAll('[data-testid="cms-article-row"]');
    expect(rows[1]!.querySelector('img')).toBeNull();
    expect(rows[1]!.textContent).toContain('暂无封面');
    expect(rows[1]!.textContent).toContain('未设置栏目');
    expect(rows[1]!.textContent).toContain('暂无标签');
    rows[0]!.querySelector('img')!.dispatchEvent(new Event('error'));
    await nextTick();
    expect(rows[0]!.querySelector('img')).toBeNull();
    expect(rows[0]!.textContent).toContain('暂无封面');
  });
  it('confirms multiple CMS articles together and limits selection to the group remaining capacity', async () => {
    api.cms.mockResolvedValue({ items: Array.from({ length: 8 }, (_, index) => ({ id: `cms-${index}`, title: `CMS ${index + 1}`, status: 4, isVisible: true })), totalCount: 8 });
    await ready();
    button('从 CMS 选择').click();
    await vi.waitFor(() => expect(host.querySelectorAll('[data-testid="cms-article-row"]')).toHaveLength(8));
    const checkboxes = [...host.querySelectorAll('[data-testid="cms-article-row"] input[type="checkbox"]')] as HTMLInputElement[];
    for (const checkbox of checkboxes.slice(0, 7)) { checkbox.click(); await nextTick(); }
    expect(checkboxes[7]!.disabled).toBe(true);
    expect(host.querySelectorAll('[data-testid="article-editor"]')).toHaveLength(1);
    button('确定选择（7）').click(); await nextTick();
    expect(host.querySelectorAll('[data-testid="article-editor"]')).toHaveLength(8);
    expect(button('从 CMS 选择').disabled).toBe(true);
    button('立即发送').click(); await vi.waitFor(() => expect(api.send).toHaveBeenCalledOnce());
    expect(api.send.mock.calls[0]?.[1].content.items.map((item: { title: string }) => item.title)).toEqual(['文章标题', ...Array.from({ length: 7 }, (_, index) => `CMS ${index + 1}`)]);
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
