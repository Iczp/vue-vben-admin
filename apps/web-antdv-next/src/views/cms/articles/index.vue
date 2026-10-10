<script lang="ts" setup>
import type { AdminArticleListItemDto, CategoryDto, TagDto } from '#/api/cms';

import { nextTick, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Select,
  Switch,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  archiveArticleApi,
  ArticleStatus,
  batchDeleteArticlesApi,
  batchOfflineArticlesApi,
  batchPublishArticlesApi,
  batchSetArticleCategoriesApi,
  batchSetArticleStatusApi,
  batchSetArticleTagsApi,
  deleteArticleApi,
  getArticlesApi,
  getCategoriesApi,
  getTagsApi,
  offlineArticleApi,
  publishArticleApi,
} from '#/api/cms';

import { useColumns } from './data';
import CategoryTreeSelect from '../components/CategoryTreeSelect.vue';
import ArticleModal from './modules/article-modal.vue';
import ReviewModal from './modules/review-modal.vue';
import RevisionModal from './modules/revision-modal.vue';
import ScheduleModal from './modules/schedule-modal.vue';

const route = useRoute();

// 检索过滤参数
const filters = reactive<{
  categoryId?: string;
  contentType?: string;
  isRecommend?: boolean;
  isTop?: boolean;
  keyword: string;
  status?: ArticleStatus;
  tagId?: string;
}>({
  categoryId: (route.query?.categoryId as string | undefined) || undefined,
  contentType: undefined,
  isRecommend: undefined,
  isTop: undefined,
  keyword: '',
  status: undefined,
  tagId: (route.query?.tagId as string | undefined) || undefined,
});

const categoryOptions = ref<{ label: string; value: string }[]>([]);
const tagOptions = ref<{ label: string; value: string }[]>([]);

onMounted(async () => {
  try {
    const [catRes, tagRes] = await Promise.all([
      getCategoriesApi({ maxResultCount: 200 }),
      getTagsApi({ maxResultCount: 200 }),
    ]);
    categoryOptions.value = (catRes.items || []).map((c: CategoryDto) => ({
      label: c.name,
      value: c.id,
    }));
    tagOptions.value = (tagRes.items || []).map((t: TagDto) => ({
      label: t.name,
      value: t.id,
    }));
  } catch (error) {
    console.error('加载分类/标签列表失败', error);
  }
});

// ==================== 模态框注入 ====================
const [ArticleFormModal, articleFormModalApi] = useVbenModal({
  connectedComponent: ArticleModal,
  destroyOnClose: true,
});

const [RevisionsModal, revisionsModalApi] = useVbenModal({
  connectedComponent: RevisionModal,
  destroyOnClose: true,
});

const [ReviewFormModal, reviewFormModalApi] = useVbenModal({
  connectedComponent: ReviewModal,
  destroyOnClose: true,
});

const [ScheduleFormModal, scheduleFormModalApi] = useVbenModal({
  connectedComponent: ScheduleModal,
  destroyOnClose: true,
});

function onCreate() {
  articleFormModalApi.setData(undefined).open();
}

function onEdit(row: AdminArticleListItemDto) {
  articleFormModalApi.setData(row.id).open();
}

// 自动侦听路由中的文章 ID 参数（支持直接访问 /cms/articles/:id 或 /cms/articles?id=xxx）
watch(
  () =>
    (route.params?.id as string | undefined) ||
    (route.query?.id as string | undefined),
  async (targetId) => {
    if (targetId && typeof targetId === 'string') {
      await nextTick();
      if (typeof articleFormModalApi?.setData === 'function') {
        articleFormModalApi.setData(targetId).open();
      }
    }
  },
  { immediate: true },
);

// 自动侦听路由中的标签筛选参数变动（支持页面已打开时切换不同标签）
watch(
  () => route.query?.tagId as string | undefined,
  (tagId) => {
    if (tagId !== filters.tagId) {
      filters.tagId = tagId;
      void nextTick(() => {
        refreshGrid();
      });
    }
  },
);

// 自动侦听路由中的栏目分类筛选参数变动（支持页面已打开时切换不同分类）
watch(
  () => route.query?.categoryId as string | undefined,
  (catId) => {
    if (catId !== filters.categoryId) {
      filters.categoryId = catId;
      void nextTick(() => {
        refreshGrid();
      });
    }
  },
);

function onRevisions(row: AdminArticleListItemDto) {
  revisionsModalApi.setData({ id: row.id, title: row.title }).open();
}

function onReview(row: AdminArticleListItemDto) {
  reviewFormModalApi.setData({ id: row.id, title: row.title }).open();
}

