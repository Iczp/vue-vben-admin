<script setup lang="ts">
import type {
  AdminArticleListItemDto,
  CategoryDto,
  TagDto,
} from '#/api/cms/types';

import { computed, reactive, ref, watch } from 'vue';

import { formatDateTime } from '@vben/utils';

import {
  Alert,
  Button,
  Checkbox,
  Empty,
  Input,
  Modal,
  Pagination,
  Select,
  Spin,
  Tag,
  Tree,
} from 'antdv-next';

import { getArticlesApi, getArticleWebUrl } from '#/api/cms/articles';
import { getCategoriesApi } from '#/api/cms/categories';
import { getTagsApi } from '#/api/cms/tags';
import { ArticleStatus } from '#/api/cms/types';
import { getRequestErrorMessage } from '#/utils/request-error';

import { articleStatusOptions, contentTypeOptions } from '../articles/data';

const props = withDefaults(
  defineProps<{
    disabledIds?: string[];
    height?: number;
    isVisible?: boolean;
    maxCount?: number;
    multiple?: boolean;
    open: boolean;
    status?: ArticleStatus;
    title?: string;
    value?: AdminArticleListItemDto[];
  }>(),
  {
    multiple: false,
    maxCount: 20,
    value: () => [],
    disabledIds: () => [],
    status: undefined,
    isVisible: undefined,
    title: '选择文章',
    height: 620,
  },
);
const emit = defineEmits<{
  confirm: [articles: AdminArticleListItemDto[]];
  'update:open': [open: boolean];
  'update:value': [articles: AdminArticleListItemDto[]];
}>();

interface CategoryNode {
  key: string;
  title: string;
  children?: CategoryNode[];
}
const rows = ref<AdminArticleListItemDto[]>([]);
const categories = ref<CategoryDto[]>([]);
const tags = ref<TagDto[]>([]);
const selected = ref(new Map<string, AdminArticleListItemDto>());
const failedCovers = ref(new Set<string>());
const categoryKeyword = ref('');
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const loading = ref(false);
const optionsLoading = ref(false);
const error = ref('');
const optionsError = ref('');
const filters = reactive<{
  categoryId?: string;
  contentType?: string;
  isRecommend: boolean;
  isTop: boolean;
  isVisible?: string;
  keyword: string;
  publishFrom: string;
  publishTo: string;
  status?: ArticleStatus;
  tagId?: string;
}>({
  keyword: '',
  publishFrom: '',
  publishTo: '',
  isTop: false,
  isRecommend: false,
});
let epoch = 0;
let requestVersion = 0;
const limit = computed(() => {
  const maximum = Math.max(
    0,
    Math.floor(Number.isFinite(props.maxCount) ? props.maxCount : 20),
  );
  return props.multiple ? maximum : Math.min(1, maximum);
});
const booleanOptions = [
  { label: '是', value: 'true' },
  { label: '否', value: 'false' },
];
const tagOptions = computed(() =>
  tags.value.map((tag) => ({ label: tag.name, value: tag.id })),
);
const categoryTree = computed(() => {
  const nodes = new Map<string, CategoryNode>();
  for (const category of categories.value)
    nodes.set(category.id, {
      key: category.id,
      title: category.name,
      children: [],
    });
  const roots: CategoryNode[] = [];
  for (const category of categories.value) {
    const node = nodes.get(category.id)!;
    const parent = category.parentId ? nodes.get(category.parentId) : undefined;
    if (parent) parent.children!.push(node);
    else roots.push(node);
  }
  const narrow = (items: CategoryNode[]): CategoryNode[] =>
    items.flatMap((node) => {
      if (
        !categoryKeyword.value ||
        node.title.includes(categoryKeyword.value.trim())
      )
        return [node];
      const children = narrow(node.children ?? []);
      return children.length > 0 ? [{ ...node, children }] : [];
    });
  return [{ key: '', title: '全部栏目' }, ...narrow(roots)];
});

