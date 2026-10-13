// @vitest-environment happy-dom
/* eslint-disable vue/one-component-per-file -- UI stubs exercise the reusable selector's state and requests. */
import type { App, PropType } from 'vue';

import type { AdminArticleListItemDto } from '#/api/cms/types';

import { createApp, defineComponent, h, nextTick, reactive } from 'vue';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ articles: vi.fn(), categories: vi.fn(), tags: vi.fn() }));
vi.mock('#/api/cms/articles', () => ({ getArticlesApi: api.articles, getArticleWebUrl: (row: { id: string }) => `/articles/${row.id}` }));
vi.mock('#/api/cms/categories', () => ({ getCategoriesApi: api.categories }));
vi.mock('#/api/cms/tags', () => ({ getTagsApi: api.tags }));
vi.mock('#/views/cms/articles/data', () => ({ articleStatusOptions: [{ label: '草稿', value: 0 }, { label: '已发布', value: 4 }], contentTypeOptions: [{ label: '图文', value: 'Article' }] }));
vi.mock('antdv-next', () => {
  const block = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) });
  const input = defineComponent({
    props: { value: { type: String, default: '' } }, emits: ['update:value'],
    setup: (props, { attrs, emit }) => () => h('input', { ...attrs, value: props.value, onInput: (event: Event) => emit('update:value', (event.target as HTMLInputElement).value) }),
  });
  interface Node { key: string; title: string; children?: Node[] }
  return {
    Spin: block, Empty: block, Tag: block, Input: input,
    Alert: defineComponent({ props: { message: { type: String, default: '' } }, setup: props => () => h('div', props.message) }),
    Button: defineComponent({ setup: (_, { attrs, slots }) => () => h('button', attrs, slots.default?.()) }),
    Checkbox: defineComponent({ props: { checked: Boolean, disabled: Boolean }, emits: ['change', 'update:checked'], setup: (props, { attrs, emit }) => () => h('input', { ...attrs, type: 'checkbox', checked: props.checked, disabled: props.disabled, onChange: (event: Event) => { emit('update:checked', (event.target as HTMLInputElement).checked); emit('change', event); } }) }),
    Modal: defineComponent({ props: { open: Boolean }, setup: (props, { slots }) => () => props.open ? h('section', { role: 'dialog' }, [slots.default?.(), h('footer', slots.footer?.())]) : null }),
    Select: defineComponent({
      props: { value: { type: [String, Number, Boolean], default: undefined }, options: { type: Array as PropType<{ label: string; value: boolean | number | string }[]>, default: () => [] } }, emits: ['update:value'],
      setup: (props, { attrs, emit }) => () => h('select', { ...attrs, value: String(props.value ?? ''), onChange: (event: Event) => emit('update:value', props.options.find(option => String(option.value) === (event.target as HTMLSelectElement).value)?.value) }, [h('option', { value: '' }, '全部'), ...props.options.map(option => h('option', { value: String(option.value) }, option.label))]),
    }),
    Tree: defineComponent({
      props: { treeData: { type: Array as PropType<Node[]>, default: () => [] } }, emits: ['select'],
      setup: (props, { emit }) => {
        const render = (nodes: Node[]): ReturnType<typeof h>[] => nodes.flatMap(node => [h('button', { onClick: () => emit('select', [node.key]) }, node.title), ...render(node.children ?? [])]);
        return () => h('nav', render(props.treeData));
      },
    }),
    Pagination: defineComponent({
      props: { current: { type: Number, default: 1 }, pageSize: { type: Number, default: 20 }, total: { type: Number, default: 0 }, disabled: Boolean }, emits: ['change'],
      setup: (props, { emit }) => () => h('div', [
        h('button', { disabled: props.disabled || props.current <= 1, onClick: () => emit('change', props.current - 1, props.pageSize) }, '上一页'),
        h('button', { disabled: props.disabled || props.current * props.pageSize >= props.total, onClick: () => emit('change', props.current + 1, props.pageSize) }, '下一页'),
        h('button', { onClick: () => emit('change', 1, 50) }, '每页50篇'),
      ]),
    }),
  };
});
import ArticleSelector from './ArticleSelector.vue';

