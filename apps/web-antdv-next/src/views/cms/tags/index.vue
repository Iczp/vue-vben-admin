<script lang="ts" setup>
import type { TagDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTagApi, getTagsApi } from '#/api/cms';

import { useColumns } from './data';
import TagModal from './modules/tag-modal.vue';

const filters = reactive<{
  enabledFilter?: number;
  keyword: string;
}>({
  enabledFilter: undefined,
  keyword: '',
});

const [TagFormModal, tagFormModalApi] = useVbenModal({
  connectedComponent: TagModal,
  destroyOnClose: true,
});

function onCreate() {
  tagFormModalApi.setData(undefined).open();
}

function onEdit(row: TagDto) {
  tagFormModalApi.setData(row).open();
}

function onDelete(row: TagDto) {
  Modal.confirm({
    content: `确定删除标签【${row.name}】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除标签确认',
    async onOk() {
      await deleteTagApi(row.id);
      message.success('标签删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: TagDto;
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
      onEdit(params.row as TagDto);
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
          return await getTagsApi({
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
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
      <!-- 搜索栏 -->
      <Card :bordered="false" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索标签名称 / 编码..."
              class="w-[260px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="状态筛选"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建标签
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 标签数据列表 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗 -->
    <TagFormModal @success="refreshGrid" />
  </Page>
</template>
