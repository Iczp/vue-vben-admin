import type { ApplicationConfigurationDto } from '#/api/abp/types';

import { computed, ref } from 'vue';

import { useAccessStore, useUserStore } from '@vben/stores';

import { defineStore } from 'pinia';

import { getApplicationConfigurationApi } from '#/api/abp';

export const useAbpStore = defineStore('abp', () => {
  const applicationConfig = ref<ApplicationConfigurationDto | null>(null);
  const loading = ref(false);

  const currentUser = computed(() => applicationConfig.value?.currentUser);
  const currentTenant = computed(() => applicationConfig.value?.currentTenant);
  const grantedPolicies = computed(
    () => applicationConfig.value?.auth?.grantedPolicies ?? {},
  );
  const settings = computed(
    () => applicationConfig.value?.setting?.values ?? {},
  );
  const localization = computed(() => applicationConfig.value?.localization);

  /**
   * 判断是否拥有指定 ABP 权限策略
   * @param policy 权限名称，如 'AbpIdentity.Users'
   */
  function hasPermission(policy: string): boolean {
    if (!policy) return true;
    return Boolean(grantedPolicies.value[policy]);
  }

  /**
   * 获取 ABP 设置值
   */
  function getSetting(name: string): string | undefined {
    return settings.value[name];
  }

  /**
   * 加载 ABP 全局应用配置并同步权限到 Vben AccessStore
   */
  async function fetchApplicationConfiguration() {
    try {
      loading.value = true;
      const config = await getApplicationConfigurationApi();
      applicationConfig.value = config;

      // 同步权限码列表到 Vben accessStore
      const accessStore = useAccessStore();
      const userStore = useUserStore();

      const policies = config?.auth?.grantedPolicies ?? {};
      const grantedCodes = Object.keys(policies).filter(
        (code) => policies[code] === true,
      );
      accessStore.setAccessCodes(grantedCodes);

      // 同步当前用户信息到 Vben userStore
      if (config?.currentUser) {
        userStore.setUserInfo({
          avatar: '',
          realName:
            config.currentUser.name ||
            config.currentUser.userName ||
            'ABP User',
          roles: config.currentUser.roles || [],
          userId: config.currentUser.id || '',
          username: config.currentUser.userName || '',
        });
      }

      return config;
    } finally {
      loading.value = false;
    }
  }

  function $reset() {
    applicationConfig.value = null;
    loading.value = false;
  }

  return {
    $reset,
    applicationConfig,
    currentTenant,
    currentUser,
    fetchApplicationConfiguration,
    getSetting,
    grantedPolicies,
    hasPermission,
    loading,
    localization,
    settings,
  };
});
