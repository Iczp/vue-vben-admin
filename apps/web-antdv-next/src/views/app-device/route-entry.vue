<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { useAccessStore } from '@vben/stores';

import { Button, Result, Spin } from 'antdv-next';

import { useAbpStore } from '#/store/abp';

const props = defineProps<{ permission: string; view: 'devices' | 'groups' }>();
const views = {
  devices: defineAsyncComponent(() => import('./devices/index.vue')),
  groups: defineAsyncComponent(() => import('./groups/index.vue')),
};
const abp = useAbpStore();
const access = useAccessStore();
const router = useRouter();
const route = useRoute();
const loading = ref(false);
const allowed = computed(() => abp.hasPermission(props.permission));

async function refresh() {
  if (loading.value) return;
  loading.value = true;
  try {
    await abp.refreshAppDeviceConfiguration();
    if (!abp.appDeviceConfigurationError) {
      access.setIsAccessChecked(false);
      await router.replace(route.fullPath);
    }
  } finally {
    loading.value = false;
  }
}
onMounted(() => {
  if (!abp.appDeviceConfigurationLoaded || abp.appDeviceConfigurationError)
    void refresh();
});
</script>
<template>
  <component :is="views[view]" v-if="allowed && !loading" :key="view" />
  <Page v-else>
    <Spin :spinning="loading">
      <Result
        :status="abp.appDeviceConfigurationError ? 'error' : '403'"
        :title="
          abp.appDeviceConfigurationError
            ? '设备服务权限加载失败'
            : '没有访问权限'
        "
        :sub-title="
          abp.appDeviceConfigurationError
            ? '请检查 AppDevice 服务与代理连接，然后重新加载权限。'
            : `当前账号未获得 ${permission}，请使用已授权的管理员账号。`
        "
      >
        <template #extra>
          <Button type="primary" :loading="loading" @click="refresh">
            重新加载权限
          </Button>
        </template>
      </Result>
    </Spin>
  </Page>
</template>
