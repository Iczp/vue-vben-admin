<script lang="ts" setup>
import type { ChatObjectTypeDto } from '#/api/chat';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, InputNumber, message, Switch } from 'antdv-next';

import { createChatObjectTypeApi, updateChatObjectTypeApi } from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<ChatObjectTypeDto | null>(null);

const id = ref('');
const name = ref('');
const description = ref('');
const maxDepth = ref<number | undefined>(0);
const isHasChild = ref(false);

const isEdit = computed(() => !!currentRecord.value?.id);
const modalTitle = computed(() =>
  isEdit.value
    ? `编辑聊天对象类型 - ${currentRecord.value?.name}`
    : '新增聊天对象类型',
);

function resetState() {
  currentRecord.value = null;
  id.value = '';
  name.value = '';
  description.value = '';
  maxDepth.value = 0;
  isHasChild.value = false;
}

const [Modal, modalApi] = useVbenModal<ChatObjectTypeDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入类型名称');
      return;
    }
    if (!isEdit.value && !id.value.trim()) {
      message.warning('请输入唯一的类型标识 (ID)');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateChatObjectTypeApi(currentRecord.value.id, {
          description: description.value.trim() || undefined,
          isHasChild: isHasChild.value,
          maxDepth: maxDepth.value,
          name: name.value.trim(),
        });
        message.success('类型更新成功');
      } else {
        await createChatObjectTypeApi({
          description: description.value.trim() || undefined,
          id: id.value.trim(),
          isHasChild: isHasChild.value,
          maxDepth: maxDepth.value,
          name: name.value.trim(),
        });
        message.success('类型创建成功');
      }
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
        id.value = payload.id;
        name.value = payload.name || '';
        description.value = payload.description || '';
        maxDepth.value = payload.maxDepth ?? 0;
        isHasChild.value = payload.isHasChild ?? false;
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="modalTitle" class="w-[500px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 font-medium text-sm">
          类型唯一标识 (ID) <span class="text-red-500">*</span>
        </div>
        <Input
          v-model:value="id"
          :disabled="isEdit"
          placeholder="如：Personal, Room, CustomerService"
        />
        <div v-if="!isEdit" class="mt-1 text-xs text-muted-foreground">
          用于代码和业务中标识对象类型，创建后不可修改
        </div>
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">
          类型名称 <span class="text-red-500">*</span>
        </div>
        <Input v-model:value="name" placeholder="如：个人号、群聊群组、在线客服" />
      </div>

      <div class="flex items-center justify-between py-1">
        <div>
          <div class="font-medium text-sm">允许树级子对象 (isHasChild)</div>
          <div class="text-xs text-muted-foreground">是否允许该类型建立下级子实体</div>
        </div>
        <Switch v-model:checked="isHasChild" />
      </div>

      <div v-if="isHasChild">
        <div class="mb-1 font-medium text-sm">最大层级深度 (MaxDepth)</div>
        <InputNumber v-model:value="maxDepth" class="w-full" :min="0" :max="100" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">类型说明</div>
        <Input.TextArea v-model:value="description" :rows="3" placeholder="可选填该类型的说明" />
      </div>
    </div>
  </Modal>
</template>
