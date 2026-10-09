<script lang="ts" setup>
import type { SensitiveWordDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Download, Inbox, Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteSensitiveWordApi,
  disableSensitiveWordApi,
  enableSensitiveWordApi,
  exportSensitiveWordsApi,
  getSensitiveWordsApi,
  type ModerationScene,
  type SensitiveRiskLevel,
} from '#/api/cms';

import { categoryOptions, riskLevelOptions, sceneOptions, useColumns } from './data';
import ImportModal from './modules/import-modal.vue';
import WordModal from './modules/word-modal.vue';

const filters = reactive<{
  category?: string;
  enabledFilter?: number;
  keyword: string;
  riskLevel?: SensitiveRiskLevel;
  scene?: ModerationScene;
}>({
  category: undefined,
  enabledFilter: undefined,
  keyword: '',
  riskLevel: undefined,
  scene: undefined,
});

const [WordFormModal, wordFormModalApi] = useVbenModal({
  connectedComponent: WordModal,
  destroyOnClose: true,
});

const [WordImportModal, wordImportModalApi] = useVbenModal({
  connectedComponent: ImportModal,
  destroyOnClose: true,
});

function onCreate() {
  wordFormModalApi.setData(undefined).open();
}

function onImport() {
  wordImportModalApi.open();
}

function onEdit(row: SensitiveWordDto) {
  wordFormModalApi.setData(row).open();
}

async function onToggleStatus(row: SensitiveWordDto) {
  try {
    if (row.isEnabled) {
      await disableSensitiveWordApi(row.id);
      message.success(`已禁用敏感词【${row.word}】`);
    } else {
      await enableSensitiveWordApi(row.id);
      message.success(`已启用敏感词【${row.word}】`);
    }
    refreshGrid();
  } catch (error) {
    console.error('切换状态失败', error);
  }
}

function onDelete(row: SensitiveWordDto) {
  Modal.confirm({
    content: `确定删除敏感词【${row.word}】吗？删除后该规则将不再参与文本审核拦截。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除敏感词确认',
    async onOk() {
      await deleteSensitiveWordApi(row.id);
      message.success('敏感词删除成功');
      refreshGrid();
    },
  });
}

async function onExport() {
  try {
    const list = await exportSensitiveWordsApi({
      category: filters.category,
      isEnabled:
        filters.enabledFilter === undefined
          ? undefined
          : filters.enabledFilter === 1,
      keyword: filters.keyword.trim() || undefined,
      maxResultCount: 10000,
      riskLevel: filters.riskLevel,
      scene: filters.scene,
    });

    if (!list || list.length === 0) {
      message.warning('没有可导出的敏感词数据');
      return;
    }

    const headers = ['关键词', '风险分类', '风险等级', '处置动作', '生效场景', '状态', '备注'];
    const rows = list.map((item) => [
      `"${item.word.replace(/"/g, '""')}"`,
      `"${item.category}"`,
      `"${item.riskLevel}"`,
      `"${item.action}"`,
      `"${item.scene || '全局通用'}"`,
      item.isEnabled ? '启用' : '禁用',
      `"${(item.remark || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = `\uFEFF${[headers.join(','), ...rows.map((r) => r.join(','))].join('\n')}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SensitiveWords_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success(`成功导出 ${list.length} 条敏感词`);
  } catch (error) {
    console.error('导出失败', error);
    message.error('导出失败');
  }
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SensitiveWordDto;
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
      onEdit(params.row as SensitiveWordDto);
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
          return await getSensitiveWordsApi({
            category: filters.category,
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            riskLevel: filters.riskLevel,
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
              placeholder="搜索词条 / 备注..."
              class="w-[200px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.category"
              placeholder="全部风险分类"
              class="w-[180px]"
              allow-clear
              :options="categoryOptions"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.riskLevel"
              placeholder="风险等级"
              class="w-[150px]"
              allow-clear
              :options="riskLevelOptions"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.scene"
              placeholder="生效场景"
              class="w-[160px]"
              allow-clear
              :options="sceneOptions"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="启用状态"
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
              新建词条
            </Button>
            <Button @click="onImport">
              <template #icon><Inbox class="size-4" /></template>
              批量导入
            </Button>
            <Button @click="onExport">
              <template #icon><Download class="size-4" /></template>
              导出
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 敏感词数据列表 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗挂载 -->
    <WordFormModal @success="refreshGrid" />
    <WordImportModal @success="refreshGrid" />
  </Page>
</template>
