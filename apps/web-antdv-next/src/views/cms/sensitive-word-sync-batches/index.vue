<script lang="ts" setup>
import type { SensitiveWordSyncBatchDto } from '#/api/cms';

import { reactive } from 'vue';
import { useRouter } from 'vue-router';

import { Page, useVbenModal } from '@vben/common-ui';
import { ExternalLink, RotateCw } from '@vben/icons';

import { Button, Card, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  applySensitiveWordSyncBatchApi,
  getSensitiveWordSyncBatchesApi,
  ignoreSensitiveWordSyncBatchApi,
  type SensitiveWordBatchStatus,
  supersedeSensitiveWordSyncBatchApi,
} from '#/api/cms';

import { batchStatusOptions, useColumns } from './data';
import DiffDrawer from './modules/diff-drawer.vue';

const router = useRouter();

const filters = reactive<{
  status?: SensitiveWordBatchStatus;
}>({
  status: undefined,
});

const [DiffModal, diffModalApi] = useVbenModal({
  connectedComponent: DiffDrawer,
  destroyOnClose: true,
});

function onReview(row: SensitiveWordSyncBatchDto) {
  diffModalApi.setData({ id: row.id }).open();
}

function onApply(row: SensitiveWordSyncBatchDto) {
  Modal.confirm({
    content: `确认将该批次（${row.totalCount} 项差异）应用到敏感词草稿态吗？已锁定的词条将被保护跳过。应用完成后需在【规则版本】中发布生效。`,
    okText: '确认应用',
    title: '应用同步差异批次',
    async onOk() {
      try {
        message.loading({ content: '正在应用变更到敏感词库...', key: 'apply-batch' });
        await applySensitiveWordSyncBatchApi(row.id);
        message.success({ content: '批次应用成功！草稿态已更新，可前往版本中心发布上线。', key: 'apply-batch' });
        refreshGrid();
      } catch (error: any) {
        message.error({ content: `应用失败: ${error?.message || error}`, key: 'apply-batch' });
      }
    },
  });
}

function onIgnore(row: SensitiveWordSyncBatchDto) {
  Modal.confirm({
    content: '确认忽略本批次变更吗？忽略后该批次的词条将不会合并到敏感词库。',
    okText: '确认忽略',
    okType: 'danger',
    title: '忽略同步批次',
    async onOk() {
      try {
        await ignoreSensitiveWordSyncBatchApi(row.id, { remark: '人工审核主动忽略' });
        message.success('已忽略该批次');
        refreshGrid();
      } catch (error: any) {
        message.error(`忽略失败: ${error?.message || error}`);
      }
    },
  });
}

function onSupersede(row: SensitiveWordSyncBatchDto) {
  Modal.confirm({
    content: '确认废弃本批次吗？废弃后本批次将标记为已作废状态。',
    okText: '确认废弃',
    okType: 'danger',
    title: '废弃同步批次',
    async onOk() {
      try {
        await supersedeSensitiveWordSyncBatchApi(row.id);
        message.success('已废弃该批次');
        refreshGrid();
      } catch (error: any) {
        message.error(`废弃失败: ${error?.message || error}`);
      }
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SensitiveWordSyncBatchDto;
}) {
  switch (code) {
    case 'apply': {
      onApply(row);
      break;
    }
    case 'ignore': {
      onIgnore(row);
      break;
    }
    case 'review': {
      onReview(row);
      break;
    }
    case 'supersede': {
      onSupersede(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onReview(params.row as SensitiveWordSyncBatchDto);
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
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getSensitiveWordSyncBatchesApi({
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
      <!-- 搜索过滤栏 -->
      <Card
        variant="borderless"
        class="shrink-0 shadow-sm"
        :body-style="{ padding: '12px 16px' }"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Select
              v-model:value="filters.status"
              placeholder="全部批次状态"
              class="w-[180px]"
              allow-clear
              :options="batchStatusOptions"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button @click="router.push('/cms/sensitive-word-sources')">
              管理数据源
            </Button>
            <Button @click="router.push('/cms/sensitive-word-rule-versions')">
              <template #icon><ExternalLink class="size-4" /></template>
              版本发布中心
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 列表主体 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 差异审查抽屉/弹窗挂载 -->
    <DiffModal @success="refreshGrid" />
  </Page>
</template>
