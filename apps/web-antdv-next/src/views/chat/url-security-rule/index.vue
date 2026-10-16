<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { UrlSecurityRuleDto } from '#/api/chat/security';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteUrlSecurityRuleApi,
  getUrlSecurityRulesApi,
  refreshUrlSecurityCacheApi,
  setUrlSecurityRuleEnabledApi,
} from '#/api/chat/security';
import { $t } from '#/locales';

import { CATEGORY_OPTIONS, LEVEL_OPTIONS, useColumns } from './data';
import BatchImportModal from './modules/batch-import-modal.vue';
import RuleModal from './modules/rule-modal.vue';
import UrlInspectorModal from './modules/url-inspector-modal.vue';

// 筛选字段
const keyword = ref('');
const selectedLevel = ref<number | undefined>(undefined);
const selectedCategory = ref<number | undefined>(undefined);
const selectedEnabled = ref<number | undefined>(undefined);
const isRefreshingCache = ref(false);

// 规则编辑/新增弹窗
const [RuleModalComp, ruleModalApi] = useVbenModal({
  connectedComponent: RuleModal,
  destroyOnClose: true,
});

// 在线检测模拟器弹窗
const [InspectorModalComp, inspectorModalApi] = useVbenModal({
  connectedComponent: UrlInspectorModal,
  destroyOnClose: true,
});

// 批量导入弹窗
const [BatchImportModalComp, batchImportModalApi] = useVbenModal({
  connectedComponent: BatchImportModal,
  destroyOnClose: true,
});

function onBatchImport() {
  batchImportModalApi.open();
}

function onCreate() {
  ruleModalApi.setData(null).open();
}

function onEdit(row: UrlSecurityRuleDto) {
  ruleModalApi.setData(row).open();
}

function onInspect() {
  inspectorModalApi.open();
}

async function onRefreshCache() {
  try {
    isRefreshingCache.value = true;
    await refreshUrlSecurityCacheApi();
    message.success('Redis 规则缓存已刷新同步');
  } catch (error) {
    console.error(error);
  } finally {
    isRefreshingCache.value = false;
  }
}

function onDelete(row: UrlSecurityRuleDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除域名安全规则【${row.host}】吗？删除后该匹配规则将立即失效。`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteUrlSecurityRuleApi(row.id);
      message.success('规则已成功删除');
      refreshGrid();
    },
  });
}

async function onToggleEnabled(row: UrlSecurityRuleDto, checked: boolean) {
  try {
    await setUrlSecurityRuleEnabledApi(row.id, checked);
    row.isEnabled = checked;
    message.success(checked ? '规则已启用' : '规则已停用');
  } catch (error) {
    console.error(error);
    refreshGrid();
  }
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: UrlSecurityRuleDto;
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
      onEdit(params.row as UrlSecurityRuleDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick, onToggleEnabled),
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
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getUrlSecurityRulesApi({
            category: selectedCategory.value,
            isEnabled:
              selectedEnabled.value === undefined
                ? undefined
                : selectedEnabled.value === 1,
            keyword: keyword.value.trim() || undefined,
            level: selectedLevel.value,
            maxResultCount,
            skipCount,
            sorting: sorting || 'creationTime desc',
          });
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <RuleModalComp @success="refreshGrid" />
    <InspectorModalComp />
    <BatchImportModalComp @success="refreshGrid" />

    <Grid>
      <!-- 面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯安全合规</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">URL 风控规则引擎</span>
        </div>
      </template>

      <!-- 顶部搜索与操作栏 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <!-- 检索过滤器 -->
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="keyword"
              placeholder="搜索域名/匹配模式/原因..."
              allow-clear
              class="w-56"
              @search="refreshGrid"
            />

            <Select
              v-model:value="selectedLevel"
              :options="LEVEL_OPTIONS"
              class="w-36"
              placeholder="安全级别"
              allow-clear
              @change="refreshGrid"
            />

            <Select
              v-model:value="selectedCategory"
              :options="CATEGORY_OPTIONS"
              class="w-36"
              placeholder="风险分类"
              allow-clear
              @change="refreshGrid"
            />

            <Select
              v-model:value="selectedEnabled"
              :options="[
                { label: '全部状态', value: undefined },
                { label: '启用中', value: 1 },
                { label: '已停用', value: 0 },
              ]"
              class="w-28"
              placeholder="状态"
              allow-clear
              @change="refreshGrid"
            />
          </div>

          <!-- 右侧动作按纽组 -->
          <div class="flex items-center gap-2 flex-wrap">
            <Button @click="onInspect">
              <span class="mr-1">🔍</span> 在线 URL 检测
            </Button>
            <Button @click="onBatchImport">
              <span class="mr-1">📥</span> 批量导入规则
            </Button>
            <Button :loading="isRefreshingCache" @click="onRefreshCache">
              <span class="mr-1">⚡</span> 刷新 Redis 缓存
            </Button>
            <Button type="primary" @click="onCreate"> + 新增安全规则 </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
