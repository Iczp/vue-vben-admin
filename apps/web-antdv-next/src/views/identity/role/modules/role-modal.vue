<script lang="ts" setup>
import type { IdentityRoleDto } from '#/api/identity';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  Input,
  message,
  Row,
  Switch,
} from 'antdv-next';

import { createRoleApi, updateRoleApi } from '#/api/identity';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const roleModel = ref<IdentityRoleDto | null>(null);

const name = ref('');
const isDefault = ref(false);
const isPublic = ref(true);

const isEdit = computed(() => Boolean(roleModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑角色')} - ${roleModel.value?.name}`
    : $t('common.create', '新建角色'),
);

function resetState() {
  name.value = '';
  isDefault.value = false;
  isPublic.value = true;
}

const [Modal, modalApi] = useVbenModal<IdentityRoleDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.error($t('page.identity.role.nameRequired', '请输入角色名称'));
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && roleModel.value?.id) {
        await updateRoleApi(roleModel.value.id, {
          concurrencyStamp: roleModel.value.concurrencyStamp,
          isDefault: isDefault.value,
          isPublic: isPublic.value,
          name: name.value,
        });
      } else {
        await createRoleApi({
          isDefault: isDefault.value,
          isPublic: isPublic.value,
          name: name.value,
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
      roleModel.value = modalApi.getData() || null;
      if (roleModel.value?.id) {
        name.value = roleModel.value.name || '';
        isDefault.value = roleModel.value.isDefault ?? false;
        isPublic.value = roleModel.value.isPublic ?? true;
      }
    } else {
      roleModel.value = null;
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span>
          {{ $t('page.identity.role.name', '角色名称') }}
        </div>
        <Input
          v-model:value="name"
          :placeholder="$t('page.identity.role.name', '角色名称')"
          :disabled="isEdit && roleModel?.isStatic"
        />
      </div>

      <Row :gutter="16" class="pt-2">
        <Col :span="12">
          <div class="flex items-center gap-3">
            <Switch v-model:checked="isDefault" />
            <span class="font-medium">
              {{ $t('page.identity.role.isDefault', '默认角色') }}
            </span>
          </div>
        </Col>
        <Col :span="12">
          <div class="flex items-center gap-3">
            <Switch v-model:checked="isPublic" />
            <span class="font-medium">
              {{ $t('page.identity.role.isPublic', '公共角色') }}
            </span>
          </div>
        </Col>
      </Row>
    </div>
  </Modal>
</template>