let app: App;
let host: HTMLDivElement;
const confirmed = vi.fn();
const updated = vi.fn();
function article(id: string, fields: Partial<AdminArticleListItemDto> = {}): AdminArticleListItemDto {
  return { id, title: id, code: id, status: 4, isVisible: true, creationTime: '2026-10-13T00:00:00Z', viewCount: 0, actualViewCount: 0, likeCount: 0, commentCount: 0, favoriteCount: 0, shareCount: 0, sorting: 0, isTop: false, isRecommend: false, allowComment: true, ...fields };
}
const a = article('文章A');
const b = article('文章B');
const c = article('文章C');
const d = article('文章D');
const button = (label: string) => [...host.querySelectorAll('button')].find(node => node.textContent === label)!;
const checkbox = (title: string) => host.querySelector(`input[aria-label="选择文章：${title}"]`) as HTMLInputElement;
function setFilter(label: string, value: string) {
  const node = host.querySelector(`[aria-label="${label}"]`) as HTMLInputElement | HTMLSelectElement;
  node.value = value;
  node.dispatchEvent(new Event(node.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
async function mount(props: Partial<InstanceType<typeof ArticleSelector>['$props']> = {}) {
  host = document.createElement('div'); document.body.append(host);
  const state = reactive({ open: true, multiple: false, maxCount: 20, ...props });
  app = createApp({ render: () => h(ArticleSelector, { ...state, onConfirm: confirmed, 'onUpdate:value': updated, 'onUpdate:open': (open: boolean) => { state.open = open; } }) });
  app.mount(host);
  await vi.waitFor(() => expect(checkbox('文章A')).not.toBeNull());
  return state;
}
beforeEach(() => {
  vi.clearAllMocks();
  api.articles.mockResolvedValue({ items: [a, b], totalCount: 40 });
  api.categories.mockResolvedValue({ items: [{ id: 'news', name: '新闻栏目' }], totalCount: 1 });
  api.tags.mockResolvedValue({ items: [{ id: 'topic', name: '专题' }], totalCount: 1 });
});
afterEach(() => { app?.unmount(); host?.remove(); });

describe('reusable CMS article selector', () => {
  it('submits date bounds and handles invalid date ranges without requesting the server', async () => {
    await mount();
    const dates = host.querySelectorAll('input[type="date"]');
    const from = dates[0] as HTMLInputElement;
    const to = dates[1] as HTMLInputElement;
    from.value = '2026-10-01'; from.dispatchEvent(new Event('input'));
    to.value = '2026-10-13'; to.dispatchEvent(new Event('input'));
    await nextTick(); button('搜索').click();
    await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(2));
    expect(api.articles.mock.calls[1]?.[0]).toMatchObject({ publishTimeFrom: expect.any(String), publishTimeTo: expect.any(String) });
    await vi.waitFor(() => expect(button('重置').disabled).toBe(false));
    from.value = '2026-10-14'; from.dispatchEvent(new Event('input'));
    await nextTick(); button('搜索').click(); await nextTick();
    expect(host.textContent).toContain('开始日期不能晚于结束日期');
    expect(api.articles).toHaveBeenCalledTimes(2);
  });
  it('revalidates selections when callers change their fixed constraints', async () => {
    const state = await mount({ multiple: true });
    checkbox('文章A').click(); await nextTick();
    state.isVisible = false;
    await nextTick(); await nextTick();
    expect(button('确定选择（0）').disabled).toBe(true);
    expect(api.articles.mock.calls.at(-1)?.[0].isVisible).toBe(false);
  });
  it('keeps a fixed body, replaces a single selection, and commits only on footer confirmation', async () => {
    await mount();
    expect((host.querySelector('[data-testid="article-selector-layout"]') as HTMLElement).style.height).toBe('620px');
    checkbox('文章A').click(); await nextTick();
    checkbox('文章B').click(); await nextTick();
    expect(checkbox('文章A').checked).toBe(false);
    expect(checkbox('文章B').checked).toBe(true);
    expect(confirmed).not.toHaveBeenCalled();
    button('确定选择（1）').click(); await nextTick();
    expect(confirmed).toHaveBeenCalledWith([b]);
    expect(updated).toHaveBeenCalledWith([b]);
    expect(host.querySelector('[role="dialog"]')).toBeNull();
  });
  it('preserves cross-page selections, enforces the maximum, and supports deselection', async () => {
    api.articles.mockResolvedValueOnce({ items: [a, b], totalCount: 40 }).mockResolvedValueOnce({ items: [c, d], totalCount: 40 });
    await mount({ multiple: true, maxCount: 2 });
    checkbox('文章A').click(); await nextTick(); button('下一页').click();
    await vi.waitFor(() => expect(checkbox('文章C')).not.toBeNull());
    expect(api.articles.mock.calls[1]?.[0].skipCount).toBe(20);
    checkbox('文章C').click(); await nextTick();
    expect(checkbox('文章D').disabled).toBe(true);
    expect(host.textContent).toContain('已选择 2 / 2');
    checkbox('文章C').click(); await nextTick();
    expect(checkbox('文章D').disabled).toBe(false);
    checkbox('文章D').click(); await nextTick(); button('确定选择（2）').click();
    expect(confirmed).toHaveBeenCalledWith([a, d]);
  });
  it('keeps initial values untouched on cancel and handles a shrinking or zero limit', async () => {
    const original = [a];
    const state = await mount({ multiple: true, maxCount: 2, value: original });
    checkbox('文章B').click(); await nextTick();
    state.maxCount = 1; await nextTick();
    expect(host.textContent).toContain('已选择 1 / 1');
    state.maxCount = 0; await nextTick();
    expect(button('确定选择（0）').disabled).toBe(true);
    button('取消').click();
    expect(original).toEqual([a]);
    expect(confirmed).not.toHaveBeenCalled(); expect(updated).not.toHaveBeenCalled();
  });
  it('combines category and other server filters without allowing locked publication conditions to change', async () => {
    await mount({ status: 4, isVisible: true });
    button('新闻栏目').click(); await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(2));
    expect(api.articles.mock.calls[0]?.[0]).toMatchObject({ isTop: undefined, isRecommend: undefined });
    setFilter('搜索文章', '专题关键词'); setFilter('标签筛选', 'topic'); setFilter('内容类型筛选', 'Article');
    const top = host.querySelector('input[aria-label="置顶筛选"]') as HTMLInputElement;
    const recommended = host.querySelector('input[aria-label="推荐筛选"]') as HTMLInputElement;
    top.click(); recommended.click();
    await nextTick(); button('搜索').click();
    await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(3));
    expect(api.articles.mock.calls[2]?.[0]).toMatchObject({ keyword: '专题关键词', categoryId: 'news', tagId: 'topic', contentType: 'Article', isTop: true, isRecommend: true, status: 4, isVisible: true });
    expect(host.querySelector('[aria-label="状态筛选"]')).toBeNull();
    expect(host.querySelector('[aria-label="可见性筛选"]')).toBeNull();
    expect(host.textContent).not.toContain('已发布');
    expect(host.textContent).not.toContain('仅可见文章');
    await vi.waitFor(() => expect(button('重置').disabled).toBe(false));
    button('重置').click(); await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(4));
    expect(api.articles.mock.calls[3]?.[0]).toMatchObject({ categoryId: undefined, keyword: undefined, isTop: undefined, isRecommend: undefined, status: 4, isVisible: true, skipCount: 0 });
    expect(top.checked).toBe(false); expect(recommended.checked).toBe(false);
    await vi.waitFor(() => expect(button('每页50篇').disabled).toBe(false)); button('每页50篇').click();
    await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(5));
    expect(api.articles.mock.calls[4]?.[0]).toMatchObject({ maxResultCount: 50, skipCount: 0 });
  });
  it('rejects ineligible rows and ignores a stale response after changing category', async () => {
    let finishSlow: (value: { items: AdminArticleListItemDto[]; totalCount: number }) => void = () => {};
    api.articles.mockImplementation((params: { categoryId?: string; keyword?: string; }) => {
      if (params.keyword === 'slow' && !params.categoryId) return new Promise(resolve => { finishSlow = resolve; });
      return Promise.resolve({ items: [a, article('草稿', { status: 0 }), article('隐藏文章', { isVisible: false })], totalCount: 3 });
    });
    await mount({ status: 4, isVisible: true });
    expect(checkbox('草稿').disabled).toBe(true); expect(checkbox('隐藏文章').disabled).toBe(true);
    setFilter('搜索文章', 'slow'); await nextTick(); button('搜索').click();
    await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(2));
    button('新闻栏目').click(); await vi.waitFor(() => expect(api.articles).toHaveBeenCalledTimes(3));
    finishSlow({ items: [b], totalCount: 1 }); await nextTick(); await nextTick();
    expect(checkbox('文章A')).not.toBeNull(); expect(checkbox('文章B')).toBeNull();
  });
});