function eligible(row: AdminArticleListItemDto) {
  return (
    !props.disabledIds.includes(row.id) &&
    (props.status === undefined || row.status === props.status) &&
    (props.isVisible === undefined || row.isVisible === props.isVisible)
  );
}
function disabled(row: AdminArticleListItemDto) {
  return (
    loading.value ||
    limit.value === 0 ||
    !eligible(row) ||
    (props.multiple &&
      selected.value.size >= limit.value &&
      !selected.value.has(row.id))
  );
}
function toggle(row: AdminArticleListItemDto) {
  if (disabled(row)) return;
  if (selected.value.has(row.id)) selected.value.delete(row.id);
  else {
    if (!props.multiple) selected.value.clear();
    selected.value.set(row.id, row);
  }
}
function coverUrl(row: AdminArticleListItemDto) {
  if (!row.coverUrl) return '';
  try {
    const url = new URL(row.coverUrl, window.location.origin);
    return ['http:', 'https:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}
function report(cause: unknown) {
  const result = getRequestErrorMessage(cause);
  return [result.message, result.details].filter(Boolean).join('\n');
}
function booleanFilter(value: string | undefined) {
  return value === undefined ? undefined : value === 'true';
}
async function loadArticles(reset = false) {
  if (reset) page.value = 1;
  const version = ++requestVersion;
  loading.value = true;
  error.value = '';
  try {
    if (
      filters.publishFrom &&
      filters.publishTo &&
      filters.publishFrom > filters.publishTo
    )
      throw new Error('开始日期不能晚于结束日期。');
    const result = await getArticlesApi({
      keyword: filters.keyword.trim() || undefined,
      categoryId: filters.categoryId,
      tagId: filters.tagId,
      contentType: filters.contentType,
      status: props.status ?? filters.status,
      isVisible: props.isVisible ?? booleanFilter(filters.isVisible),
      isTop: filters.isTop || undefined,
      isRecommend: filters.isRecommend || undefined,
      publishTimeFrom: filters.publishFrom
        ? new Date(`${filters.publishFrom}T00:00:00`).toISOString()
        : undefined,
      publishTimeTo: filters.publishTo
        ? new Date(`${filters.publishTo}T23:59:59.999`).toISOString()
        : undefined,
      skipCount: (page.value - 1) * pageSize.value,
      maxResultCount: pageSize.value,
    });
    if (version !== requestVersion || !props.open) return;
    rows.value = result.items;
    total.value = result.totalCount;
    failedCovers.value.clear();
    for (const row of rows.value)
      if (selected.value.has(row.id)) {
        if (eligible(row)) selected.value.set(row.id, row);
        else selected.value.delete(row.id);
      }
  } catch (error) {
    if (version === requestVersion && props.open) error.value = report(error);
  } finally {
    if (version === requestVersion) loading.value = false;
  }
}
async function loadOptions() {
  const version = epoch;
  optionsLoading.value = true;
  optionsError.value = '';
  const results = await Promise.allSettled([
    getCategoriesApi({ maxResultCount: 500, isActive: true }),
    getTagsApi({ maxResultCount: 200, isEnabled: true }),
  ]);
  if (version !== epoch || !props.open) return;
  const [categoryResult, tagResult] = results;
  if (categoryResult.status === 'fulfilled')
    categories.value = categoryResult.value.items;
  if (tagResult.status === 'fulfilled') tags.value = tagResult.value.items;
  optionsError.value = results
    .filter((result) => result.status === 'rejected')
    .map((result) => report(result.reason))
    .join('\n');
  optionsLoading.value = false;
}
function resetFilters() {
  Object.assign(filters, {
    keyword: '',
    categoryId: undefined,
    tagId: undefined,
    contentType: undefined,
    status: undefined,
    isVisible: undefined,
    isTop: false,
    isRecommend: false,
    publishFrom: '',
    publishTo: '',
  });
  categoryKeyword.value = '';
  void loadArticles(true);
}
function chooseCategory(keys: (number | string)[]) {
  filters.categoryId = keys[0] ? String(keys[0]) : undefined;
  void loadArticles(true);
}
function changePage(current: number, size: number) {
  page.value = size === pageSize.value ? current : 1;
  pageSize.value = size;
  void loadArticles();
}
function close() {
  emit('update:open', false);
}
function confirm() {
  const result = [...selected.value.values()].filter(eligible);
  if (loading.value || result.length === 0 || result.length > limit.value)
    return;
  emit('update:value', result);
  emit('confirm', result);
  close();
}
watch(limit, (maximum) => {
  selected.value = new Map([...selected.value].slice(0, maximum));
});
watch(
  [() => props.status, () => props.isVisible, () => props.disabledIds],
  () => {
    selected.value = new Map(
      [...selected.value]
        .filter(([, row]) => eligible(row))
        .slice(0, limit.value),
    );
    if (props.open) void loadArticles(true);
  },
  { deep: true },
);
watch(
  () => props.open,
  (open) => {
    epoch++;
    requestVersion++;
    loading.value = false;
    if (!open) return;
    selected.value = new Map(
      props.value
        .filter(eligible)
        .slice(0, limit.value)
        .map((row) => [row.id, row]),
    );
    rows.value = [];
    categories.value = [];
    tags.value = [];
    page.value = 1;
    void loadOptions();
    void loadArticles();
  },
  { immediate: true },
);
</script>

<template>
  <Modal
    :open="open"
    :title="title"
    :width="1180"
    :styles="{ body: { padding: 0 } }"
    @cancel="close"
  >
    <div
      class="article-selector-layout"
      :style="{ height: `${height}px` }"
      data-testid="article-selector-layout"
    >
      <aside class="article-selector-sidebar">
        <strong>栏目</strong>
        <Input
          v-model:value="categoryKeyword"
          placeholder="搜索栏目"
          allow-clear
        />
        <div class="min-h-0 flex-1 overflow-y-auto">
          <Spin :spinning="optionsLoading">
            <Tree
              :tree-data="categoryTree"
              :selected-keys="[filters.categoryId ?? '']"
              block-node
              default-expand-all
              @select="chooseCategory"
            />
          </Spin>
        </div>
      </aside>
      <section class="article-selector-main">
        <div class="article-selector-filters">
          <Input
            v-model:value="filters.keyword"
            aria-label="搜索文章"
            placeholder="搜索文章标题、摘要"
            allow-clear
            @press-enter="loadArticles(true)"
          />
          <Select
            v-model:value="filters.tagId"
            aria-label="标签筛选"
            placeholder="全部标签"
            :options="tagOptions"
            show-search
            option-filter-prop="label"
            allow-clear
          />
          <Select
            v-model:value="filters.contentType"
            aria-label="内容类型筛选"
            placeholder="全部内容类型"
            :options="contentTypeOptions"
            allow-clear
          />
          <Select
            v-if="status === undefined"
            v-model:value="filters.status"
            aria-label="状态筛选"
            placeholder="全部状态"
            :options="articleStatusOptions"
            allow-clear
          />
          <Select
            v-if="isVisible === undefined"
            v-model:value="filters.isVisible"
            aria-label="可见性筛选"
            placeholder="是否可见"
            :options="booleanOptions"
            allow-clear
          />
          <div class="article-selector-flags">
            <Checkbox
              v-model:checked="filters.isRecommend"
              aria-label="推荐筛选"
            >
              是否推荐
            </Checkbox>
            <Checkbox v-model:checked="filters.isTop" aria-label="置顶筛选">
              是否置顶
            </Checkbox>
          </div>
          <label class="flex items-center gap-1 text-xs">发布起始<input
              v-model="filters.publishFrom"
              type="date"
              class="min-w-0 flex-1 rounded border px-2 py-1"
          /></label>
          <label class="flex items-center gap-1 text-xs">发布截止<input
              v-model="filters.publishTo"
              type="date"
              class="min-w-0 flex-1 rounded border px-2 py-1"
          /></label>
          <div class="flex gap-2">
            <Button
              type="primary"
              :loading="loading"
              @click="loadArticles(true)"
            >
              搜索
</Button><Button :disabled="loading" @click="resetFilters">重置</Button>
          </div>
        </div>
        <Alert
          v-if="error || optionsError"
          type="error"
          :message="error || optionsError"
          class="mx-3 whitespace-pre-wrap"
        />
        <div class="article-selector-list" data-testid="article-selector-list">
          <Spin :spinning="loading">
            <div
              v-for="row in rows"
              :key="row.id"
              class="article-selector-row"
              data-testid="cms-article-row"
            >
              <Checkbox
                :checked="selected.has(row.id)"
                :disabled="disabled(row)"
                :aria-label="`选择文章：${row.title}`"
                @change="toggle(row)"
              />
              <div class="article-selector-cover">
                <img
                  v-if="coverUrl(row) && !failedCovers.has(row.id)"
                  :src="coverUrl(row)"
                  :alt="`${row.title}的封面`"
                  width="96"
                  height="72"
                  loading="lazy"
                  @error="failedCovers.add(row.id)"
                />
                <span v-else>暂无封面</span>
              </div>
              <div class="min-w-0 flex-1 space-y-2">
                <strong class="block break-words">{{ row.title }}</strong>
                <p
                  v-if="row.summary"
                  class="line-clamp-2 text-sm text-muted-foreground"
                >
                  {{ row.summary }}
                </p>
                <div class="flex flex-wrap items-center gap-1 text-xs">
                  <span>栏目：</span>
                  <Tag
                    v-for="category in row.categories"
                    :key="category.id"
                    color="cyan"
                  >
                    {{ category.name
                    }}{{
                      category.id === row.mainCategoryId ? ' · 主栏目' : ''
                    }}
                  </Tag>
                  <span
                    v-if="!row.categories?.length"
                    class="text-muted-foreground"
                    >未设置栏目</span>
                </div>
                <div class="flex flex-wrap items-center gap-1 text-xs">
                  <span>标签：</span>
                  <Tag
                    v-for="tagItem in row.tags"
                    :key="tagItem.id"
                    color="blue"
                  >
                    {{ tagItem.name }}
                  </Tag>
                  <span v-if="!row.tags?.length" class="text-muted-foreground">暂无标签</span>
                </div>
                <div
                  class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"
                >
                  <Tag
                    v-if="status === undefined"
                    :color="
                      articleStatusOptions.find(
                        (option) => option.value === row.status,
                      )?.color
                    "
                  >
                    {{
                      articleStatusOptions.find(
                        (option) => option.value === row.status,
                      )?.label
                    }}
                  </Tag>
                  <Tag
                    v-if="isVisible === undefined && !row.isVisible"
                    color="warning"
                  >
                    不可见
                  </Tag>
                  <span v-if="row.publishTime">发布于 {{ formatDateTime(row.publishTime) }}</span>
                  <Tag v-if="row.isTop" color="red">置顶</Tag><Tag v-if="row.isRecommend" color="orange">推荐</Tag>
                  <a
                    :href="getArticleWebUrl(row)"
                    target="_blank"
                    rel="noopener noreferrer"
                    >打开原文预览</a>
                </div>
              </div>
            </div>
            <Empty
              v-if="!loading && !rows.length"
              description="暂无符合条件的文章"
            />
          </Spin>
        </div>
        <div class="article-selector-selection">
          <Tag
            v-for="row in selected.values()"
            :key="row.id"
            closable
            @close="selected.delete(row.id)"
          >
            <span
              class="inline-block max-w-40 truncate align-middle"
              :title="row.title"
              >{{ row.title }}</span>
          </Tag>
          <span v-if="!selected.size" class="text-xs text-muted-foreground">勾选文章后，点击底部确认。</span>
        </div>
        <div class="article-selector-pagination">
          <Pagination
            :current="page"
            :page-size="pageSize"
            :total="total"
            :page-size-options="[10, 20, 50]"
            show-size-changer
            :disabled="loading"
            @change="changePage"
          />
        </div>
      </section>
    </div>
    <template #footer>
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2 text-sm">
          <span>已选择 {{ selected.size }} / {{ limit }} 篇{{
              multiple ? '' : '（单选）'
            }}</span><Button
            size="small"
            :disabled="!selected.size"
            @click="selected.clear()"
          >
            清空选择
          </Button>
        </div>
        <div class="flex gap-2">
          <Button @click="close">取消</Button><Button
            type="primary"
            :disabled="loading || !selected.size || selected.size > limit"
            @click="confirm"
          >
            确定选择（{{ selected.size }}）
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<style scoped>
.article-selector-layout {
  display: grid;
  grid-template-columns: 220px minmax(0, 1fr);
  gap: 12px;
  max-height: calc(100dvh - 200px);
  padding: 12px;
  overflow: hidden;
  background: hsl(var(--muted) / 35%);
}

.article-selector-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  padding: 16px;
  background: hsl(var(--muted));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.article-selector-main {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
}

.article-selector-filters {
  display: grid;
  flex-shrink: 0;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  align-items: center;
  padding: 12px;
}

.article-selector-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.article-selector-list {
  flex: 1;
  min-height: 0;
  padding: 0 12px;
  overflow-y: auto;
}

.article-selector-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 14px 0;
  border-bottom: 1px solid hsl(var(--border));
}

.article-selector-cover {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 96px;
  height: 72px;
  overflow: hidden;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  border-radius: 6px;
}

.article-selector-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.article-selector-pagination {
  flex-shrink: 0;
  padding: 12px;
  border-top: 1px solid hsl(var(--border));
}

.article-selector-selection {
  display: flex;
  flex-shrink: 0;
  gap: 6px;
  align-items: center;
  height: 40px;
  padding: 0 12px;
  overflow-x: auto;
  border-top: 1px solid hsl(var(--border));
}

@media (max-width: 760px) {
  .article-selector-layout {
    grid-template-columns: 150px minmax(0, 1fr);
  }

  .article-selector-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .article-selector-cover {
    width: 64px;
    height: 50px;
  }
}
</style>
