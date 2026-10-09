<script lang="ts" setup>
import type { SensitiveWordWhitelistDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSensitiveWordWhitelistApi,
  disableSensitiveWordWhitelistApi,
  enableSensitiveWordWhitelistApi,
  getSensitiveWordWhitelistsApi,
  type ModerationScene,
} from '#/api/cms';

import { sceneOptions } from '../sensitive-words/data';
import { useColumns } from './data';
import WhitelistModal from './modules/whitelist-modal.vue';

const filters = reactive<{
  enabledFilter?: number;
  keyword: string;
  scene?: ModerationScene;
}>({
  enabledFilter: undefined,
  keyword: '',
  scene: undefined,
});

const [WhitelistFormModal, whitelistFormModalApi] = useVbenModal({
  connectedComponent: WhitelistModal,
  destroyOnClose: true,
});

function onCreate() {
  whitelistFormModalApi.setData(undefined).open();
}

function onEdit(row: SensitiveWordWhitelistDto) {
  whitelistFormModalApi.setData(row).open();
}

async function onToggleStatus(row: SensitiveWordWhitelistDto) {
  try {
    if (row.isEnabled) {
      await disableSensitiveWordWhitelistApi(row.id);
      message.success(`已禁用白名单【${row.text}】`);
    } else {
      await enableSensitiveWordWhitelistApi(row.id);
      message.success(`已启用白名单【${row.text}】`);
    }
    refreshGrid();
  } catch (error) {
    console.error('切换状态失败', error);
  }
}

function onDelete(row: SensitiveWordWhitelistDto) {
  Modal.confirm({
    content: `确定删除白名单【${row.text}】吗？删除后包含该术语的文本将恢复正常敏感词命中规则。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除白名单确认',
    async onOk() {
      await deleteSensitiveWordWhitelistApi(row.id);
      message.success('白名单删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SensitiveWordWhitelistDto;
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
    case 'toggle': {
      void onToggleStatus(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as SensitiveWordWhitelistDto);
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
          return await getSensitiveWordWhitelistsApi({
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            scene: filters.scene,
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
      <!-- 过滤搜索栏 -->
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索加白文本 / 说明..."
              class="w-[240px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.scene"
              placeholder="生效场景"
              class="w-[180px]"
              allow-clear
              :options="sceneOptions"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="启用状态"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '启用', value: 1 },
                { label: '禁用', value: 0 },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建白名单
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 白名单数据列表 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗挂载 -->
    <WhitelistFormModal @success="refreshGrid" />
  </Page>
</template>
