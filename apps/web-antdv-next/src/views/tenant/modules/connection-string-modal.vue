<script lang="ts" setup>
import type { TenantDto } from '#/api/multi-tenancy';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox,
  Input,
  message,
  Spin,
} from 'antdv-next';

import {
  deleteDefaultConnectionStringApi,
  getDefaultConnectionStringApi,
  updateDefaultConnectionStringApi,
} from '#/api/multi-tenancy';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const loading = ref(false);
const tenantModel = ref<TenantDto | null>(null);
const useSharedDatabase = ref(true);
const defaultConnectionString = ref('');

const getTitle = computed(
  () =>
    `${$t('page.tenant.connectionString', '数据库连接字符串')} - ${tenantModel.value?.name || ''}`,
);

const [Modal, modalApi] = useVbenModal<TenantDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!tenantModel.value?.id) return;
    try {
      modalApi.lock();
      if (useSharedDatabase.value) {
        await deleteDefaultConnectionStringApi(tenantModel.value.id);
      } else {
        if (!defaultConnectionString.value.trim()) {
          message.error(
            $t('page.tenant.connStringRequired', '请输入数据库连接字符串'),
          );
          return;
        }
        await updateDefaultConnectionStringApi(
          tenantModel.value.id,
          defaultConnectionString.value.trim(),
        );
      }

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      tenantModel.value = modalApi.getData() || null;
      if (tenantModel.value?.id) {
        loading.value = true;
        try {
          const connStr = await getDefaultConnectionStringApi(
            tenantModel.value.id,
          );
          if (connStr) {
            defaultConnectionString.value = connStr;
            useSharedDatabase.value = false;
          } else {
            defaultConnectionString.value = '';
            useSharedDatabase.value = true;
          }
        } catch {
          defaultConnectionString.value = '';
          useSharedDatabase.value = true;
        } finally {
          loading.value = false;
        }
      }
    } else {
      tenantModel.value = null;
      defaultConnectionString.value = '';
      useSharedDatabase.value = true;
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[600px]">
    <Spin :spinning="loading">
      <div class="space-y-4 p-4">
        <div>
          <Checkbox v-model:checked="useSharedDatabase">
            <span class="font-medium">
              {{ $t('page.tenant.useSharedDatabase', '使用共享数据库（默认宿主数据库）') }}
            </span>
          </Checkbox>
        </div>

        <div v-if="!useSharedDatabase">
          <div class="mb-1 font-medium">
            <span class="text-red-500">*</span>
            {{ $t('page.tenant.connectionString', '数据库连接字符串') }}
          </div>
          <Input.TextArea
            v-model:value="defaultConnectionString"
            :rows="4"
            placeholder="Server=...;Database=...;User Id=...;Password=...;"
          />
          <div class="mt-1 text-xs text-gray-400">
            {{ $t('page.tenant.connStringTip', '配置此租户专用的独立数据库连接字符串') }}
          </div>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
