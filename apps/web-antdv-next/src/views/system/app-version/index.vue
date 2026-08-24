<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { AppVersionDto } from '#/api/app-version';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, Modal, message, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteAppVersionApi, getAppVersionsApi } from '#/api/app-version';
import { $t } from '#/locales';

import { useColumns } from './data';
import VersionModal from './modules/version-modal.vue';

const filterText = ref('');
const platformFilter = ref<string | undefined>(undefined);

const [VersionFormModal, versionFormModalApi] = useVbenModal({
  connectedComponent: VersionModal,
  destroyOnClose: true,
});

function onCreate() {
  versionFormModalApi.setData(null).open();
}

function onEdit(row: AppVersionDto) {
  versionFormModalApi.setData(row).open();
}

function onDelete(row: AppVersionDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除版本【${row.platform} - ${row.version}】吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteAppVersionApi(row.id);
      message.success($t('common.deleteSuccess', '删除成功'));
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: AppVersionDto;
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

          return await getAppVersionsApi({
            keyword: filterText.value || undefined,
            maxResultCount,
            platform: platformFilter.value,
            skipCount,
            sorting: sorting || 'versionCode desc',
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
    <VersionFormModal @success="refreshGrid" />
    <Grid title="App 版本发布与升级管理">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input.Search
            v-model:value="filterText"
            :placeholder="$t('common.searchPlaceholder', '搜索版本或标题...')"
            allow-clear
            class="w-56"
            @search="refreshGrid"
          />
          <Select
            v-model:value="platformFilter"
            placeholder="平台筛选"
            allow-clear
            class="w-32"
            :options="[
              { label: 'Android', value: 'android' },
              { label: 'iOS', value: 'ios' },
              { label: 'Windows', value: 'windows' },
              { label: 'macOS', value: 'macos' },
              { label: 'Web/H5', value: 'web' },
            ]"
            @change="refreshGrid"
          />
          <Button
            type="primary"
            v-access="['Chat.AppVersion', 'admin']"
            @click="onCreate"
          >
            <Plus class="size-4 mr-1" />
            发布新版本
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
