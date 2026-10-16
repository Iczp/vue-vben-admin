<script lang="ts" setup>
import type { AssetFolderDto } from '#/api/cms';

import { computed, onMounted, ref, watch } from 'vue';

import { Plus, RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Dropdown,
  message,
  Modal,
  Spin,
  Tabs,
  Tooltip,
  Tree,
} from 'antdv-next';

import {
  AssetScope,
  deleteAssetFolderAndMoveAssetsToParentApi,
  deleteAssetFolderApi,
  getAssetFolderTreeApi,
  getAssetsApi,
} from '#/api/cms';

const props = withDefaults(
  defineProps<{
    isSelector?: boolean;
  }>(),
  {
    isSelector: false,
  },
);

const emit = defineEmits<{
  createFolder: [scope: AssetScope, parentId?: string];
  editFolder: [folder: AssetFolderDto];
  select: [
    folderId: string | undefined,
    scope: AssetScope,
    folder?: AssetFolderDto,
    fullPathText?: string,
  ];
}>();

interface TreeItem {
  children?: TreeItem[];
  depth: number;
  fileCount: number;
  fullPathText: string;
  id: string;
  isCustom?: boolean;
  key: string;
  name: string;
  parentId?: string;
  raw?: AssetFolderDto;
  title: string;
  totalFileCount: number;
}

const loading = ref(false);
const activeScope = ref<AssetScope>(AssetScope.Private);
const activeScopeKey = computed({
  get: () => String(activeScope.value),
  set: (val: string) => {
    activeScope.value = Number(val) as AssetScope;
  },
});
const selectedKeys = ref<string[]>(['__all__']);
const treeData = ref<TreeItem[]>([]);
const folderList = ref<AssetFolderDto[]>([]);

function computeFullPathText(
  item: AssetFolderDto,
  mapById: Map<string, AssetFolderDto>,
): string {
  const parts: string[] = [];
  let cur: AssetFolderDto | undefined = item;
  let guard = 0;
  while (cur && guard < 20) {
    parts.unshift(cur.name);
    cur = cur.parentId ? mapById.get(cur.parentId) : undefined;
    guard++;
  }
  return `/root/${parts.join('/')}`;
}

function buildTree(list: AssetFolderDto[]): TreeItem[] {
  const dtoMap = new Map<string, AssetFolderDto>();
  list.forEach((item) => dtoMap.set(item.id, item));

  const map = new Map<string, TreeItem>();
  const roots: TreeItem[] = [];

  list.forEach((item) => {
    const directCount = item.fileCount ?? 0;
    const totalCount = item.totalFileCount ?? directCount;
    map.set(item.id, {
      depth: item.depth,
      fileCount: directCount,
      fullPathText: computeFullPathText(item, dtoMap),
      id: item.id,
      isCustom: true,
      key: item.id,
      name: item.name,
      parentId: item.parentId,
      raw: item,
      title: `📁 ${item.name}`,
      totalFileCount: totalCount,
      children: [],
    });
  });

  list.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  // 如果后端未返回 totalFileCount，前端兜底自底向上递归汇总一次
  function sumDescendants(node: TreeItem): number {
    if (!node.children || node.children.length === 0) {
      node.totalFileCount = node.fileCount;
      return node.totalFileCount;
    }
    const childrenSum = node.children.reduce(
      (acc, child) => acc + sumDescendants(child),
      0,
    );
    node.totalFileCount = node.fileCount + childrenSum;
    return node.totalFileCount;
  }
  roots.forEach(sumDescendants);

  return roots;
}

function emitCurrentSelection() {
  const key = selectedKeys.value[0] || '__all__';
  if (key === '__all__') {
    emit('select', undefined, activeScope.value, undefined, '/ (全部素材)');
  } else if (key === '__root__') {
    emit('select', '', activeScope.value, undefined, '/root (未归档根目录)');
  } else {
    const dtoMap = new Map<string, AssetFolderDto>();
    folderList.value.forEach((f) => dtoMap.set(f.id, f));
    const found = dtoMap.get(key);
    if (found) {
      const pathText = computeFullPathText(found, dtoMap);
      emit('select', key, activeScope.value, found, pathText);
    } else {
      selectedKeys.value = ['__all__'];
      emit('select', undefined, activeScope.value, undefined, '/ (全部素材)');
    }
  }
}

