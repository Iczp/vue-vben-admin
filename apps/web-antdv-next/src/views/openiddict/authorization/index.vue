<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AuthorizationDto } from '#/api/openiddict';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteAuthorizationApi,
  getAuthorizationsApi,
} from '#/api/openiddict';
import { $t } from '#/locales';

import { useColumns } from './data';

const subjectFilter = ref('');
const statusFilter = ref<string | undefined>(undefined);

function onDelete(row: AuthorizationDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要撤销该授权记录吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteAuthorizationApi(row.id);
      message.success('授权记录已撤销');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AuthorizationDto;
}) {
  if (code === 'delete') {
    onDelete(row);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {},
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 10,
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

          return await getAuthorizationsApi({
            maxResultCount,
            skipCount,
            sorting,
            status: statusFilter.value,
            subject: subjectFilter.value || undefined,
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
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.openiddict.title', 'OpenIddict 认证服务')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground"
            >授权记录管理 (Authorizations)</span
          >
        </div>
      </template>

      <!-- 第二行：左侧搜索表单 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="subjectFilter"
              placeholder="搜索授权主体 (Subject)..."
              allow-clear
              class="w-60"
              @search="refreshGrid"
            />
            <Select
              v-model:value="statusFilter"
              placeholder="状态筛选"
              allow-clear
              class="w-32"
              :options="[
                { label: '有效 (valid)', value: 'valid' },
                { label: '已撤销 (revoked)', value: 'revoked' },
              ]"
              @change="refreshGrid"
            />
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
