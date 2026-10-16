<script lang="ts" setup>
import type { ScopeDto } from '#/api/openiddict';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Select } from 'antdv-next';

import { createScopeApi, getClaimsApi, updateScopeApi } from '#/api/openiddict';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const scopeModel = ref<null | ScopeDto>(null);
const name = ref('');
const displayName = ref('');
const description = ref('');
const resources = ref<string[]>([]);
const claims = ref<string[]>([]);

const defaultStandardClaims = [
  { label: 'sub (用户标识)', value: 'sub' },
  { label: 'name (姓名)', value: 'name' },
  { label: 'preferred_username (用户名)', value: 'preferred_username' },
  { label: 'email (电子邮箱)', value: 'email' },
  { label: 'email_verified (邮箱验证)', value: 'email_verified' },
  { label: 'phone_number (手机号码)', value: 'phone_number' },
  { label: 'phone_number_verified (手机验证)', value: 'phone_number_verified' },
  { label: 'roles (用户角色)', value: 'roles' },
  { label: 'role (单角色)', value: 'role' },
  { label: 'tenantid (租户标识)', value: 'tenantid' },
  { label: 'profile (个人档案)', value: 'profile' },
  { label: 'given_name (名字)', value: 'given_name' },
  { label: 'family_name (姓氏)', value: 'family_name' },
];

const availableClaims = ref<Array<{ label: string; value: string }>>([
  ...defaultStandardClaims,
]);

async function loadClaims() {
  try {
    const claimsDict = await getClaimsApi();
    if (claimsDict && typeof claimsDict === 'object') {
      const set = new Map<string, string>();
      defaultStandardClaims.forEach((c) => set.set(c.value, c.label));
      Object.entries(claimsDict).forEach(([k, v]) => {
        if (!set.has(v)) {
          set.set(v, `${k} (${v})`);
        }
      });
      availableClaims.value = [...set.entries()].map(([value, label]) => ({
        label,
        value,
      }));
    }
  } catch {}
}

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
  claims.value = [];
}

const [Modal, modalApi] = useVbenModal<null | ScopeDto>({
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
          claims: claims.value,
          description: description.value,
          displayName: displayName.value,
          name: name.value.trim(),
          resources: resources.value,
        });
      } else {
        await createScopeApi({
          claims: claims.value,
          description: description.value,
          displayName: displayName.value,
          name: name.value.trim(),
          resources: resources.value,
        });
      }

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } catch {
      // 错误已由全局响应拦截器统一提示
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      loadClaims();
      const payload = modalApi.getData();
      if (payload) {
        scopeModel.value = payload;
        name.value = payload.name || '';
        displayName.value = payload.displayName || '';
        description.value = payload.description || '';
        resources.value = payload.resources || [];
        claims.value = payload.claims || [];
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
        <div class="mb-1 font-medium">包含用户声明 (Claims)</div>
        <div class="text-xs text-muted-foreground mb-1">
          指定请求该作用域时，生成的访问令牌与身份令牌中包含的用户声明：
        </div>
        <Select
          v-model:value="claims"
          mode="tags"
          :options="availableClaims"
          placeholder="选择或输入声明后回车，如：email, roles, tenantid"
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
