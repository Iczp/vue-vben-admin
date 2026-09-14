<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ChatObjectDto } from '#/api/chat';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, Input, message, Modal, Select, Space, TreeSelect } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  ChatObjectTypeEnums,
  deleteChatObjectApi,
  getCategoryTreeApi,
  getChatObjectsApi,
  getChatObjectTypesApi,
} from '#/api/chat';

import { useColumns } from './data';
import FormModal from './modules/form-modal.vue';
import VerifyMethodModal from './modules/verify-method-modal.vue';

const filterText = ref('');
const objectTypeFilter = ref<ChatObjectTypeEnums | undefined>(undefined);
const typeIdFilter = ref<string | undefined>(undefined);
const categoryIdFilter = ref<string | undefined>(undefined);

const categoryTree = ref<any[]>([]);
const typeOptions = ref<{ label: string; value: string }[]>([]);

const [FormModalComp, formModalApi] = useVbenModal({
  connectedComponent: FormModal,
  destroyOnClose: true,
});

const [VerifyModalComp, verifyModalApi] = useVbenModal({
  connectedComponent: VerifyMethodModal,
  destroyOnClose: true,
});

async function loadFilterOptions() {
  try {
    const [cats, types] = await Promise.all([
      getCategoryTreeApi().catch(() => []),
      getChatObjectTypesApi({ maxResultCount: 100 }).catch(() => ({
        items: [],
        totalCount: 0,
      })),
    ]);
    categoryTree.value = cats;
    typeOptions.value = (types.items || []).map((t) => ({
      label: `${t.name} (${t.id})`,
      value: t.id,
    }));
  } catch (err) {
    console.error(err);
  }
}

function onAdd() {
  formModalApi.setData(null).open();
}

function onEdit(row: ChatObjectDto) {
  formModalApi.setData(row).open();
}

function onVerifyMethod(row: ChatObjectDto) {
  verifyModalApi.setData(row).open();
}

function onDelete(row: ChatObjectDto) {
  Modal.confirm({
    cancelText: '取消',
    content: `确定要删除聊天对象【${row.name} (${row.displayName || '无昵称'})】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除聊天对象确认',
    async onOk() {
      await deleteChatObjectApi(row.id);
      message.success('聊天对象删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ChatObjectDto;
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
    case 'verify_method': {
      onVerifyMethod(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
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

          return await getChatObjectsApi({
            categoryIds: categoryIdFilter.value
              ? [categoryIdFilter.value]
              : undefined,
            chatObjectTypeId: typeIdFilter.value,
            keyword: filterText.value || undefined,
            maxResultCount,
            objectType: objectTypeFilter.value,
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

onMounted(() => {
  loadFilterOptions();
});
</script>

<template>
  <Page auto-content-height>
    <FormModalComp @success="refreshGrid" />
    <VerifyModalComp @success="refreshGrid" />

    <Grid>
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯管理</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">聊天对象管理 (ChatObjects)</span>
        </div>
      </template>

      <template #top>
        <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              placeholder="搜索账号 / 昵称 / 描述..."
              allow-clear
              class="w-56"
              @search="refreshGrid"
            />
            <Select
              v-model:value="objectTypeFilter"
              placeholder="对象类型"
              allow-clear
              class="w-36"
              :options="[
                { label: '个人号', value: ChatObjectTypeEnums.Personal },
                { label: '群聊/房间', value: ChatObjectTypeEnums.Room },
                { label: '官方服务号', value: ChatObjectTypeEnums.Official },
                { label: '订阅号', value: ChatObjectTypeEnums.Subscription },
                { label: '智能机器人', value: ChatObjectTypeEnums.Robot },
                { label: '商户店长', value: ChatObjectTypeEnums.ShopKeeper },
                { label: '商户店员', value: ChatObjectTypeEnums.ShopWaiter },
                { label: '客户', value: ChatObjectTypeEnums.Customer },
              ]"
              @change="refreshGrid"
            />
            <Select
              v-model:value="typeIdFilter"
              placeholder="类型定义"
              allow-clear
              class="w-40"
              :options="typeOptions"
              @change="refreshGrid"
            />
            <TreeSelect
              v-model:value="categoryIdFilter"
              placeholder="所属分类"
              allow-clear
              class="w-44"
              :tree-data="categoryTree"
              :field-names="{ children: 'children', label: 'name', value: 'id' }"
              tree-default-expand-all
              @change="refreshGrid"
            />
          </div>

          <Space>
            <Button type="primary" @click="onAdd">
              + 新建聊天对象
            </Button>
          </Space>
        </div>
      </template>
    </Grid>
  </Page>
</template>
