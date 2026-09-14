<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ChatObjectCategoryDto, ChatObjectTypeDto } from '#/api/chat';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Button, message, Modal, Tabs } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteCategoryApi,
  deleteChatObjectTypeApi,
  getCategoryTreeApi,
  getChatObjectTypesApi,
} from '#/api/chat';

import { useCategoryColumns, useTypeColumns } from './data';
import CategoryModal from './modules/category-modal.vue';
import TypeModal from './modules/type-modal.vue';

const activeTab = ref('category');

// ==================== 1. 分类管理 ====================
const [CatModal, catModalApi] = useVbenModal({
  connectedComponent: CategoryModal,
  destroyOnClose: true,
});

function onAddCategory(parent?: ChatObjectCategoryDto) {
  catModalApi.setData({ parent: parent || null, record: null }).open();
}

function onEditCategory(record: ChatObjectCategoryDto) {
  catModalApi.setData({ parent: null, record }).open();
}

function onDeleteCategory(record: ChatObjectCategoryDto) {
  Modal.confirm({
    cancelText: '取消',
    content: `确定要删除分类【${record.name}】吗？若存在子分类请谨慎操作。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除分类确认',
    async onOk() {
      await deleteCategoryApi(record.id);
      message.success('分类删除成功');
      refreshCategoryGrid();
    },
  });
}

function onCategoryActionClick({
  code,
  row,
}: {
  code: string;
  row: ChatObjectCategoryDto;
}) {
  switch (code) {
    case 'add_child': {
      onAddCategory(row);
      break;
    }
    case 'delete': {
      onDeleteCategory(row);
      break;
    }
    case 'edit': {
      onEditCategory(row);
      break;
    }
  }
}

const [CategoryGrid, categoryGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useCategoryColumns(onCategoryActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          const list = await getCategoryTreeApi();
          return {
            items: list,
            totalCount: list.length,
          };
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      childrenField: 'children',
      parentField: 'parentId',
      rowField: 'id',
      transform: false,
    },
  } as VxeTableGridOptions,
});

function refreshCategoryGrid() {
  categoryGridApi.query();
}

// ==================== 2. 类型管理 ====================
const [TypeModalComp, typeModalApi] = useVbenModal({
  connectedComponent: TypeModal,
  destroyOnClose: true,
});

function onAddType() {
  typeModalApi.setData(null).open();
}

function onEditType(record: ChatObjectTypeDto) {
  typeModalApi.setData(record).open();
}

function onDeleteType(record: ChatObjectTypeDto) {
  Modal.confirm({
    cancelText: '取消',
    content: `确定要删除聊天对象类型【${record.name} (${record.id})】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除类型确认',
    async onOk() {
      await deleteChatObjectTypeApi(record.id);
      message.success('类型删除成功');
      refreshTypeGrid();
    },
  });
}

function onTypeActionClick({
  code,
  row,
}: {
  code: string;
  row: ChatObjectTypeDto;
}) {
  switch (code) {
    case 'delete': {
      onDeleteType(row);
      break;
    }
    case 'edit': {
      onEditType(row);
      break;
    }
  }
}

const [TypeGrid, typeGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useTypeColumns(onTypeActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getChatObjectTypesApi({
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

function refreshTypeGrid() {
  typeGridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <CatModal @success="refreshCategoryGrid" />
    <TypeModalComp @success="refreshTypeGrid" />

    <div class="h-full flex flex-col bg-background rounded-md p-3">
      <Tabs v-model:active-key="activeTab" class="flex-1 flex flex-col">
        <!-- 分类树管理 Tab -->
        <Tabs.TabPane key="category" tab="聊天对象分类管理 (ChatObject Categories)">
          <div class="h-full flex flex-col">
            <CategoryGrid>
              <template #top>
                <div class="flex items-center justify-between py-2 px-1 mb-1">
                  <div class="text-xs text-muted-foreground">
                    维护聊天对象的层级分类树（如：好友分类、群分类、应用服务号分类等）
                  </div>
                  <Button type="primary" @click="() => onAddCategory()">
                    新建顶层分类
                  </Button>
                </div>
              </template>
            </CategoryGrid>
          </div>
        </Tabs.TabPane>

        <!-- 对象类型管理 Tab -->
        <Tabs.TabPane key="type" tab="聊天对象类型定义 (ChatObject Types)">
          <div class="h-full flex flex-col">
            <TypeGrid>
              <template #top>
                <div class="flex items-center justify-between py-2 px-1 mb-1">
                  <div class="text-xs text-muted-foreground">
                    定义基础聊天对象实体分类规范（如 Personal, Room, CustomerService 等）及层级深度限制
                  </div>
                  <Button type="primary" @click="onAddType">
                    新建对象类型
                  </Button>
                </div>
              </template>
            </TypeGrid>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Page>
</template>
