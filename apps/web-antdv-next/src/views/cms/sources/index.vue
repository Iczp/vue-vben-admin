<script lang="ts" setup>
import type { ContentSourceDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSourceApi,
  getSourcesApi,
  SourceType,
} from '#/api/cms';

import { sourceTypeOptions, useColumns } from './data';
import SourceModal from './modules/source-modal.vue';

const filters = reactive<{
  externalId: string;
  sourceSystem: string;
  sourceType?: SourceType;
}>({
  externalId: '',
  sourceSystem: '',
  sourceType: undefined,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: SourceModal,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(undefined).open();
}

function onEdit(row: ContentSourceDto) {
  formModalApi.setData(row).open();
}

function onDelete(row: ContentSourceDto) {
  Modal.confirm({
    content: `确定删除该条数据源采集记录吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除确认',
    async onOk() {
      await deleteSourceApi(row.id);
      message.success('数据源记录删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ContentSourceDto;
}) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as ContentSourceDto);
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
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getSourcesApi({
            externalId: filters.externalId.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            sourceSystem: filters.sourceSystem.trim() || undefined,
            sourceType: filters.sourceType,
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
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Input.Search
              v-model:value="filters.sourceSystem"
              placeholder="搜索来源系统名称..."
              class="w-[200px]"
              allow-clear
              @search="onFilterChange"
            />

            <Input.Search
              v-model:value="filters.externalId"
              placeholder="搜索外部业务 ID..."
              class="w-[200px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.sourceType"
              placeholder="渠道类型"
              class="w-[150px]"
              allow-clear
              :options="sourceTypeOptions"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建数据源
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 表格展示 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗 -->
    <FormModal @success="refreshGrid" />
  </Page>
</template>
