<script lang="ts" setup>
import type { ContentPromotionDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deletePromotionApi, getPromotionsApi } from '#/api/cms';

import { useColumns } from './data';
import PromotionModal from './modules/promotion-modal.vue';

const filters = reactive<{
  enabledFilter?: number;
  entityType?: string;
  scene?: string;
}>({
  enabledFilter: undefined,
  entityType: undefined,
  scene: undefined,
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: PromotionModal,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(undefined).open();
}

function onEdit(row: ContentPromotionDto) {
  formModalApi.setData(row).open();
}

function onDelete(row: ContentPromotionDto) {
  Modal.confirm({
    content: `确定删除该条置顶推广记录吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除推广确认',
    async onOk() {
      await deletePromotionApi(row.id);
      message.success('推广删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ContentPromotionDto;
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
      onEdit(params.row as ContentPromotionDto);
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
          return await getPromotionsApi({
            entityType: filters.entityType || undefined,
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            maxResultCount: page.pageSize,
            scene: filters.scene?.trim() || undefined,
            skipCount: (page.currentPage - 1) * page.pageSize,
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
              v-model:value="filters.scene"
              placeholder="按场景标识搜索 (例如 home)..."
              class="w-[240px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.entityType"
              placeholder="推广实体"
              class="w-[140px]"
              allow-clear
              :options="[
                { label: '文章 (Article)', value: 'Article' },
                { label: '其他实体', value: 'Other' },
              ]"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="状态筛选"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '投放中', value: 1 },
                { label: '已下线', value: 0 },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建推广
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
