<script setup lang="ts">
import { h } from 'vue';

import { Table } from 'antdv-next';

import StatisticEmpty from './StatisticEmpty.vue';
defineOptions({ inheritAttrs: false });
defineProps<{ loading?: boolean }>();
</script>
<template>
  <div class="overflow-x-auto">
    <Table
      v-bind="$attrs"
      :loading="loading"
      :locale="{ emptyText: () => h(StatisticEmpty) }"
    >
      <template v-for="(_, name) in $slots" #[name]="slotProps">
        <slot :name="name" v-bind="slotProps ?? {}"></slot>
      </template>
    </Table>
  </div>
</template>
