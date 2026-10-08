<script setup lang="ts">
import { Alert, Button } from 'antdv-next';

import { $t } from '#/locales';
defineEmits<{ retry: [] }>();
</script>
<template>
  <Alert :message="$t('appStatistic.loadError')" type="error" show-icon>
    <template #action>
      <Button size="small" @click="$emit('retry')">
        {{ $t('appStatistic.retry') }}
      </Button>
    </template>
  </Alert>
</template>
