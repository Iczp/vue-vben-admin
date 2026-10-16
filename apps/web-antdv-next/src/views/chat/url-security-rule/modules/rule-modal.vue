<script lang="ts" setup>
import type { UrlSecurityRuleDto } from '#/api/chat/security';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Select, Switch } from 'antdv-next';

import {
  createUrlSecurityRuleApi,
  updateUrlSecurityRuleApi,
  UrlRiskCategory,
  UrlSecurityLevel,
} from '#/api/chat/security';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const currentRecord = ref<null | UrlSecurityRuleDto>(null);

const formState = ref({
  category: UrlRiskCategory.UnknownThirdParty,
  host: '',
  isEnabled: true,
  level: UrlSecurityLevel.Warning,
  reason: '',
});

const isEdit = computed(() => Boolean(currentRecord.value?.id));

const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑风控规则')} - ${currentRecord.value?.host}`
    : '新增 URL 风控规则',
);

const levelOptions = [
  { label: '安全 (白名单 - 直接放行)', value: UrlSecurityLevel.Safe },
  { label: '警告 (提示中转 - 提示防诈风险)', value: UrlSecurityLevel.Warning },
  {
    label: '阻断 (黑名单 - 禁止打开并拦截发送)',
    value: UrlSecurityLevel.Blocked,
  },
];

const categoryOptions = [
  { label: '平台官方/白名单', value: UrlRiskCategory.OfficialOrWhitelisted },
  { label: '未认证第三方', value: UrlRiskCategory.UnknownThirdParty },
  { label: '电信诈骗', value: UrlRiskCategory.Fraud },
  { label: '仿冒钓鱼', value: UrlRiskCategory.Phishing },
  { label: '色情低俗', value: UrlRiskCategory.Porn },
  { label: '非法赌博', value: UrlRiskCategory.IllegalGambling },
  { label: '病毒木马', value: UrlRiskCategory.Malware },
  { label: '其它违规', value: UrlRiskCategory.Other },
];

function resetState() {
  currentRecord.value = null;
  formState.value = {
    category: UrlRiskCategory.UnknownThirdParty,
    host: '',
    isEnabled: true,
    level: UrlSecurityLevel.Warning,
    reason: '',
  };
}

const [Modal, modalApi] = useVbenModal<null | UrlSecurityRuleDto>({
  fullscreenButton: false,
  async onConfirm() {
    const host = formState.value.host.trim().toLowerCase();
    if (!host) {
      message.warning('请输入域名或匹配模式');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateUrlSecurityRuleApi(currentRecord.value.id, {
          category: formState.value.category,
          host,
          isEnabled: formState.value.isEnabled,
          level: formState.value.level,
          reason: formState.value.reason.trim(),
        });
      } else {
        await createUrlSecurityRuleApi({
          category: formState.value.category,
          host,
          isEnabled: formState.value.isEnabled,
          level: formState.value.level,
          reason: formState.value.reason.trim(),
        });
      }

      message.success(
        $t('common.saveSuccess', '保存成功，已同步刷新 Redis 缓存'),
      );
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
          category: payload.category,
          host: payload.host,
          isEnabled: payload.isEnabled,
          level: payload.level,
          reason: payload.reason || '',
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
  <Modal :title="getTitle" class="w-[520px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 text-sm font-medium">
          域名 / 匹配模式 <span class="text-red-500">*</span>
        </div>
        <Input
          v-model:value="formState.host"
          placeholder="如：gotoim.com、*.scam-phishing.xyz 或 具体二级域名"
          :maxlength="256"
        />
        <div class="text-xs text-muted-foreground mt-1">
          支持精确主机名（如 domain.com）或通配符前缀（如 *.badsite.com）
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 text-sm font-medium">
            安全风控级别 <span class="text-red-500">*</span>
          </div>
          <Select
            v-model:value="formState.level"
            :options="levelOptions"
            class="w-full"
          />
        </div>
        <div>
          <div class="mb-1 text-sm font-medium">
            风险细分类别 <span class="text-red-500">*</span>
          </div>
          <Select
            v-model:value="formState.category"
            :options="categoryOptions"
            class="w-full"
          />
        </div>
      </div>

      <div>
        <div class="mb-1 text-sm font-medium">拦截或放行原因说明</div>
        <Input.TextArea
          v-model:value="formState.reason"
          placeholder="说明该规则制定的依据，如：官方核心业务域名 / 涉案杀猪盘诈骗网站"
          :rows="2"
          :maxlength="512"
          show-count
        />
      </div>

      <div class="flex items-center justify-between border-t pt-3">
        <div>
          <div class="text-sm font-medium">是否立即启用</div>
          <div class="text-xs text-muted-foreground">
            停用后该规则将不参与判定
          </div>
        </div>
        <Switch v-model:checked="formState.isEnabled" />
      </div>
    </div>
  </Modal>
</template>
