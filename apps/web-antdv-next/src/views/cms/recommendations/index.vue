<script lang="ts" setup>
import type { RecommendationRuleDto } from '#/api/cms';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRecommendationRuleApi,
  getRecommendationRulesApi,
} from '#/api/cms';

import { useColumns } from './data';
import RuleModal from './modules/rule-modal.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RuleModal,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(undefined).open();
}

function onEdit(row: RecommendationRuleDto) {
  formModalApi.setData(row).open();
}

function onDelete(row: RecommendationRuleDto) {
  Modal.confirm({
    content: `确定要删除推荐规则【${row.name}】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除规则确认',
    async onOk() {
      await deleteRecommendationRuleApi(row.id);
      message.success('规则删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: RecommendationRuleDto;
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
      onEdit(params.row as RecommendationRuleDto);
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
          return await getRecommendationRulesApi({
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
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 顶部操作栏 -->
      <Card :bordered="false" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium">推荐策略与算法特征规则引擎</div>
          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建规则
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 规则列表表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗 -->
    <FormModal @success="refreshGrid" />
  </Page>
</template>
