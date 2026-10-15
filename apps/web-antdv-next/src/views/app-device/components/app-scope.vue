<script setup lang="ts">
import { Alert, Select } from 'antdv-next';

import { appDeviceApps } from '../context';
const model = defineModel<string>({ required: true });
</script>
<template>
  <div class="flex items-center gap-2">
    <span class="shrink-0 font-medium"> 应用 </span>
    <Select
      v-model:value="model"
      aria-label="应用 AppId"
      class="w-48"
      :options="appDeviceApps.map((value) => ({ label: value, value }))"
    />
    <Alert
      v-if="!appDeviceApps.length"
      type="warning"
      message="请配置可管理的应用 AppId"
    />
  </div>
</template>
