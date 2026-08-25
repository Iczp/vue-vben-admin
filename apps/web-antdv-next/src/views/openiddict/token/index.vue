<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TokenDto } from '#/api/openiddict';

import { ref } from 'vue';

import { Page } from '@vben/common-ui';

import { Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTokenApi, getTokensApi } from '#/api/openiddict';
import { $t } from '#/locales';

import { useColumns } from './data';

const subjectFilter = ref('');
const statusFilter = ref<string | undefined>(undefined);

function onDelete(row: TokenDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要撤销该访问令牌 (Token) 吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteTokenApi(row.id);
      message.success('令牌已成功撤销');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: TokenDto;
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

          return await getTokensApi({
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
    <Grid title="OpenIddict 令牌管理 (Tokens)">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input.Search
            v-model:value="subjectFilter"
            placeholder="搜索令牌主体 (Subject)..."
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
              { label: '已过期 (expired)', value: 'expired' },
            ]"
            @change="refreshGrid"
          />
        </div>
      </template>
    </Grid>
  </Page>
</template>
