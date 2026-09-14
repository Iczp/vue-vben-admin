<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { EntryNameDto, EntryValueDto } from '#/api/chat';

import { nextTick, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Empty,
  message,
  Modal,
  Spin,
  Tag,
  Tree,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteEntryNameApi,
  deleteEntryValueApi,
  getEntryNameTreeApi,
  getEntryValuesApi,
} from '#/api/chat';

import { useValueColumns } from './data';
import EntryNameModal from './modules/entry-name-modal.vue';
import EntryValueModal from './modules/entry-value-modal.vue';

// ==================== 1. 左侧字典键树 (EntryName) ====================
const treeLoading = ref(false);
const treeData = ref<EntryNameDto[]>([]);
const selectedEntryName = ref<EntryNameDto | null>(null);
const selectedKeys = ref<string[]>([]);

const [NameModalComp, nameModalApi] = useVbenModal({
  connectedComponent: EntryNameModal,
  destroyOnClose: true,
});

async function fetchTree() {
  try {
    treeLoading.value = true;
    const list = await getEntryNameTreeApi();
    treeData.value = list;
    // 若当前无选中或被删，默认选中第一个
    if (!selectedEntryName.value && list.length > 0 && list[0]) {
      selectedEntryName.value = list[0];
      selectedKeys.value = [list[0].id];
    }
  } finally {
    treeLoading.value = false;
  }
}

function refreshValueGrid() {
  nextTick(() => {
    try {
      valueGridApi?.query?.();
    } catch (e) {
      console.warn('Grid query failed or not mounted yet', e);
    }
  });
}

function findNodeById(nodes: EntryNameDto[], id: string): EntryNameDto | null {
  for (const item of nodes) {
    if (item.id === id) return item;
    if (item.children && item.children.length > 0) {
      const found = findNodeById(item.children, id);
      if (found) return found;
    }
  }
  return null;
}

function onTreeSelect(keys: any[], info: any) {
  if (keys.length > 0) {
    const key = keys[0];
    const node = info?.node?.dataRef || info?.node || findNodeById(treeData.value, key);
    if (node) {
      selectedEntryName.value = node;
      selectedKeys.value = [key];
      refreshValueGrid();
    }
  }
}

function onAddName(parent?: EntryNameDto) {
  nameModalApi.setData({ parent: parent || null, record: null }).open();
}

function onEditName(record: EntryNameDto) {
  nameModalApi.setData({ parent: null, record }).open();
}

function onDeleteName(record: EntryNameDto) {
  Modal.confirm({
    cancelText: '取消',
    content: `确定要删除字典键【${record.name}】吗？若存在字典项也将受到影响。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除字典键确认',
    async onOk() {
      await deleteEntryNameApi(record.id);
      message.success('字典键已删除');
      if (selectedEntryName.value?.id === record.id) {
        selectedEntryName.value = null;
      }
      fetchTree();
    },
  });
}

// ==================== 2. 右侧字典项 (EntryValue) ====================
const [ValueModalComp, valueModalApi] = useVbenModal({
  connectedComponent: EntryValueModal,
  destroyOnClose: true,
});

function onAddValue() {
  if (!selectedEntryName.value) {
    message.warning('请先在左侧选择一个字典分类/键');
    return;
  }
  valueModalApi
    .setData({
      entryName: {
        id: selectedEntryName.value.id,
        name: selectedEntryName.value.name,
      },
      record: null,
    })
    .open();
}

function onEditValue(record: EntryValueDto) {
  valueModalApi.setData({ record }).open();
}

function onDeleteValue(record: EntryValueDto) {
  Modal.confirm({
    cancelText: '取消',
    content: `确定要删除字典项【${record.name} (${record.value})】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除字典项确认',
    async onOk() {
      await deleteEntryValueApi(record.id);
      message.success('字典项已删除');
      refreshValueGrid();
    },
  });
}

