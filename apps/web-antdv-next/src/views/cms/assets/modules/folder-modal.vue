<script lang="ts" setup>
import type { AssetFolderDto } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, Input, InputNumber, message, Spin, TreeSelect } from 'antdv-next';

import {
  createAssetFolderApi,
  getAssetFolderTreeApi,
  updateAssetFolderApi,
} from '#/api/cms';

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const isEdit = ref(false);
const recordId = ref<string>('');

const formData = reactive<{
  description?: string;
  name: string;
  parentId?: string;
  scope?: number;
  sorting: number;
}>({
  description: '',
  name: '',
  parentId: undefined,
  scope: undefined,
  sorting: 0,
});

const folderTreeData = ref<any[]>([]);

function buildTreeSelectData(
  list: AssetFolderDto[],
  disabledId?: string,
): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  list.forEach((item) => {
    map.set(item.id, {
      disabled: item.id === disabledId,
      key: item.id,
      title: item.name,
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

async function loadTreeSelect(scope?: number, excludeId?: string) {
  try {
    const list = await getAssetFolderTreeApi({ scope });
    folderTreeData.value = [
      {
        key: '',
        title: '📁 根目录',
        value: '',
      },
      ...buildTreeSelectData(list, excludeId),
    ];
  } catch {
    folderTreeData.value = [{ key: '', title: '📁 根目录', value: '' }];
  }
}

async function handleConfirm() {
  if (!formData.name.trim()) {
    message.warning('请输入文件夹名称');
    return;
  }

  loading.value = true;
  try {
    const parentId = formData.parentId || undefined;
    if (isEdit.value) {
      await updateAssetFolderApi(recordId.value, {
        description: formData.description,
        name: formData.name.trim(),
        parentId,
        sorting: formData.sorting,
      });
      message.success('文件夹更新成功');
    } else {
      await createAssetFolderApi({
        description: formData.description,
        name: formData.name.trim(),
        parentId,
        scope: formData.scope,
        sorting: formData.sorting,
      });
      message.success('文件夹创建成功');
    }
    emit('success');
    modalApi.close();
  } catch (error: any) {
    const msg = error?.response?.data?.error?.message || error?.message || '操作失败';
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
      const data = modalApi.getData<{
        parentId?: string;
        record?: AssetFolderDto;
        scope?: number;
      }>();
      if (data?.record) {
        isEdit.value = true;
        recordId.value = data.record.id;
        formData.name = data.record.name;
        formData.parentId = data.record.parentId || undefined;
        formData.sorting = data.record.sorting ?? 0;
        formData.description = data.record.description ?? '';
        formData.scope = data.record.scope;
        await loadTreeSelect(data.record.scope, data.record.id);
      } else {
        isEdit.value = false;
        recordId.value = '';
        formData.name = '';
        formData.parentId = data?.parentId || undefined;
        formData.sorting = 0;
        formData.description = '';
        formData.scope = data?.scope;
        await loadTreeSelect(data?.scope);
      }
    }
  },
  title: '素材文件夹',
});
</script>

<template>
  <Modal class="w-[520px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="pt-2">
        <Form.Item label="文件夹名称" required>
          <Input
            v-model:value="formData.name"
            placeholder="请输入文件夹名称（如：封面图、产品海报）"
            :maxlength="64"
          />
        </Form.Item>

        <Form.Item label="上级文件夹">
          <TreeSelect
            v-model:value="formData.parentId"
            placeholder="请选择上级文件夹（留空为根目录）"
            allow-clear
            :tree-data="folderTreeData"
            tree-default-expand-all
          />
        </Form.Item>

        <Form.Item label="排序值">
          <InputNumber
            v-model:value="formData.sorting"
            class="w-full"
            placeholder="数值越大越靠前"
          />
        </Form.Item>

        <Form.Item label="描述说明">
          <Input.TextArea
            v-model:value="formData.description"
            rows="3"
            placeholder="请输入文件夹备注或说明（可选）"
            :maxlength="255"
          />
        </Form.Item>
      </Form>
    </Spin>
  </Modal>
</template>
