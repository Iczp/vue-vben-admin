<script lang="ts" setup>
import type { ApplicationDto } from '#/api/openiddict';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Button, Input, message } from 'antdv-next';

import {
  generateClientSecretApi,
  setClientSecretApi,
} from '#/api/openiddict';

const emit = defineEmits(['success']);

const appModel = ref<ApplicationDto | null>(null);
const clientSecret = ref('');

async function onGenerateSecret() {
  try {
    const secret = await generateClientSecretApi();
    clientSecret.value = secret;
    message.success('已随机生成新密钥');
  } catch {
    const randomSecret =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10);
    clientSecret.value = randomSecret;
  }
}

const [Modal, modalApi] = useVbenModal<ApplicationDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!clientSecret.value.trim()) {
      message.error('请输入或生成新的客户端密钥');
      return;
    }
    if (!appModel.value?.id) return;

    try {
      modalApi.lock();
      await setClientSecretApi({
        clientSecret: clientSecret.value.trim(),
        id: appModel.value.id,
      });

      message.success('客户端密钥修改成功');
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      appModel.value = modalApi.getData() || null;
      clientSecret.value = '';
    } else {
      appModel.value = null;
      clientSecret.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal
    :title="`修改客户端密钥 - ${appModel?.displayName || appModel?.clientId}`"
    class="w-[500px]"
  >
    <div class="p-4 space-y-4">
      <div>
        <div class="mb-1 font-medium">客户端 ID</div>
        <Input :value="appModel?.clientId" disabled />
      </div>

      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span> 新客户端密钥 (Client Secret)
        </div>
        <div class="flex gap-2">
          <Input
            v-model:value="clientSecret"
            placeholder="请输入新密钥或点击自动生成"
          />
          <Button @click="onGenerateSecret">自动生成</Button>
        </div>
      </div>
    </div>
  </Modal>
</template>