async function loadTree() {
  loading.value = true;
  try {
    const [list, allRes, rootRes] = await Promise.all([
      getAssetFolderTreeApi({ scope: activeScope.value }),
      getAssetsApi({
        includeReferenceCount: false,
        maxResultCount: 1,
        scope: activeScope.value,
      }),
      getAssetsApi({
        folderId: '00000000-0000-0000-0000-000000000000',
        includeReferenceCount: false,
        maxResultCount: 1,
        scope: activeScope.value,
      }),
    ]);
    folderList.value = list;

    const customTree = buildTree(list);

    // 顶部固定虚拟项：全部素材、未归档素材
    const totalFiles =
      allRes?.totalCount ??
      list.reduce((sum, f) => sum + (f.fileCount || 0), 0);
    const rootFiles = rootRes?.totalCount ?? 0;

    treeData.value = [
      {
        depth: 0,
        fileCount: totalFiles,
        fullPathText: '/ (全部素材)',
        id: '__all__',
        isCustom: false,
        key: '__all__',
        name: '全部素材',
        title: '📂 全部素材',
        totalFileCount: totalFiles,
      },
      {
        depth: 0,
        fileCount: rootFiles,
        fullPathText: '/root (未归档根目录)',
        id: '__root__',
        isCustom: false,
        key: '__root__',
        name: '根目录 (未归档)',
        title: '📁 未归档素材',
        totalFileCount: rootFiles,
      },
      ...customTree,
    ];
    emitCurrentSelection();
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(activeScope, () => {
  selectedKeys.value = ['__all__'];
  loadTree();
});

function onSelectNode(keys: any[]) {
  if (keys.length === 0) return;
  const key = keys[0] as string;
  selectedKeys.value = [key];
  emitCurrentSelection();
}

function handleAddRoot() {
  emit('createFolder', activeScope.value, undefined);
}

function handleAddChild(folder: AssetFolderDto, e?: Event) {
  e?.stopPropagation();
  emit('createFolder', activeScope.value, folder.id);
}

function handleEdit(folder: AssetFolderDto, e?: Event) {
  e?.stopPropagation();
  emit('editFolder', folder);
}

function handleDeleteDirect(folder: AssetFolderDto, e?: Event) {
  e?.stopPropagation();
  Modal.confirm({
    content: `确定删除文件夹【${folder.name}】吗？删除前请确保该文件夹下无子文件夹且无素材。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除文件夹',
    async onOk() {
      try {
        await deleteAssetFolderApi(folder.id);
        message.success('文件夹删除成功');
        selectedKeys.value = ['__all__'];
        await loadTree();
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message || error?.message || '删除失败';
        message.error(msg);
      }
    },
  });
}

function handleDeleteAndMoveToParent(folder: AssetFolderDto, e?: Event) {
  e?.stopPropagation();
  Modal.confirm({
    content: `确定删除文件夹【${folder.name}】并将其中素材自动移到上一级目录吗？（有子文件夹时仍无法删除）`,
    okText: '移出并删除',
    okType: 'danger',
    title: '安全删除文件夹',
    async onOk() {
      try {
        await deleteAssetFolderAndMoveAssetsToParentApi(folder.id);
        message.success('已清空并删除该文件夹');
        selectedKeys.value = ['__all__'];
        await loadTree();
      } catch (error: any) {
        const msg =
          error?.response?.data?.error?.message || error?.message || '操作失败';
        message.error(msg);
      }
    },
  });
}

defineExpose({
  deleteFolder: handleDeleteDirect,
  deleteFolderAndMove: handleDeleteAndMoveToParent,
  reload: loadTree,
});

onMounted(() => {
  loadTree();
});
</script>

<template>
  <Card
    variant="borderless"
    class="h-full flex flex-col shadow-sm select-none"
    :styles="{
      body: {
        padding: '12px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      },
    }"
  >
    <!-- Scope 切换选项卡 -->
    <div class="shrink-0 mb-3">
      <Tabs
        v-model:active-key="activeScopeKey"
        size="small"
        class="w-full"
        :items="[
          { key: String(AssetScope.Private), label: '我的私有' },
          { key: String(AssetScope.Tenant), label: '租户公共' },
        ]"
      />

      <div class="flex items-center justify-between mt-2">
        <span
          class="text-xs font-semibold text-muted-foreground uppercase tracking-wider"
        >
          目录导航
        </span>
        <div class="flex items-center gap-1">
          <Button
            v-if="!props.isSelector"
            type="primary"
            ghost
            size="small"
            class="!text-xs !px-2"
            title="新建根目录"
            @click="handleAddRoot"
          >
            <template #icon><Plus class="size-3.5 mr-0.5" /></template>
            新建目录
          </Button>
          <Button type="text" size="small" title="刷新树" @click="loadTree">
            <template #icon><RotateCw class="size-3.5" /></template>
          </Button>
        </div>
      </div>
    </div>

    <!-- 树目录展示区 -->
    <div class="flex-1 min-h-0 overflow-y-auto">
      <Spin :spinning="loading">
        <Tree
          v-if="treeData.length > 0"
          v-model:selected-keys="selectedKeys"
          :tree-data="treeData"
          block-node
          default-expand-all
          @select="onSelectNode"
        >
          <template #titleRender="node">
            <Dropdown
              :disabled="!node.raw || props.isSelector"
              :menu="{
                items: [
                  {
                    key: 'add',
                    label: '➕ 新建子文件夹',
                  },
                  {
                    key: 'edit',
                    label: '✏️ 重命名 / 编辑',
                  },
                  {
                    type: 'divider',
                  },
                  {
                    key: 'del',
                    label: '🗑️ 删除空文件夹',
                    danger: true,
                  },
                  {
                    key: 'del_move',
                    label: '📦 删除并移出素材到父级',
                    danger: true,
                  },
                ],
                onClick: ({ key }) => {
                  if (key === 'add') handleAddChild(node.raw);
                  else if (key === 'edit') handleEdit(node.raw);
                  else if (key === 'del') handleDeleteDirect(node.raw);
                  else if (key === 'del_move')
                    handleDeleteAndMoveToParent(node.raw);
                },
              }"
              :trigger="props.isSelector ? [] : ['contextmenu']"
            >
              <div
                class="flex items-center justify-between group py-0.5 pr-1 w-full"
              >
                <span
                  class="truncate text-sm"
                  :title="node.fullPathText || node.title"
                >
                  {{ node.title }}
                </span>

                <div class="flex items-center gap-1 shrink-0 ml-1">
                  <!-- 鼠标悬停快捷操作按钮（非选择器管理模式显示：新建子级 / 编辑 / 删除） -->
                  <div
                    v-if="node.raw && !props.isSelector"
                    class="hidden group-hover:flex items-center gap-0.5 bg-background/90 rounded px-0.5 shadow-xs"
                    @click.stop
                  >
                    <span
                      class="px-1 py-0.5 text-xs hover:text-primary cursor-pointer rounded hover:bg-muted"
                      title="新建子文件夹"
                      @click.stop="handleAddChild(node.raw, $event)"
                    >
                      ➕
                    </span>
                    <span
                      class="px-1 py-0.5 text-xs hover:text-primary cursor-pointer rounded hover:bg-muted"
                      title="编辑/重命名文件夹"
                      @click.stop="handleEdit(node.raw, $event)"
                    >
                      ✏️
                    </span>
                    <Dropdown
                      :menu="{
                        items: [
                          {
                            key: 'del',
                            label: '🗑️ 直接删除空文件夹',
                            danger: true,
                          },
                          {
                            key: 'del_move',
                            label: '📦 删除并移出素材到父级',
                            danger: true,
                          },
                        ],
                        onClick: ({ key }) => {
                          if (key === 'del') handleDeleteDirect(node.raw);
                          else if (key === 'del_move')
                            handleDeleteAndMoveToParent(node.raw);
                        },
                      }"
                      :trigger="['click']"
                    >
                      <span
                        class="px-1 py-0.5 text-xs hover:text-destructive cursor-pointer rounded hover:bg-muted"
                        title="删除文件夹"
                        @click.stop
                      >
                        🗑️
                      </span>
                    </Dropdown>
                  </div>

                  <!-- 文件数量徽标：区分直属文件数与含子目录汇总数 -->
                  <Tooltip
                    v-if="node.raw"
                    :title="
                      node.totalFileCount > node.fileCount
                        ? `当前目录直属: ${node.fileCount} 个 | 含子文件夹共: ${node.totalFileCount} 个`
                        : `当前目录文件: ${node.fileCount} 个`
                    "
                  >
                    <span
                      class="text-xs px-1.5 py-0.2 rounded-full font-mono"
                      :class="
                        node.totalFileCount > 0
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'bg-muted text-muted-foreground'
                      "
                    >
                      {{
                        node.totalFileCount > node.fileCount
                          ? `${node.fileCount} / ${node.totalFileCount}`
                          : node.fileCount || 0
                      }}
                    </span>
                  </Tooltip>
                  <span
                    v-else
                    class="text-xs text-muted-foreground px-1.5 py-0.2 rounded-full bg-muted font-mono"
                  >
                    {{ node.totalFileCount || 0 }}
                  </span>
                </div>
              </div>
            </Dropdown>
          </template>
        </Tree>
      </Spin>
    </div>
  </Card>
</template>
