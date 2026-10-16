<script lang="ts" setup>
import type { AssetFolderDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, message, Spin, TreeSelect } from 'antdv-next';

import { batchMoveAssetsApi, getAssetFolderTreeApi } from '#/api/cms';

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const targetFolderId = ref<string | undefined>(undefined);
const assetIds = ref<string[]>([]);

const folderTreeData = ref<any[]>([]);

function buildTreeSelectData(list: AssetFolderDto[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  list.forEach((item) => {
    map.set(item.id, {
      key: item.id,
      title: `${item.name} (${item.fileCount}项)`,
      value: item.id,
      children: [],
    });
  });

  list.forEach((item) => {
    const node = map.get(item.id);
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

async function loadFolders(scope?: number) {
  try {
    const list = await getAssetFolderTreeApi({ scope });
    folderTreeData.value = [
      {
        key: '',
        title: '📁 根目录（未归档）',
        value: '',
      },
      ...buildTreeSelectData(list),
    ];
  } catch {
    folderTreeData.value = [
      { key: '', title: '📁 根目录（未归档）', value: '' },
    ];
  }
}

async function handleConfirm() {
  if (assetIds.value.length === 0) {
    message.warning('请选择需要移动的素材');
    return;
  }

  loading.value = true;
  try {
    const movedCount = await batchMoveAssetsApi({
      assetIds: assetIds.value,
      targetFolderId: targetFolderId.value || undefined,
    });
    message.success(`成功移动 ${movedCount} 个素材`);
    emit('success');
    modalApi.close();
  } catch (error: any) {
    const msg =
      error?.response?.data?.error?.message || error?.message || '移动失败';
    message.error(msg);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  onConfirm: handleConfirm,
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as
        | undefined
        | {
            assetIds: string[];
            currentFolderId?: string;
            scope?: number;
          };
      assetIds.value = data?.assetIds || [];
      targetFolderId.value = data?.currentFolderId || '';
      await loadFolders(data?.scope);
    }
  },
  title: '移动素材至文件夹',
});
</script>

<template>
  <Modal class="w-[460px]">
    <Spin :spinning="loading">
      <div class="py-2">
        <p class="text-muted-foreground mb-4 text-sm">
          已选中
          <span class="text-primary font-bold">{{ assetIds.length }}</span>
          个素材，请选择目标文件夹：
        </p>

        <Form layout="vertical">
          <FormItem label="目标文件夹" required>
            <TreeSelect
              v-model:value="targetFolderId"
              placeholder="请选择目标文件夹（选择根目录则取消归档）"
              class="w-full"
              :tree-data="folderTreeData"
              tree-default-expand-all
            />
          </FormItem>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
