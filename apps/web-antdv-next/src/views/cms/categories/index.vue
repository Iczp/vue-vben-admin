<script lang="ts" setup>
import type { CategoryDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteCategoryApi, getCategoriesApi } from '#/api/cms';

import { useColumns } from './data';
import CategoryModal from './modules/category-modal.vue';

const filters = reactive<{
  activeFilter?: number;
  keyword: string;
}>({
  activeFilter: undefined,
  keyword: '',
});

const [CatModal, catModalApi] = useVbenModal({
  connectedComponent: CategoryModal,
  destroyOnClose: true,
});

function onAddRoot() {
  catModalApi.setData({}).open();
}

function onAddChild(parent: CategoryDto) {
  catModalApi.setData({ parentId: parent.id }).open();
}

function onEdit(row: CategoryDto) {
  catModalApi.setData({ record: row }).open();
}

function onDelete(row: CategoryDto) {
  Modal.confirm({
    content: `确定删除分类【${row.name}】吗？删除前请确保该分类下无子栏目及文章。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除分类确认',
    async onOk() {
      await deleteCategoryApi(row.id);
      message.success('分类删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: CategoryDto;
}) {
  switch (code) {
    case 'add_child': {
      onAddChild(row);
      break;
    }
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

// 辅助函数：将扁平列表构建为树结构
function buildCategoryTree(items: CategoryDto[]): CategoryDto[] {
  const map = new Map<string, CategoryDto>();
  const roots: CategoryDto[] = [];

  items.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as CategoryDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async () => {
          const res = await getCategoriesApi({
            isActive:
              filters.activeFilter === undefined
                ? undefined
                : filters.activeFilter === 1,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: 500,
          });
          const treeData = buildCategoryTree(res.items || []);
          return {
            items: treeData,
            totalCount: (res.items || []).length,
          };
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      childrenField: 'children',
      rowField: 'id',
      transform: false,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 搜索栏 -->
      <Card variant="borderless" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索分类名称 / 编码..."
              class="w-[260px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.activeFilter"
              placeholder="状态筛选"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onAddRoot">
              <template #icon><Plus class="size-4" /></template>
              新增顶级分类
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 树形表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗 -->
    <CatModal @success="refreshGrid" />
  </Page>
</template>
