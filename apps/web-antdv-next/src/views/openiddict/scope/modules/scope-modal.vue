<script lang="ts" setup>
import type { ScopeDto } from '#/api/openiddict';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Select } from 'antdv-next';

import { createScopeApi, updateScopeApi } from '#/api/openiddict';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const scopeModel = ref<ScopeDto | null>(null);
const name = ref('');
const displayName = ref('');
const description = ref('');
const resources = ref<string[]>([]);

const isEdit = computed(() => Boolean(scopeModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑作用域')} - ${scopeModel.value?.name}`
    : '新建权限作用域 (Scope)',
);

function resetState() {
  scopeModel.value = null;
  name.value = '';
  displayName.value = '';
  description.value = '';
  resources.value = [];
}

const [Modal, modalApi] = useVbenModal<ScopeDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.error('请输入作用域名称');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && scopeModel.value?.id) {
        await updateScopeApi(scopeModel.value.id, {
          description: description.value,
          displayName: displayName.value,
          name: name.value.trim(),
          resources: resources.value,
        });
      } else {
        await createScopeApi({
          description: description.value,
          displayName: displayName.value,
          name: name.value.trim(),
          resources: resources.value,
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
        scopeModel.value = payload;
        name.value = payload.name || '';
        displayName.value = payload.displayName || '';
        description.value = payload.description || '';
        resources.value = payload.resources || [];
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[540px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span> 作用域名称 (Name)
        </div>
        <Input
          v-model:value="name"
          placeholder="如：Chat.Admin、IdentityServerApi"
          :disabled="isEdit"
        />
      </div>

      <div>
        <div class="mb-1 font-medium">显示名称 (Display Name)</div>
        <Input
          v-model:value="displayName"
          placeholder="如：即时通信后台管理 API 作用域"
        />
      </div>

      <div>
        <div class="mb-1 font-medium">目标资源 (Resources)</div>
        <Select
          v-model:value="resources"
          mode="tags"
          placeholder="输入目标资源后回车添加，如：Chat"
          class="w-full"
        />
      </div>

      <div>
        <div class="mb-1 font-medium">描述说明</div>
        <Input.TextArea
          v-model:value="description"
          :rows="3"
          placeholder="请输入该 Scope 的用途说明..."
        />
      </div>
    </div>
  </Modal>
</template>
