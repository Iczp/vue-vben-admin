<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { DatePicker, Form, FormItem, message } from 'antdv-next';
import dayjs from 'dayjs';

import { scheduleArticleApi } from '#/api/cms';

const emit = defineEmits(['success']);

const articleId = ref('');
const articleTitle = ref('');
const publishTime = ref<any>(null);

const [Modal, modalApi] = useVbenModal<{ id: string; title: string }>({
  destroyOnClose: true,
  async onConfirm() {
    if (!publishTime.value) {
      message.error('请选择定时发布时间');
      return;
    }
    if (publishTime.value.isBefore(dayjs())) {
      message.warning('定时发布时间必须大于当前时间');
      return;
    }

    try {
      modalApi.lock();
      await scheduleArticleApi(articleId.value, {
        scheduledPublishTime: publishTime.value.toISOString(),
      });
      message.success('已设置定时发布时间');
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('设置定时发布失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string; title: string } | undefined;
      articleId.value = data?.id || '';
      articleTitle.value = data?.title || '';
      publishTime.value = dayjs().add(1, 'hour');
    }
  },
  title: '文章定时发布设置',
});
</script>

<template>
  <Modal class="w-[460px]">
    <div class="mb-4 text-sm">
      <span class="text-muted-foreground">设置文章：</span>
      <span class="font-medium">{{ articleTitle }}</span>
    </div>

    <Form layout="vertical">
      <FormItem label="计划发布时间" required extra="系统后台工作任务到达指定时间后将自动执行发布并生成快照">
        <DatePicker
          v-model:value="publishTime"
          show-time
          class="w-full"
          placeholder="请选择预计自动发布时间"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
