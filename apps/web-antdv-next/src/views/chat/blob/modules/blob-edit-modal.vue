<script lang="ts" setup>
import type { BlobDto } from '#/api/chat/blob';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Switch } from 'antdv-next';

import { updateBlobApi } from '#/api/chat/blob';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const currentRecord = ref<BlobDto | null>(null);

const formState = ref({
  fileName: '',
  isPublic: false,
  isStatic: false,
});

const getTitle = computed(
  () => `${$t('common.edit', '编辑对象元数据')} - ${currentRecord.value?.fileName || currentRecord.value?.id}`,
);

function resetState() {
  currentRecord.value = null;
  formState.value = {
    fileName: '',
    isPublic: false,
    isStatic: false,
  };
}

const [Modal, modalApi] = useVbenModal<BlobDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!currentRecord.value?.id) return;

    try {
      modalApi.lock();
      await updateBlobApi(currentRecord.value.id, {
        fileName: formState.value.fileName.trim() || undefined,
        isPublic: formState.value.isPublic,
        isStatic: formState.value.isStatic,
      });

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        currentRecord.value = payload;
        formState.value = {
          fileName: payload.fileName || '',
          isPublic: payload.isPublic ?? false,
          isStatic: payload.isStatic ?? false,
        };
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[500px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 text-sm font-medium">对象 ID</div>
        <Input :value="currentRecord?.id" disabled />
      </div>

      <div>
        <div class="mb-1 text-sm font-medium">文件名</div>
        <Input
          v-model:value="formState.fileName"
          placeholder="请输入对象显示文件名"
        />
      </div>

      <div class="flex items-center justify-between py-2 border-t pt-3">
        <div>
          <div class="font-medium text-sm">公开访问 (isPublic)</div>
          <div class="text-xs text-muted-foreground">
            开启后允许未鉴权客户端通过直链访问该资源
          </div>
        </div>
        <Switch v-model:checked="formState.isPublic" />
      </div>

      <div class="flex items-center justify-between py-2 border-t pt-3">
        <div>
          <div class="font-medium text-sm">静态托管 (isStatic)</div>
          <div class="text-xs text-muted-foreground">
            声明为网站或 App 的静态公共资源
          </div>
        </div>
        <Switch v-model:checked="formState.isStatic" />
      </div>
    </div>
  </Modal>
</template>
