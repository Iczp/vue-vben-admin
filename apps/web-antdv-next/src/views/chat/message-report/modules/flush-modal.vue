<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  message,
  RadioGroup,
} from 'antdv-next';

import {
  flushMessageReportApi,
  MessageReportTypes,
} from '#/api/chat/message-report';
import { reportTypeOptions } from '../data';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const reportType = ref<MessageReportTypes>(MessageReportTypes.Day);
const dateBucket = ref<string>('');

const [Modal, modalApi] = useVbenModal<{ defaultType?: MessageReportTypes }>({
  fullscreenButton: false,
  async onConfirm() {
    try {
      modalApi.lock();
      const res = await flushMessageReportApi({
        dateBucket: dateBucket.value.trim() ? Number(dateBucket.value.trim()) : undefined,
        type: reportType.value,
      });

      if (res !== false) {
        message.success('统计数据落库成功');
        modalApi.close();
        emit('success');
      } else {
        message.warning('落库执行完毕，无新数据变动');
      }
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      reportType.value = data?.defaultType ?? MessageReportTypes.Day;
      dateBucket.value = '';
    } else {
      dateBucket.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="消息统计数据落库 (Flush)" class="w-[520px]">
    <div class="p-4 space-y-3">
      <div class="rounded-md bg-blue-50 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300">
        落库操作将把缓存（Redis）中的即时消息统计指标固化计算写入数据库实体表中。
      </div>

      <Form layout="vertical" class="mt-3">
        <FormItem label="报表统计周期类型" required>
          <RadioGroup
            v-model:value="reportType"
            :options="reportTypeOptions"
            option-type="button"
            button-style="solid"
          />
        </FormItem>

        <FormItem label="指定时间桶 (DateBucket - 可选)">
          <Input
            v-model:value="dateBucket"
            placeholder="留空自动计算当前周期。月: 202609, 日: 20260914, 时: 2026091417"
            allow-clear
          />
          <div class="text-[11px] text-muted-foreground mt-1">
            如需重算或补录指定周期，可手动输入相应格式的时间桶整型数值。
          </div>
        </FormItem>
      </Form>
    </div>
  </Modal>
</template>
