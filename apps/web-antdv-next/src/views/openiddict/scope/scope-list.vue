<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ScopeDto } from '#/api/openiddict';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteScopeApi, getScopesApi } from '#/api/openiddict';
import { $t } from '#/locales';

import { useColumns } from './data';
import ScopeModal from './modules/scope-modal.vue';

const filterText = ref('');

const [ScopeFormModal, scopeFormModalApi] = useVbenModal({
  connectedComponent: ScopeModal,
  destroyOnClose: true,
});

function onCreate() {
  scopeFormModalApi.setData(null).open();
}

function onEdit(row: ScopeDto) {
  scopeFormModalApi.setData(row).open();
}

function onDelete(row: ScopeDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除权限作用域【${row.name}】吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteScopeApi(row.id);
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
  row: ScopeDto;
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
      onEdit(params.row as ScopeDto);
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
        query: async ({ page }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getScopesApi({
            filter: filterText.value || undefined,
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
    <ScopeFormModal @success="refreshGrid" />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.openiddict.title', 'OpenIddict 认证服务')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground"
            >作用域管理 (Scopes)</span
          >
        </div>
      </template>

      <!-- 第二行：左侧搜索表单，右侧操作按钮 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              :placeholder="$t('common.searchPlaceholder', '搜索作用域名称...')"
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="primary"
              v-access="['OpenIddict.Scopes', 'admin']"
              @click="onCreate"
            >
              <Plus class="size-4 mr-1" />
              新建作用域
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
