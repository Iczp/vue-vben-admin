<script lang="ts" setup>
import type { InvitationCodeDto } from '#/api/chat/invitation-code';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import {
  createInvitationCodeApi,
  updateInvitationCodeApi,
} from '#/api/chat/invitation-code';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const currentRecord = ref<InvitationCodeDto | null>(null);

const formState = ref({
  ownerId: '',
  title: '',
});

const isEdit = computed(() => Boolean(currentRecord.value?.id));

const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑邀请码')} - ${currentRecord.value?.title}`
    : '生成新邀请码',
);

function resetState() {
  currentRecord.value = null;
  formState.value = {
    ownerId: '',
    title: '',
  };
}

const [Modal, modalApi] = useVbenModal<InvitationCodeDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!formState.value.title.trim()) {
      message.warning('请输入邀请码标题或说明');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateInvitationCodeApi(currentRecord.value.id, {
          title: formState.value.title.trim(),
        });
      } else {
        await createInvitationCodeApi({
          ownerId: formState.value.ownerId.trim() || undefined,
          title: formState.value.title.trim(),
        });
      }

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
          ownerId: payload.ownerId || '',
          title: payload.title || '',
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
  <Modal :title="getTitle" class="w-[480px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 text-sm font-medium">
          邀请码标题/说明 <span class="text-red-500">*</span>
        </div>
        <Input
          v-model:value="formState.title"
          placeholder="如：新员工入职邀请、VIP 推广渠道 A"
          :maxlength="100"
          show-count
        />
      </div>

      <div v-if="!isEdit">
        <div class="mb-1 text-sm font-medium">所属聊天对象 / 拥有者 ID (可选)</div>
        <Input
          v-model:value="formState.ownerId"
          placeholder="请输入关联的目标聊天对象 ID (UUID)"
        />
        <div class="text-xs text-muted-foreground mt-1">
          指定后该邀请码通常定向归属于该群聊或服务号对象
        </div>
      </div>
    </div>
  </Modal>
</template>
