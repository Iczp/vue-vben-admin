<script lang="ts" setup>
import type { AdminArticleListItemDto, CategoryDto } from '#/api/cms';

import { onMounted, reactive, ref } from 'vue';

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
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  archiveArticleApi,
  ArticleStatus,
  deleteArticleApi,
  getArticlesApi,
  getCategoriesApi,
  offlineArticleApi,
  publishArticleApi,
} from '#/api/cms';

import { useColumns } from './data';
import ArticleModal from './modules/article-modal.vue';
import ReviewModal from './modules/review-modal.vue';
import RevisionModal from './modules/revision-modal.vue';
import ScheduleModal from './modules/schedule-modal.vue';

// 检索过滤参数
const filters = reactive<{
  categoryId?: string;
  isRecommend?: boolean;
  isTop?: boolean;
  keyword: string;
  status?: ArticleStatus;
}>({
  categoryId: undefined,
  isRecommend: undefined,
  isTop: undefined,
  keyword: '',
  status: undefined,
});

const categoryOptions = ref<{ label: string; value: string }[]>([]);

onMounted(async () => {
  try {
    const catRes = await getCategoriesApi({ maxResultCount: 200 });
    categoryOptions.value = (catRes.items || []).map((c: CategoryDto) => ({
      label: c.name,
      value: c.id,
    }));
  } catch (error) {
    console.error('加载分类列表失败', error);
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

// ==================== 表格实例 ====================
const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as AdminArticleListItemDto);
    },
  },
  gridOptions: {
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
            isRecommend: filters.isRecommend,
            isTop: filters.isTop,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
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
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索文章标题 / 短代码 / 摘要..."
              class="w-[260px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.categoryId"
              placeholder="全部栏目分类"
              class="w-[180px]"
              allow-clear
              :options="categoryOptions"
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

      <!-- 文章数据列表 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗组件挂载 -->
    <ArticleFormModal @success="refreshGrid" />
    <RevisionsModal @success="refreshGrid" />
    <ReviewFormModal @success="refreshGrid" />
    <ScheduleFormModal @success="refreshGrid" />
  </Page>
</template>
