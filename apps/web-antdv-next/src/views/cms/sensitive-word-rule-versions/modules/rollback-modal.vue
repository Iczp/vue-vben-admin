<script setup lang="ts">
import type { SensitiveWordRuleVersionDto } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Form, FormItem, Input, message } from 'antdv-next';

import { rollbackSensitiveWordRuleVersionApi } from '#/api/cms';

const emit = defineEmits<{
  success: [];
}>();

const targetVersion = ref<null | SensitiveWordRuleVersionDto>(null);

const formState = reactive({
  reason: '',
});

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!targetVersion.value?.id) return;
    if (!formState.reason.trim()) {
      message.error('请填写版本回滚原因');
      return;
    }

    try {
      modalApi.setState({ confirmLoading: true });
      await rollbackSensitiveWordRuleVersionApi(targetVersion.value.id, {
        reason: formState.reason.trim(),
      });
      message.success(
        `已成功回滚至版本 v${targetVersion.value.version}！各运行时节点已更新。`,
      );
      modalApi.close();
      emit('success');
    } catch (error: any) {
      console.error('回滚版本失败', error);
      message.error(error?.message || '回滚版本失败');
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as
        | SensitiveWordRuleVersionDto
        | undefined;
      targetVersion.value = data || null;
      if (data) {
        modalApi.setState({ title: `回滚规则版本至 v${data.version}` });
      }
      formState.reason = '';
    } else {
      targetVersion.value = null;
    }
  },
});
</script>

<template>
  <Modal class="w-[560px]">
    <div class="flex flex-col gap-4 py-2">
      <Alert
        type="warning"
        message="版本回滚将立即将线上运行时审核引擎切换为所选历史版本，请谨慎操作。"
        show-icon
      />

      <div
        class="p-3 rounded-lg border bg-gray-50/70 dark:bg-gray-900/50 text-sm flex flex-col gap-1.5"
      >
        <div class="flex justify-between">
          <span class="text-muted-foreground">目标版本:</span>
          <span class="font-bold">v{{ targetVersion?.version }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">词条数量:</span>
          <span>{{ targetVersion?.wordCount }} 条</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">规则集 Hash:</span>
          <span class="font-mono text-xs">{{
            targetVersion?.contentHash
          }}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-muted-foreground">初次发布时间:</span>
          <span>{{ targetVersion?.firstPublishedTime || '-' }}</span>
        </div>
      </div>

      <Form layout="vertical">
        <FormItem label="回滚原因 (必填)" required>
          <Input.TextArea
            v-model:value="formState.reason"
            :rows="3"
            placeholder="例如：发现最新发布版本中存在大面积误报拦截，紧急回滚到稳定版本..."
          />
        </FormItem>
      </Form>
    </div>
  </Modal>
</template>
