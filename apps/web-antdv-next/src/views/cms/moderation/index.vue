<script lang="ts" setup>
import type { ContentModerationDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import { Button, Card, RadioButton, RadioGroup, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  ContentModerationStatus,
  ContentRiskLevel,
  getModerationsApi,
  ModerationDecision,
} from '#/api/cms';

import { useColumns } from './data';
import ModerationReviewModal from './modules/moderation-review-modal.vue';

const filters = reactive<{
  decision?: ModerationDecision;
  entityType?: string;
  riskLevel?: ContentRiskLevel;
  status?: ContentModerationStatus;
}>({
  decision: undefined,
  entityType: undefined,
  riskLevel: undefined,
  status: undefined,
});

const [ReviewModal, reviewModalApi] = useVbenModal({
  connectedComponent: ModerationReviewModal,
  destroyOnClose: true,
});

function onReview(row: ContentModerationDto) {
  reviewModalApi.setData({ id: row.id }).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ContentModerationDto;
}) {
  switch (code) {
    case 'detail':
    case 'review': {
      onReview(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onReview(params.row as ContentModerationDto);
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
          return await getModerationsApi({
            decision: filters.decision,
            entityType: filters.entityType || undefined,
            maxResultCount: page.pageSize,
            riskLevel: filters.riskLevel,
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
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <RadioGroup
              v-model:value="filters.status"
              button-style="solid"
              @change="onFilterChange"
            >
              <RadioButton :value="undefined">全部状态</RadioButton>
              <RadioButton :value="ContentModerationStatus.NeedManualReview">需人工审核</RadioButton>
              <RadioButton :value="ContentModerationStatus.Rejected">违规拦截</RadioButton>
              <RadioButton :value="ContentModerationStatus.Approved">合规通过</RadioButton>
            </RadioGroup>

            <Select
              v-model:value="filters.riskLevel"
              placeholder="风险等级"
              class="w-[140px]"
              allow-clear
              :options="[
                { label: '高风险 (High)', value: ContentRiskLevel.High },
                { label: '中风险 (Medium)', value: ContentRiskLevel.Medium },
                { label: '低风险 (Low)', value: ContentRiskLevel.Low },
                { label: '无风险 (Pass)', value: ContentRiskLevel.Pass },
              ]"
              @change="onFilterChange"
            />

            <Select
              v-model:value="filters.entityType"
              placeholder="实体类型"
              class="w-[140px]"
              allow-clear
              :options="[
                { label: '文章 (Article)', value: 'Article' },
                { label: '评论 (Comment)', value: 'Comment' },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 机审数据表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 审核弹窗挂载 -->
    <ReviewModal @success="refreshGrid" />
  </Page>
</template>
