<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { SecurityLogDto } from '#/api/logmanagement';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Input } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { getCurrentUserSecurityLogsApi } from '#/api/logmanagement';
import { $t } from '#/locales';

import { useColumns } from './data';
import SecurityLogModal from './modules/security-log-modal.vue';

const actionFilter = ref('');

const [DetailModal, detailModalApi] = useVbenModal({
  connectedComponent: SecurityLogModal,
  destroyOnClose: true,
});

function onDetail(row: SecurityLogDto) {
  detailModalApi.setData(row).open();
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onDetail(params.row as SecurityLogDto);
    },
  },
  gridOptions: {
    columns: useColumns(),
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
        query: async ({ page }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getCurrentUserSecurityLogsApi({
            action: actionFilter.value || undefined,
            maxResultCount,
            skipCount,
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
    <Grid :table-title="$t('page.system.log.title', '安全审计日志')">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input.Search
            v-model:value="actionFilter"
            :placeholder="$t('page.system.log.searchPlaceholder', '按行为筛选 (如: LoginSucceeded)...')"
            allow-clear
            class="w-72"
            @search="refreshGrid"
          />
        </div>
      </template>
    </Grid>
  </Page>
</template>
