<script setup lang="ts">
import type { Dayjs } from 'dayjs';

import { DatePicker } from 'antdv-next';
import dayjs from 'dayjs';
defineProps<{ endDate: string; startDate: string }>();
const emit = defineEmits<{ change: [startDate: string, endDate: string] }>();
const RangePicker = DatePicker.RangePicker;
function change(dates: Dayjs[] | null) {
  if (dates?.[0] && dates[1])
    emit(
      'change',
      dates[0].format('YYYY-MM-DD'),
      dates[1].format('YYYY-MM-DD'),
    );
}
</script>
<template>
  <RangePicker
    :allow-clear="false"
    :value="[dayjs(startDate), dayjs(endDate)]"
    format="YYYY-MM-DD"
    size="small"
    @change="change"
  />
</template>
