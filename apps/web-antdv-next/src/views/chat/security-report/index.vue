<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SecurityReportDto } from '#/api/chat/security';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Input, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getSecurityReportsApi } from '#/api/chat/security';

import { REPORT_STATUS_OPTIONS, useColumns } from './data';
import ReportModal from './modules/report-modal.vue';

// 检索过滤器
const keyword = ref('');
const selectedStatus = ref<number | undefined>(undefined);
const selectedTargetType = ref<string | undefined>(undefined);

const TARGET_TYPE_OPTIONS = [
  { label: '全部目标类型', value: undefined },
  { label: 'URL / 外部网页', value: 'url' },
  { label: '消息内容', value: 'message' },
  { label: '用户 / 群聊', value: 'chat_object' },
];

// 审核弹窗
const [ReportModalComp, reportModalApi] = useVbenModal({
  connectedComponent: ReportModal,
  destroyOnClose: true,
});

function onAudit(row: SecurityReportDto) {
  reportModalApi.setData(row).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: SecurityReportDto;
}) {
  if (code === 'audit') {
    onAudit(row);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onAudit(params.row as SecurityReportDto);
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
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getSecurityReportsApi({
            keyword: keyword.value.trim() || undefined,
            maxResultCount,
            skipCount,
            sorting: sorting || 'creationTime desc',
            status: selectedStatus.value,
            targetType: selectedTargetType.value,
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
    <ReportModalComp @success="refreshGrid" />

    <Grid>
      <!-- 面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯安全合规</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">违规举报处置中心</span>
        </div>
      </template>

      <!-- 顶部搜索工具栏 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="keyword"
              placeholder="搜索违规内容/举报理由/处理说明..."
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />

            <Select
              v-model:value="selectedStatus"
              :options="REPORT_STATUS_OPTIONS"
              class="w-36"
              placeholder="审核状态"
              allow-clear
              @change="refreshGrid"
            />

            <Select
              v-model:value="selectedTargetType"
              :options="TARGET_TYPE_OPTIONS"
              class="w-40"
              placeholder="目标类型"
              allow-clear
              @change="refreshGrid"
            />
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
