<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import { simulateScanCodeApi } from '#/api/chat/scan-code';

const emit = defineEmits(['success']);

const formState = ref({
  content: '',
  deviceId: '',
  type: 'Login',
});

const resultJson = ref<null | string>(null);

function resetState() {
  formState.value = {
    content: '',
    deviceId: '',
    type: 'Login',
  };
  resultJson.value = null;
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    if (!formState.value.content.trim()) {
      message.warning('请输入待测试的二维码报文或文本内容');
      return;
    }

    try {
      modalApi.lock();
      const res = await simulateScanCodeApi({
        content: formState.value.content.trim(),
        deviceId: formState.value.deviceId.trim() || undefined,
        type: formState.value.type.trim() || undefined,
      });

      resultJson.value = JSON.stringify(res, null, 2);
      message.success('模拟扫描已触发并执行完毕');
      emit('success');
    } catch (error: any) {
      resultJson.value = JSON.stringify(error?.response?.data || error?.message || error, null, 2);
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (!isOpen) {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="模拟触发扫码调试" class="w-[520px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 text-sm font-medium">
          二维码内容 / Payload <span class="text-red-500">*</span>
        </div>
        <Input.TextArea
          v-model:value="formState.content"
          placeholder="如：gotoim://scan-login?code=xxx 或好友主页链接"
          :rows="3"
        />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 text-sm font-medium">扫码业务类型</div>
          <Input
            v-model:value="formState.type"
            placeholder="如：Login, AddFriend"
          />
        </div>
        <div>
          <div class="mb-1 text-sm font-medium">模拟设备 ID</div>
          <Input
            v-model:value="formState.deviceId"
            placeholder="可选设备 UUID"
          />
        </div>
      </div>

      <div v-if="resultJson">
        <div class="mb-1 text-sm font-medium text-primary">执行响应结果：</div>
        <pre class="p-3 bg-muted/40 rounded text-xs font-mono max-h-48 overflow-y-auto border">{{ resultJson }}</pre>
      </div>
    </div>
  </Modal>
</template>