function onSchedule(row: AdminArticleListItemDto) {
  scheduleFormModalApi.setData({ id: row.id, title: row.title }).open();
}

function onPublish(row: AdminArticleListItemDto) {
  Modal.confirm({
    content: `确认立即发布文章【${row.title}】吗？发布后前台将立即同步可见。`,
    okText: '确认发布',
    title: '发布确认',
    async onOk() {
      await publishArticleApi(row.id);
      message.success('文章已成功发布');
      refreshGrid();
    },
  });
}

function onOffline(row: AdminArticleListItemDto) {
  Modal.confirm({
    content: `确认下架文章【${row.title}】吗？下架后前台将不可见。`,
    okText: '确认下架',
    okType: 'danger',
    title: '下架确认',
    async onOk() {
      await offlineArticleApi(row.id);
      message.success('文章已下架');
      refreshGrid();
    },
  });
}

function onArchive(row: AdminArticleListItemDto) {
  Modal.confirm({
    content: `确认归档文章【${row.title}】吗？归档后文章转为历史存档状态。`,
    okText: '确认归档',
    title: '归档确认',
    async onOk() {
      await archiveArticleApi(row.id);
      message.success('文章已归档');
      refreshGrid();
    },
  });
}

function onDelete(row: AdminArticleListItemDto) {
  Modal.confirm({
    content: `确定删除文章【${row.title}】吗？此操作将移入回收站。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除确认',
    async onOk() {
      await deleteArticleApi(row.id);
      message.success('文章删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AdminArticleListItemDto;
}) {
  switch (code) {
    case 'archive': {
      onArchive(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'offline': {
      onOffline(row);
      break;
    }
    case 'publish': {
      onPublish(row);
      break;
    }
    case 'review': {
      onReview(row);
      break;
    }
    case 'revisions': {
      onRevisions(row);
      break;
    }
    case 'schedule': {
      onSchedule(row);
      break;
    }
  }
}

// ==================== 批量操作与选中状态 ====================
const selectedRows = ref<AdminArticleListItemDto[]>([]);
const selectedRowKeys = ref<string[]>([]);

function updateSelection() {
  const records = (gridApi.grid?.getCheckboxRecords() || []) as AdminArticleListItemDto[];
  selectedRows.value = records;
  selectedRowKeys.value = records.map((r) => r.id);
}

function clearSelection() {
  gridApi.grid?.clearCheckboxRow();
  selectedRows.value = [];
  selectedRowKeys.value = [];
}

const contentTypeFilterOptions = [
  { label: '全部内容形态', value: '' },
  { label: '标准图文 (Article)', value: 'Article' },
  { label: '快讯要闻 (News)', value: 'News' },
  { label: '通知公告 (Notice)', value: 'Notice' },
  { label: '图集画廊 (Gallery)', value: 'Gallery' },
  { label: '视频内容 (Video)', value: 'Video' },
  { label: '百科词条 (Wiki)', value: 'Wiki' },
  { label: '外部转存 (Wechat)', value: 'Wechat' },
];

// 批量分类弹窗
const batchCategoryModalVisible = ref(false);
const batchCategoryLoading = ref(false);
const batchCategoryIds = ref<string[]>([]);
const batchCategoryOverwrite = ref(true);

function openBatchCategoryModal() {
  if (!selectedRowKeys.value.length) return;
  batchCategoryIds.value = [];
  batchCategoryOverwrite.value = true;
  batchCategoryModalVisible.value = true;
}

async function handleBatchCategorySubmit() {
  if (!batchCategoryIds.value.length) {
    message.warning('请选择至少一个栏目分类');
    return;
  }
  try {
    batchCategoryLoading.value = true;
    await batchSetArticleCategoriesApi({
      ids: selectedRowKeys.value,
      categoryIds: batchCategoryIds.value,
      overwrite: batchCategoryOverwrite.value,
    });
    message.success(`成功为 ${selectedRowKeys.value.length} 篇内容设置分类`);
    batchCategoryModalVisible.value = false;
    clearSelection();
    refreshGrid();
  } finally {
    batchCategoryLoading.value = false;
  }
}

// 批量标签弹窗
const batchTagModalVisible = ref(false);
const batchTagLoading = ref(false);
const batchTagNames = ref<string[]>([]);
const batchTagOverwrite = ref(true);

function openBatchTagModal() {
  if (!selectedRowKeys.value.length) return;
  batchTagNames.value = [];
  batchTagOverwrite.value = true;
  batchTagModalVisible.value = true;
}

async function handleBatchTagSubmit() {
  if (!batchTagNames.value.length) {
    message.warning('请选择或输入至少一个标签');
    return;
  }
  try {
    batchTagLoading.value = true;
    await batchSetArticleTagsApi({
      ids: selectedRowKeys.value,
      tagNames: batchTagNames.value,
      overwrite: batchTagOverwrite.value,
    });
    message.success(`成功为 ${selectedRowKeys.value.length} 篇内容设置标签`);
    batchTagModalVisible.value = false;
    clearSelection();
    refreshGrid();
  } finally {
    batchTagLoading.value = false;
  }
}

// 批量发布
function onBatchPublish() {
  if (!selectedRowKeys.value.length) return;
  Modal.confirm({
    content: `确认将选中的 ${selectedRowKeys.value.length} 篇内容立即发布吗？发布后前台将立即同步可见。`,
    okText: '确认批量发布',
    title: '批量发布确认',
    async onOk() {
      await batchPublishArticlesApi({ ids: selectedRowKeys.value });
      message.success(`成功发布 ${selectedRowKeys.value.length} 篇内容`);
      clearSelection();
      refreshGrid();
    },
  });
}

// 批量下架
function onBatchOffline() {
  if (!selectedRowKeys.value.length) return;
  Modal.confirm({
    content: `确认将选中的 ${selectedRowKeys.value.length} 篇内容下架吗？下架后前台将不可见。`,
    okText: '确认批量下架',
    okType: 'danger',
    title: '批量下架确认',
    async onOk() {
      await batchOfflineArticlesApi({ ids: selectedRowKeys.value });
      message.success(`成功下架 ${selectedRowKeys.value.length} 篇内容`);
      clearSelection();
      refreshGrid();
    },
  });
}

// 批量删除
function onBatchDelete() {
  if (!selectedRowKeys.value.length) return;
  Modal.confirm({
    content: `确定删除选中的 ${selectedRowKeys.value.length} 篇内容吗？此操作将移入回收站。`,
    okText: '确认批量删除',
    okType: 'danger',
    title: '批量删除确认',
    async onOk() {
      await batchDeleteArticlesApi({ ids: selectedRowKeys.value });
      message.success(`成功删除 ${selectedRowKeys.value.length} 篇内容`);
      clearSelection();
      refreshGrid();
    },
  });
}

// 批量状态修改弹窗
const batchStatusModalVisible = ref(false);
const batchStatusLoading = ref(false);
const batchTargetStatus = ref<ArticleStatus>(ArticleStatus.Draft);

function openBatchStatusModal() {
  if (!selectedRowKeys.value.length) return;
  batchTargetStatus.value = ArticleStatus.Draft;
  batchStatusModalVisible.value = true;
}

async function handleBatchStatusSubmit() {
  try {
    batchStatusLoading.value = true;
    await batchSetArticleStatusApi({
      ids: selectedRowKeys.value,
      status: batchTargetStatus.value,
    });
    message.success(`成功修改 ${selectedRowKeys.value.length} 篇内容的状态`);
    batchStatusModalVisible.value = false;
    clearSelection();
    refreshGrid();
  } finally {
    batchStatusLoading.value = false;
  }
}

// ==================== 表格实例 ====================
const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as AdminArticleListItemDto);
    },
    checkboxAll: updateSelection,
    checkboxChange: updateSelection,
  },
  gridOptions: {
    checkboxConfig: {
      highlight: true,
      range: true,
    },
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [10, 15, 20, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getArticlesApi({
            categoryId: filters.categoryId || undefined,
            contentType: filters.contentType || undefined,
            isRecommend: filters.isRecommend,
            isTop: filters.isTop,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
            tagId: filters.tagId || undefined,
          });
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 顶部搜索工具栏 -->
      <Card variant="borderless" class="shrink-0 shadow-sm" :styles="{ body: { padding: '12px 16px' } }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索文章标题 / 短代码 / 摘要..."
              class="w-[240px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.contentType"
              placeholder="全部内容形态"
              class="w-[160px]"
              allow-clear
              :options="contentTypeFilterOptions"
              @change="onFilterChange"
            />

            <CategoryTreeSelect
              v-model:value="filters.categoryId"
              placeholder="全部栏目分类"
              class="w-[170px]"
              allow-clear
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.tagId"
              placeholder="全部标签"
              class="w-[150px]"
              allow-clear
              :options="tagOptions"
              @change="onFilterChange"
            />

            <RadioGroup
              v-model:value="filters.status"
              button-style="solid"
              @change="onFilterChange"
            >
              <RadioButton :value="undefined">全部状态</RadioButton>
              <RadioButton :value="ArticleStatus.Draft">草稿</RadioButton>
              <RadioButton :value="ArticleStatus.PendingReview">待审核</RadioButton>
              <RadioButton :value="ArticleStatus.Approved">已审核</RadioButton>
              <RadioButton :value="ArticleStatus.Published">已发布</RadioButton>
              <RadioButton :value="ArticleStatus.Offline">已下架</RadioButton>
              <RadioButton :value="ArticleStatus.Archived">已归档</RadioButton>
            </RadioGroup>
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建文章
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 批量操作提示栏 -->
      <div
        v-if="selectedRowKeys.length > 0"
        class="shrink-0 bg-primary/10 border border-primary/30 rounded-lg p-2.5 px-4 flex flex-wrap items-center justify-between gap-3 shadow-sm transition-all"
      >
        <div class="flex items-center gap-2">
          <span class="text-sm font-medium text-foreground">
            已勾选 <span class="text-primary font-bold">{{ selectedRowKeys.length }}</span> 篇内容
          </span>
          <Button type="link" size="small" @click="clearSelection">取消选择</Button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button size="small" @click="openBatchCategoryModal">批量设置分类</Button>
          <Button size="small" @click="openBatchTagModal">批量设置标签</Button>
          <Button size="small" type="primary" ghost @click="onBatchPublish">批量发布</Button>
          <Button size="small" @click="onBatchOffline">批量下架</Button>

          <Button size="small" @click="openBatchStatusModal">批量修改状态</Button>

          <Button size="small" danger @click="onBatchDelete">批量删除</Button>
        </div>
      </div>

      <!-- 文章数据列表 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 批量分类弹窗 -->
    <Modal
      v-model:open="batchCategoryModalVisible"
      title="批量设置栏目分类"
      :confirm-loading="batchCategoryLoading"
      @ok="handleBatchCategorySubmit"
    >
      <div class="py-4 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">选择目标栏目分类</label>
          <CategoryTreeSelect
            v-model:value="batchCategoryIds"
            multiple
            tree-checkable
            :tree-check-strictly="true"
            placeholder="请选择要关联的分类（支持树型勾选与搜索）"
            class="w-full"
          />
        </div>
        <div class="flex items-center justify-between p-3 bg-muted/20 rounded border">
          <div>
            <div class="font-medium text-sm">覆盖现有分类</div>
            <div class="text-xs text-muted-foreground">开启后将清除选中文档原有的分类，仅保留新选分类；关闭则为追加模式</div>
          </div>
          <Switch v-model:checked="batchCategoryOverwrite" />
        </div>
      </div>
    </Modal>

    <!-- 批量标签弹窗 -->
    <Modal
      v-model:open="batchTagModalVisible"
      title="批量设置文章标签"
      :confirm-loading="batchTagLoading"
      @ok="handleBatchTagSubmit"
    >
      <div class="py-4 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">选择或输入标签</label>
          <Select
            v-model:value="batchTagNames"
            mode="tags"
            placeholder="请输入或选择标签（输入后回车添加）"
            class="w-full"
            :options="tagOptions"
          />
        </div>
        <div class="flex items-center justify-between p-3 bg-muted/20 rounded border">
          <div>
            <div class="font-medium text-sm">覆盖现有标签</div>
            <div class="text-xs text-muted-foreground">开启后将清除选中文档原有的标签，仅保留新选标签；关闭则为追加模式</div>
          </div>
          <Switch v-model:checked="batchTagOverwrite" />
        </div>
      </div>
    </Modal>

    <!-- 批量状态修改弹窗 -->
    <Modal
      v-model:open="batchStatusModalVisible"
      title="批量修改内容状态"
      :confirm-loading="batchStatusLoading"
      @ok="handleBatchStatusSubmit"
    >
      <div class="py-4 space-y-3">
        <label class="block text-sm font-medium">请选择要统一变更的目标状态：</label>
        <RadioGroup v-model:value="batchTargetStatus" class="flex flex-col gap-2.5">
          <RadioButton :value="ArticleStatus.Draft">草稿 (Draft)</RadioButton>
          <RadioButton :value="ArticleStatus.PendingReview">待审核 (Pending Review)</RadioButton>
          <RadioButton :value="ArticleStatus.Approved">已审核 (Approved)</RadioButton>
          <RadioButton :value="ArticleStatus.Published">已发布 (Published)</RadioButton>
          <RadioButton :value="ArticleStatus.Offline">已下架 (Offline)</RadioButton>
          <RadioButton :value="ArticleStatus.Archived">已归档 (Archived)</RadioButton>
        </RadioGroup>
      </div>
    </Modal>

    <!-- 弹窗组件挂载 -->
    <ArticleFormModal @success="refreshGrid" />
    <RevisionsModal @success="refreshGrid" />
    <ReviewFormModal @success="refreshGrid" />
    <ScheduleFormModal @success="refreshGrid" />
  </Page>
</template>
