<script lang="ts" setup>
import type {
  SensitiveWordSourceDto,
  SensitiveWordSourceType,
} from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  checkSensitiveWordSourceApi,
  deleteSensitiveWordSourceApi,
  disableSensitiveWordSourceApi,
  enableSensitiveWordSourceApi,
  getSensitiveWordSourcesApi,
  initializeDefaultSourcesApi,
  syncSensitiveWordSourceApi,
} from '#/api/cms';

import { sourceTypeOptions, useColumns } from './data';
import MappingModal from './modules/mapping-modal.vue';
import SnapshotModal from './modules/snapshot-modal.vue';
import SourceModal from './modules/source-modal.vue';

const filters = reactive<{
  enabledFilter?: number;
  keyword: string;
  sourceType?: SensitiveWordSourceType;
}>({
  enabledFilter: undefined,
  keyword: '',
  sourceType: undefined,
});

const [SourceFormModal, sourceFormModalApi] = useVbenModal({
  connectedComponent: SourceModal,
  destroyOnClose: true,
});

const [SnapshotListModal, snapshotListModalApi] = useVbenModal({
  connectedComponent: SnapshotModal,
  destroyOnClose: true,
});

const [MappingProfileModal, mappingProfileModalApi] = useVbenModal({
  connectedComponent: MappingModal,
  destroyOnClose: true,
});

function onCreate() {
  sourceFormModalApi.setData(undefined).open();
}

function onOpenMappingProfile() {
  mappingProfileModalApi.setData(undefined).open();
}

function onEdit(row: SensitiveWordSourceDto) {
  sourceFormModalApi.setData(row).open();
}

function onViewSnapshots(row: SensitiveWordSourceDto) {
  snapshotListModalApi.setData(row).open();
}

async function onCheckUpdate(row: SensitiveWordSourceDto) {
  try {
    message.loading({
      content: `正在检查数据源【${row.name}】更新...`,
      key: 'check-source',
    });
    const res = await checkSensitiveWordSourceApi(row.id);
    if (res.hasChanges) {
      Modal.info({
        content: `检测到版本更新：${res.latestVersion || '有新提交'}。${res.message || '您可以点击【同步】生成审查批次并合并词库。'}`,
        okText: '知道了',
        title: '外部数据源有新更新',
      });
    } else {
      message.success({
        content: `【${row.name}】已是最新状态，无更新。`,
        key: 'check-source',
      });
    }
    refreshGrid();
  } catch (error: any) {
    message.error({
      content: `检查更新失败: ${error?.message || error}`,
      key: 'check-source',
    });
  }
}

async function onSync(row: SensitiveWordSourceDto) {
  Modal.confirm({
    content: `确认拉取并同步【${row.name}】词库吗？系统将生成一个待审查批次（Diff Review Batch）。`,
    okText: '立即同步',
    title: '触发词库同步',
    async onOk() {
      try {
        message.loading({
          content: '正在同步外部词库并计算差异...',
          key: 'sync-source',
        });
        const batchId = await syncSensitiveWordSourceApi(row.id);
        message.success({
          content: `同步任务已触发，成功生成审查批次（ID: ${batchId ? batchId.slice(0, 8) : 'NEW'}），请前往【同步批次】查看详情与审核差异。`,
          duration: 5,
          key: 'sync-source',
        });
        refreshGrid();
      } catch (error: any) {
        message.error({
          content: `同步失败: ${error?.message || error}`,
          key: 'sync-source',
        });
      }
    },
  });
}

async function onToggleStatus(row: SensitiveWordSourceDto) {
  try {
    if (row.isEnabled) {
      await disableSensitiveWordSourceApi(row.id);
      message.success(`已禁用数据源【${row.name}】`);
    } else {
      await enableSensitiveWordSourceApi(row.id);
      message.success(`已启用数据源【${row.name}】`);
    }
    refreshGrid();
  } catch (error) {
    console.error('切换状态失败', error);
  }
}

function onDelete(row: SensitiveWordSourceDto) {
  Modal.confirm({
    content: `确定删除外部词库数据源【${row.name}】吗？删除后该数据源的历史快照及关联配置可能无法恢复。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除数据源确认',
    async onOk() {
      await deleteSensitiveWordSourceApi(row.id);
      message.success('数据源删除成功');
      refreshGrid();
    },
  });
}

function onInitDefaults() {
  Modal.confirm({
    content:
      '系统将初始化推荐的开源主流词库（如 GitHub Sensitive-lexicon / 政府暴恐政敏库等预设数据源）。若已存在相同编码则跳过。确定初始化吗？',
    okText: '确认初始化',
    title: '初始化推荐开源词库',
    async onOk() {
      try {
        await initializeDefaultSourcesApi();
        message.success('已完成推荐开源词库初始化');
        refreshGrid();
      } catch (error: any) {
        message.error(`初始化失败: ${error?.message || error}`);
      }
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SensitiveWordSourceDto;
}) {
  switch (code) {
    case 'check': {
      void onCheckUpdate(row);
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
    case 'snapshots': {
      onViewSnapshots(row);
      break;
    }
    case 'sync': {
      void onSync(row);
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
      onEdit(params.row as SensitiveWordSourceDto);
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
          return await getSensitiveWordSourcesApi({
            filter: filters.keyword.trim() || undefined,
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
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
      <Card
        variant="borderless"
        class="shrink-0 shadow-sm"
        :body-style="{ padding: '12px 16px' }"
      >
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索编码 / 名称 / 源地址..."
              class="w-[240px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.sourceType"
              placeholder="数据源类型"
              class="w-[160px]"
              allow-clear
              :options="sourceTypeOptions"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="启停状态"
              class="w-[110px]"
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
              新建数据源
            </Button>
            <Button @click="onInitDefaults"> 初始化开源词库 </Button>
            <Button @click="onOpenMappingProfile"> 配置分类映射 </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 列表主体 -->
      <div
        class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2"
      >
        <Grid />
      </div>
    </div>

    <!-- 弹窗挂载 -->
    <SourceFormModal @success="refreshGrid" />
    <SnapshotListModal />
    <MappingProfileModal @success="refreshGrid" />
  </Page>
</template>
