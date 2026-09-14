<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { InvitationCodeDto } from '#/api/chat/invitation-code';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteInvitationCodeApi,
  getInvitationCodesApi,
} from '#/api/chat/invitation-code';
import { $t } from '#/locales';

import { useColumns } from './data';
import InvitationCodeModal from './modules/invitation-code-modal.vue';

const filterText = ref('');

const [CodeFormModal, codeFormModalApi] = useVbenModal({
  connectedComponent: InvitationCodeModal,
  destroyOnClose: true,
});

function onCreate() {
  codeFormModalApi.setData(null).open();
}

function onEdit(row: InvitationCodeDto) {
  codeFormModalApi.setData(row).open();
}

function onDelete(row: InvitationCodeDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除邀请码【${row.title}】(${row.id}) 吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteInvitationCodeApi(row.id);
      message.success('邀请码已删除');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: InvitationCodeDto;
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
      onEdit(params.row as InvitationCodeDto);
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

          return await getInvitationCodesApi({
            keyword: filterText.value || undefined,
            maxResultCount,
            skipCount,
            sorting: sorting || 'creationTime desc',
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
    <CodeFormModal @success="refreshGrid" />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯管理</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">邀请码管理</span>
        </div>
      </template>

      <!-- 搜索与创建工具栏 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              placeholder="搜索邀请码标题或 ID..."
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />
          </div>
          <div>
            <Button type="primary" @click="onCreate">
              + 生成新邀请码
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
