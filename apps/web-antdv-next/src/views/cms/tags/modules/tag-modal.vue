<script lang="ts" setup>
import type { TagCreateDto, TagDto, TagUpdateDto } from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Spin,
  Switch,
} from 'antdv-next';

import { createTagApi, getTagApi, updateTagApi } from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑标签' : '新建标签'));

const name = ref('');
const code = ref('');
const description = ref('');
const sorting = ref(0);
const isEnabled = ref(true);

function resetState() {
  recordId.value = null;
  name.value = '';
  code.value = '';
  description.value = '';
  sorting.value = 0;
  isEnabled.value = true;
}

async function initData(record?: TagDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail: TagDto = await getTagApi(record.id);
      name.value = detail.name || '';
      code.value = detail.code || '';
      description.value = detail.description || '';
      sorting.value = detail.sorting || 0;
      isEnabled.value = detail.isEnabled ?? true;
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<TagDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.error('请输入标签名称');
      return;
    }
    if (!isEdit.value && !code.value.trim()) {
      message.error('请输入标签唯一编码');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: TagUpdateDto = {
          description: description.value || undefined,
          isEnabled: isEnabled.value,
          name: name.value,
          sorting: sorting.value,
        };
        await updateTagApi(recordId.value, updateData);
        message.success('标签更新成功');
      } else {
        const createData: TagCreateDto = {
          code: code.value,
          description: description.value || undefined,
          isEnabled: isEnabled.value,
          name: name.value,
          sorting: sorting.value,
        };
        await createTagApi(createData);
        message.success('标签创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存标签失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as TagDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[500px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <FormItem label="标签名称" required>
          <Input
            v-model:value="name"
            placeholder="例如：人工智能 / 财经要闻"
            :maxlength="64"
          />
        </FormItem>

        <FormItem label="标签编码 (Code)" :required="!isEdit">
          <Input
            v-model:value="code"
            :disabled="isEdit"
            placeholder="例如：ai / finance"
            :maxlength="64"
          />
        </FormItem>

        <FormItem label="排序序号">
          <InputNumber
            v-model:value="sorting"
            class="w-full"
            placeholder="数字越大越靠前"
          />
        </FormItem>

        <FormItem label="标签说明">
          <Input.TextArea
            v-model:value="description"
            placeholder="请输入标签的简短说明..."
            :rows="3"
            :maxlength="256"
          />
        </FormItem>

        <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
          <div>
            <div class="font-medium text-sm">启用状态</div>
            <div class="text-xs text-muted-foreground">停用后，文章发布时将不可选该标签</div>
          </div>
          <Switch v-model:checked="isEnabled" />
        </div>
      </Form>
    </Spin>
  </Modal>
</template>
