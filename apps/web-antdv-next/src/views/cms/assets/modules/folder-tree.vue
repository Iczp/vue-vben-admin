<script lang="ts" setup>
import type { AssetFolderDto } from '#/api/cms';

import { onMounted, ref, watch } from 'vue';

import { Plus, RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Dropdown,
  Menu,
  message,
  Modal,
  Spin,
  Tabs,
  Tree,
} from 'antdv-next';

import {
  AssetScope,
  deleteAssetFolderAndMoveAssetsToParentApi,
  deleteAssetFolderApi,
  getAssetFolderTreeApi,
} from '#/api/cms';

interface TreeItem {
  children?: TreeItem[];
  depth: number;
  fileCount: number;
  id: string;
  isCustom?: boolean;
  key: string;
  name: string;
  parentId?: string;
  raw?: AssetFolderDto;
  title: string;
}

const emit = defineEmits<{
  createFolder: [scope: AssetScope, parentId?: string];
  editFolder: [folder: AssetFolderDto];
  select: [folderId: string | undefined, scope: AssetScope];
}>();

const loading = ref(false);
const activeScope = ref<AssetScope>(AssetScope.Private);
const selectedKeys = ref<string[]>(['__all__']);
const treeData = ref<TreeItem[]>([]);
const folderList = ref<AssetFolderDto[]>([]);

function buildTree(list: AssetFolderDto[]): TreeItem[] {
  const map = new Map<string, TreeItem>();
  const roots: TreeItem[] = [];

  list.forEach((item) => {
    map.set(item.id, {
      depth: item.depth,
      fileCount: item.fileCount,
      id: item.id,
      key: item.id,
      name: item.name,
      parentId: item.parentId,
      raw: item,
      title: item.name,
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

  return roots;
}

async function loadTree() {
  loading.value = true;
  try {
    const list = await getAssetFolderTreeApi({ scope: activeScope.value });
    folderList.value = list;

    const customTree = buildTree(list);

    // 顶部固定虚拟项：全部素材、未归档素材
    const totalFiles = list.reduce((sum, f) => sum + (f.fileCount || 0), 0);
    treeData.value = [
      {
        depth: 0,
        fileCount: totalFiles,
        id: '__all__',
        isCustom: false,
        key: '__all__',
        name: '全部素材',
        title: '📂 全部素材',
      },
      {
        depth: 0,
        fileCount: 0,
        id: '__root__',
        isCustom: false,
        key: '__root__',
        name: '根目录 (未归档)',
        title: '📁 未归档素材',
      },
      ...customTree,
    ];
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
}

watch(activeScope, () => {
  selectedKeys.value = ['__all__'];
  emit('select', undefined, activeScope.value);
  loadTree();
});

function onSelectNode(keys: any[]) {
  if (keys.length === 0) return;
  const key = keys[0] as string;
  selectedKeys.value = [key];

  if (key === '__all__') {
    emit('select', undefined, activeScope.value);
  } else if (key === '__root__') {
    emit('select', '', activeScope.value); // 空串代表 FolderId is null
  } else {
    emit('select', key, activeScope.value);
  }
}

function handleAddRoot() {
  emit('createFolder', activeScope.value, undefined);
}

function handleAddChild(node: TreeItem) {
  emit('createFolder', activeScope.value, node.id);
}

function handleEdit(node: TreeItem) {
  if (node.raw) {
    emit('editFolder', node.raw);
  }
}

function handleDeleteDirect(node: TreeItem) {
  Modal.confirm({
    content: `确定删除文件夹【${node.name}】吗？删除前请确保该文件夹下无子文件夹且无素材。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除文件夹',
    async onOk() {
      try {
        await deleteAssetFolderApi(node.id);
        message.success('文件夹删除成功');
        await loadTree();
        selectedKeys.value = ['__all__'];
        emit('select', undefined, activeScope.value);
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.message || '删除失败';
        message.error(msg);
      }
    },
  });
}

function handleDeleteAndMoveToParent(node: TreeItem) {
  Modal.confirm({
    content: `确定删除文件夹【${node.name}】并将其中素材自动移到上一级目录吗？（有子文件夹时仍无法删除）`,
    okText: '移出并删除',
    okType: 'danger',
    title: '安全删除文件夹',
    async onOk() {
      try {
        await deleteAssetFolderAndMoveAssetsToParentApi(node.id);
        message.success('已清空并删除该文件夹');
        await loadTree();
        selectedKeys.value = ['__all__'];
        emit('select', undefined, activeScope.value);
      } catch (err: any) {
        const msg = err?.response?.data?.error?.message || err?.message || '操作失败';
        message.error(msg);
      }
    },
  });
}

defineExpose({
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
    :styles="{ body: { padding: '12px', height: '100%', display: 'flex', flexDirection: 'column' } }"
  >
    <!-- Scope 切换选项卡 -->
    <div class="shrink-0 mb-3">
      <Tabs
        v-model:activeKey="activeScope"
        size="small"
        class="w-full"
        :items="[
          { key: AssetScope.Private, label: '我的私有' },
          { key: AssetScope.Tenant, label: '租户公共' },
        ]"
      />

      <div class="flex items-center justify-between mt-2">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          目录导航
        </span>
        <div class="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            title="新建根目录"
            @click="handleAddRoot"
          >
            <template #icon><Plus class="size-3.5" /></template>
          </Button>
          <Button
            type="text"
            size="small"
            title="刷新树"
            @click="loadTree"
          >
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
          v-model:selectedKeys="selectedKeys"
          :tree-data="treeData"
          block-node
          default-expand-all
          @select="onSelectNode"
        >
          <template #title="node">
            <Dropdown :trigger="['contextmenu']">
              <div class="flex items-center justify-between group py-0.5 pr-1">
                <span class="truncate text-sm" :title="node.title">
                  {{ node.title }}
                </span>
                <span
                  v-if="node.raw"
                  class="text-xs text-muted-foreground px-1.5 py-0.2 rounded-full bg-muted shrink-0 ml-1 font-mono"
                >
                  {{ node.fileCount || 0 }}
                </span>
              </div>

              <!-- 右键菜单仅对自定义文件夹生效 -->
              <template #overlay>
                <Menu v-if="node.raw">
                  <Menu.Item key="add" @click="handleAddChild(node)">
                    ➕ 新建子文件夹
                  </Menu.Item>
                  <Menu.Item key="edit" @click="handleEdit(node)">
                    ✏️ 重命名 / 编辑
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Item key="del" danger @click="handleDeleteDirect(node)">
                    🗑️ 删除空文件夹
                  </Menu.Item>
                  <Menu.Item key="del_move" danger @click="handleDeleteAndMoveToParent(node)">
                    📦 删除并移出素材到父级
                  </Menu.Item>
                </Menu>
                <div v-else class="hidden" />
              </template>
            </Dropdown>
          </template>
        </Tree>
      </Spin>
    </div>
  </Card>
</template>
