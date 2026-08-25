<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AuditLogDto } from '#/api/logmanagement';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Input, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getAuditLogsApi } from '#/api/logmanagement';
import { $t } from '#/locales';

import { useColumns } from './data';
import AuditLogDrawer from './modules/audit-log-drawer.vue';

const urlFilter = ref('');
const methodFilter = ref<string | undefined>(undefined);
const hasExceptionFilter = ref<string | undefined>(undefined);

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: AuditLogDrawer,
  destroyOnClose: true,
});

function onDetail(row: AuditLogDto) {
  detailModalApi.setData({ id: row.id }).open();
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AuditLogDto;
}) {
  if (code === 'detail') {
    onDetail(row);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onDetail(params.row as AuditLogDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 20,
      pageSizes: [10, 20, 50, 100],
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

          const hasException =
            hasExceptionFilter.value === 'true'
              ? true
              : hasExceptionFilter.value === 'false'
                ? false
                : undefined;

          return await getAuditLogsApi({
            hasException,
            httpMethod: methodFilter.value,
            maxResultCount,
            skipCount,
            sorting: sorting || 'executionTime desc',
            url: urlFilter.value || undefined,
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
    <DetailModal />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.system.title', '系统管理')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">{{
            $t('page.system.log.auditTitle', '系统审计日志与实体变更')
          }}</span>
        </div>
      </template>

      <!-- 第二行：左侧搜索表单 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="urlFilter"
              placeholder="按请求 URL 检索..."
              allow-clear
              class="w-56"
              @search="refreshGrid"
            />
            <Select
              v-model:value="methodFilter"
              placeholder="请求方法"
              allow-clear
              class="w-28"
              :options="[
                { label: 'GET', value: 'GET' },
                { label: 'POST', value: 'POST' },
                { label: 'PUT', value: 'PUT' },
                { label: 'DELETE', value: 'DELETE' },
              ]"
              @change="refreshGrid"
            />
            <Select
              v-model:value="hasExceptionFilter"
              placeholder="异常状态"
              allow-clear
              class="w-28"
              :options="[
                { label: '仅异常', value: 'true' },
                { label: '仅正常', value: 'false' },
              ]"
              @change="refreshGrid"
            />
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
