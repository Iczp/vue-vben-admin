<script lang="ts" setup>
import type { ChatObjectDto } from '#/api/chat';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Radio, RadioGroup } from 'antdv-next';

import {
  setVerificationMethodApi,
  VerificationMethodEnums,
} from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<ChatObjectDto | null>(null);
const verificationMethod = ref<VerificationMethodEnums>(
  VerificationMethodEnums.Free,
);
const password = ref('');

const [Modal, modalApi] = useVbenModal<ChatObjectDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!currentRecord.value?.id) return;
    if (
      verificationMethod.value === VerificationMethodEnums.Password &&
      !password.value.trim()
    ) {
      message.warning('请输入验证密码');
      return;
    }

    try {
      modalApi.lock();
      await setVerificationMethodApi({
        id: currentRecord.value.id,
        password: password.value.trim() || undefined,
        verificationMethod: verificationMethod.value,
      });
      message.success('验证方式修改成功');
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const payload = modalApi.getData();
      currentRecord.value = payload ?? null;
      verificationMethod.value =
        payload?.verificationMethod ?? VerificationMethodEnums.Free;
      password.value = '';
    } else {
      currentRecord.value = null;
      password.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="设置加好友/加群验证方式" class="w-[460px]">
    <div class="space-y-4 p-4">
      <div class="rounded bg-muted/50 p-2.5 text-xs text-muted-foreground">
        目标对象：<strong>{{ currentRecord?.name }}</strong> ({{ currentRecord?.displayName || '无昵称' }})
      </div>

      <div>
        <div class="mb-2 font-medium text-sm">验证方式</div>
        <RadioGroup v-model:value="verificationMethod" class="flex flex-col gap-2">
          <Radio :value="VerificationMethodEnums.Free">
            自由加入（无需审核或密码即可加入）
          </Radio>
          <Radio :value="VerificationMethodEnums.Password">
            密码加入（输入正确密码即可加入）
          </Radio>
          <Radio :value="VerificationMethodEnums.Verify">
            需要验证（需发送申请并由管理员或本人审批）
          </Radio>
        </RadioGroup>
      </div>

      <div v-if="verificationMethod === VerificationMethodEnums.Password">
        <div class="mb-1 font-medium text-sm">设置新密码 <span class="text-red-500">*</span></div>
        <Input.Password v-model:value="password" placeholder="请输入加群或进房密码" />
      </div>
    </div>
  </Modal>
</template>
