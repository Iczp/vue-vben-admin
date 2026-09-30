<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  message,
  Radio,
  RadioGroup,
} from 'antdv-next';

import { approveArticleApi, rejectArticleApi } from '#/api/cms';

const emit = defineEmits(['success']);

const articleId = ref('');
const articleTitle = ref('');
const action = ref<'approve' | 'reject'>('approve');
const opinion = ref('');

const [Modal, modalApi] = useVbenModal<{ id: string; title: string }>({
  destroyOnClose: true,
  async onConfirm() {
    if (action.value === 'reject' && !opinion.value.trim()) {
      message.error('审核拒绝时必须填写驳回原因');
      return;
    }

    try {
      modalApi.lock();
      if (action.value === 'approve') {
        await approveArticleApi(articleId.value, opinion.value || undefined);
        message.success('文章审核通过');
      } else {
        await rejectArticleApi(articleId.value, {
          opinion: opinion.value,
        });
        message.success('文章已驳回');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('审核操作失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string; title: string } | undefined;
      articleId.value = data?.id || '';
      articleTitle.value = data?.title || '';
      action.value = 'approve';
      opinion.value = '';
    }
  },
  title: '文章内容审核处理',
});
</script>

<template>
  <Modal class="w-[520px]">
    <div class="mb-4 text-sm">
      <span class="text-muted-foreground">审核文章：</span>
      <span class="font-medium">{{ articleTitle }}</span>
    </div>

    <Form layout="vertical">
      <FormItem label="审核结论" required>
        <RadioGroup v-model:value="action">
          <Radio value="approve">审核通过</Radio>
          <Radio value="reject">驳回修改</Radio>
        </RadioGroup>
      </FormItem>

      <FormItem
        :label="action === 'approve' ? '审核评语 (可选)' : '驳回意见 (必填)'"
        :required="action === 'reject'"
      >
        <Input.TextArea
          v-model:value="opinion"
          :placeholder="
            action === 'approve'
              ? '请输入审核意见或通过说明...'
              : '请详细说明未通过审核的原因，便于作者修改...'
          "
          :rows="4"
        />
      </FormItem>
    </Form>
  </Modal>
</template>