function onValueActionClick({
  code,
  row,
}: {
  code: string;
  row: EntryValueDto;
}) {
  switch (code) {
    case 'delete': {
      onDeleteValue(row);
      break;
    }
    case 'edit': {
      onEditValue(row);
      break;
    }
  }
}

const [ValueGrid, valueGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useValueColumns(onValueActionClick),
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
          if (!selectedEntryName.value) {
            return { items: [], totalCount: 0 };
          }
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getEntryValuesApi({
            entryNameId: selectedEntryName.value.id,
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

onMounted(() => {
  fetchTree();
});
</script>

<template>
  <Page auto-content-height>
    <NameModalComp @success="fetchTree" />
    <ValueModalComp @success="refreshValueGrid" />

    <div class="h-full flex gap-3">
      <!-- 左侧：字典键/分类树 -->
      <Card
        size="small"
        class="w-80 flex flex-col shrink-0 h-full overflow-hidden"
        :styles="{ body: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '12px' } }"
      >
        <div class="flex items-center justify-between pb-2 mb-2 border-b">
          <span class="font-semibold text-sm">字典属性键树 (EntryName)</span>
          <Button size="small" type="primary" @click="() => onAddName()">
            新建顶层
          </Button>
        </div>

        <div class="flex-1 overflow-y-auto min-h-0">
          <Spin :spinning="treeLoading">
            <template v-if="treeData.length > 0">
              <Tree
                :tree-data="treeData"
                :field-names="{ children: 'children', title: 'name', key: 'id' }"
                :selected-keys="selectedKeys"
                default-expand-all
                block-node
                @select="onTreeSelect"
              >
                <template #titleRender="node: any">
                  <div class="group flex items-center justify-between py-0.5 pr-1 w-full text-xs">
                    <div class="truncate flex-1" :title="node.name">
                      <span>{{ node.name }}</span>
                      <span v-if="node.code" class="text-muted-foreground ml-1">({{ node.code }})</span>
                    </div>
                    <div class="hidden group-hover:flex items-center gap-1 shrink-0 ml-1">
                      <Button
                        size="small"
                        type="link"
                        class="p-0 h-auto text-xs"
                        @click.stop="onAddName(node.dataRef || node)"
                      >
                        +子级
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        class="p-0 h-auto text-xs"
                        @click.stop="onEditName(node.dataRef || node)"
                      >
                        编辑
                      </Button>
                      <Button
                        size="small"
                        type="link"
                        danger
                        class="p-0 h-auto text-xs"
                        @click.stop="onDeleteName(node.dataRef || node)"
                      >
                        删
                      </Button>
                    </div>
                  </div>
                </template>
              </Tree>
            </template>
            <Empty v-else description="暂无字典分类" class="mt-8" />
          </Spin>
        </div>
      </Card>

      <!-- 右侧：当前字典键详情与字典项列表 -->
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <Card size="small" class="mb-2 shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <template v-if="selectedEntryName">
                <span class="font-bold text-base">{{ selectedEntryName.name }}</span>
                <Tag v-if="selectedEntryName.code" color="blue">{{ selectedEntryName.code }}</Tag>
                <Tag v-if="selectedEntryName.isChoice" color="green">下拉选项字典</Tag>
                <Tag v-else color="default">自由文本录入</Tag>
                <span v-if="selectedEntryName.description" class="text-xs text-muted-foreground ml-2">
                  {{ selectedEntryName.description }}
                </span>
              </template>
              <span v-else class="text-muted-foreground text-sm">
                请在左侧选择一个字典属性键
              </span>
            </div>
            <Button
              v-if="selectedEntryName"
              type="primary"
              size="small"
              @click="onAddValue"
            >
              + 新增选项值
            </Button>
          </div>
        </Card>

        <div class="flex-1 min-h-0 bg-background rounded-md">
          <ValueGrid />
        </div>
      </div>
    </div>
  </Page>
</template>
