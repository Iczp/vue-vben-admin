<script lang="ts" setup>
import type { TenantDto } from '#/api/multi-tenancy';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  Input,
  message,
  Row,
} from 'antdv-next';

import { createTenantApi, updateTenantApi } from '#/api/multi-tenancy';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const tenantModel = ref<TenantDto | null>(null);

const name = ref('');
const adminEmailAddress = ref('');
const adminPassword = ref('');

const isEdit = computed(() => Boolean(tenantModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑租户')} - ${tenantModel.value?.name}`
    : $t('common.create', '新建租户'),
);

function resetState() {
  name.value = '';
  adminEmailAddress.value = '';
  adminPassword.value = '';
}

const [Modal, modalApi] = useVbenModal<TenantDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.error($t('page.tenant.nameRequired', '请输入租户名称'));
      return;
    }
    if (!isEdit.value && !adminEmailAddress.value.trim()) {
      message.error($t('page.tenant.adminEmailRequired', '请输入管理员邮箱'));
      return;
    }
    if (!isEdit.value && !adminPassword.value) {
      message.error($t('page.tenant.adminPasswordRequired', '请输入管理员密码'));
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && tenantModel.value?.id) {
        await updateTenantApi(tenantModel.value.id, {
          concurrencyStamp: tenantModel.value.concurrencyStamp,
          name: name.value,
        });
      } else {
        await createTenantApi({
          adminEmailAddress: adminEmailAddress.value,
          adminPassword: adminPassword.value,
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
      tenantModel.value = modalApi.getData() || null;
      if (tenantModel.value?.id) {
        name.value = tenantModel.value.name || '';
      }
    } else {
      tenantModel.value = null;
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[560px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span>
          {{ $t('page.tenant.name', '租户名称') }}
        </div>
        <Input
          v-model:value="name"
          :placeholder="$t('page.tenant.name', '租户名称')"
        />
      </div>

      <template v-if="!isEdit">
        <Row :gutter="16">
          <Col :span="12">
            <div class="mb-1 font-medium">
              <span class="text-red-500">*</span>
              {{ $t('page.tenant.adminEmail', '管理员邮箱') }}
            </div>
            <Input
              v-model:value="adminEmailAddress"
              placeholder="admin@domain.com"
            />
          </Col>
          <Col :span="12">
            <div class="mb-1 font-medium">
              <span class="text-red-500">*</span>
              {{ $t('page.tenant.adminPassword', '初始密码') }}
            </div>
            <Input.Password
              v-model:value="adminPassword"
              placeholder="Admin password"
            />
          </Col>
        </Row>
      </template>
    </div>
  </Modal>
</template>
