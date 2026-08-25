<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApplicationDto } from '#/api/openiddict';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteApplicationApi, getApplicationsApi } from '#/api/openiddict';
import { $t } from '#/locales';

import { useColumns } from './data';
import ApplicationModal from './modules/application-modal.vue';
import SecretModal from './modules/secret-modal.vue';

const keyword = ref('');
const clientTypeFilter = ref<string | undefined>(undefined);
const consentTypeFilter = ref<string | undefined>(undefined);

const [AppFormModal, appFormModalApi] = useVbenModal({
  connectedComponent: ApplicationModal,
  destroyOnClose: true,
});

const [SecretFormModal, secretFormModalApi] = useVbenModal({
  connectedComponent: SecretModal,
  destroyOnClose: true,
});

function onCreate() {
  appFormModalApi.setData(null).open();
}

function onEdit(row: ApplicationDto) {
  appFormModalApi.setData(row).open();
}

function onSetSecret(row: ApplicationDto) {
  secretFormModalApi.setData(row).open();
}

function onDelete(row: ApplicationDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: $t('page.openiddict.deleteConfirm', [
      row.displayName || row.clientId,
    ]),
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteApplicationApi(row.id);
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
  row: ApplicationDto;
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
    case 'set-secret': {
      onSetSecret(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as ApplicationDto);
    },
  },
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

          return await getApplicationsApi({
            clientType: clientTypeFilter.value,
            consentType: consentTypeFilter.value,
            keyword: keyword.value || undefined,
            maxResultCount,
            skipCount,
            sorting,
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
    <AppFormModal @success="refreshGrid" />
    <SecretFormModal @success="refreshGrid" />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.openiddict.title', 'OpenIddict 认证服务')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">{{
            $t('page.openiddict.applications', '客户端应用管理')
          }}</span>
        </div>
      </template>

      <!-- 第二行：左侧搜索表单，右侧操作按钮 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="keyword"
              placeholder="搜索客户端 ID 或名称..."
              allow-clear
              class="w-56"
              @search="refreshGrid"
            />
            <Select
              v-model:value="clientTypeFilter"
              placeholder="客户端类型"
              allow-clear
              class="w-36"
              :options="[
                { label: '机密 (Confidential)', value: 'confidential' },
                { label: '公共 (Public)', value: 'public' },
              ]"
              @change="refreshGrid"
            />
            <Select
              v-model:value="consentTypeFilter"
              placeholder="许可类型"
              allow-clear
              class="w-32"
              :options="[
                { label: '明确同意', value: 'explicit' },
                { label: '隐式同意', value: 'implicit' },
                { label: '系统默认', value: 'systematic' },
              ]"
              @change="refreshGrid"
            />
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="primary"
              @click="onCreate"
            >
              <Plus class="size-4 mr-1" />
              {{ $t('common.create', '新建应用') }}
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
