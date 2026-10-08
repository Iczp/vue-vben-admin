<script lang="ts" setup>
import { Empty as AEmpty } from 'antdv-next';

import { $t } from '#/locales';

interface Props {
  description?: string;
}

withDefaults(defineProps<Props>(), {
  description: $t('appStatistic.text030'),
});
</script>

<template>
  <div class="flex h-64 w-full items-center justify-center p-6">
    <AEmpty :description="description" />
  </div>
</template>
