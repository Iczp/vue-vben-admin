<script lang="ts" setup>
import type { SecurityReportDto } from '#/api/chat/security';

import { computed, reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Checkbox,
  Descriptions,
  DescriptionsItem,
  Form,
  FormItem,
  Input,
  message,
  Radio,
  RadioGroup,
  Tag,
} from 'antdv-next';

import {
  handleSecurityReportApi,
  SecurityReportStatus,
} from '#/api/chat/security';

import { getReportStatusTag } from '../data';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const currentRecord = ref<null | SecurityReportDto>(null);

const formState = reactive({
  addBlacklist: true,
  auditRemark: '',
  status: SecurityReportStatus.Resolved,
});

const isPending = computed(() => {
  return currentRecord.value?.status === SecurityReportStatus.Pending;
});

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (!currentRecord.value) return;

    modalApi.setState({ confirmLoading: true });
    try {
      await handleSecurityReportApi(currentRecord.value.id, {
        addBlacklist:
          formState.status === SecurityReportStatus.Resolved
            ? formState.addBlacklist
            : false,
        auditRemark: formState.auditRemark.trim(),
        status: formState.status,
      });

      message.success('举报工单处置成功');
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as SecurityReportDto;
      if (data) {
        currentRecord.value = data;
        formState.status =
          data.status === SecurityReportStatus.Pending
            ? SecurityReportStatus.Resolved
            : data.status;
        formState.auditRemark = data.auditRemark || '';
        formState.addBlacklist = true;
      }
    }
  },
  title: '违规举报工单审核与处置',
});
</script>

<template>
  <Modal class="w-[680px]">
    <div v-if="currentRecord" class="space-y-4 py-2">
      <!-- 状态提醒 -->
      <Alert
        v-if="!isPending"
        type="info"
        show-icon
        message="该工单已于此前完成审核处理，如需更改处置结果可重新提交"
      />

      <!-- 举报详情卡片 -->
      <Descriptions
        bordered
        size="small"
        :column="2"
        class="bg-background rounded-md"
      >
        <DescriptionsItem label="目标类型">
          <Tag color="blue">{{ currentRecord.targetType }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="当前状态">
          <component :is="getReportStatusTag(currentRecord.status)" />
        </DescriptionsItem>
        <DescriptionsItem label="举报原因 / 类型" :span="2">
          <Tag color="volcano">{{ currentRecord.reason }}</Tag>
        </DescriptionsItem>
        <DescriptionsItem label="违规目标 / 链接" :span="2">
          <span class="font-mono text-sm break-all font-semibold text-primary">
            {{ currentRecord.targetContent }}
          </span>
        </DescriptionsItem>
        <DescriptionsItem label="举报人 ID">
          <span class="font-mono text-xs">{{
            currentRecord.reporterSessionUnitId || '匿名/未提供'
          }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="提交时间">
          <span class="text-xs">{{ currentRecord.creationTime }}</span>
        </DescriptionsItem>
        <DescriptionsItem label="补充描述" :span="2">
          <span class="text-sm text-foreground/80">{{
            currentRecord.description || '无补充描述'
          }}</span>
        </DescriptionsItem>
      </Descriptions>

      <!-- 审核表单 -->
      <div class="border rounded-md p-4 bg-muted/20">
        <div class="text-sm font-semibold mb-3">审核处理操作</div>
        <Form layout="vertical">
          <FormItem label="处置裁定" required>
            <RadioGroup v-model:value="formState.status">
              <Radio :value="SecurityReportStatus.Resolved">
                <Tag color="success">核实违规并处置</Tag>
              </Radio>
              <Radio :value="SecurityReportStatus.Rejected">
                <Tag color="default">驳回举报 (无违规/误报)</Tag>
              </Radio>
            </RadioGroup>
          </FormItem>

          <FormItem
            v-if="formState.status === SecurityReportStatus.Resolved"
            label="联动处置"
          >
            <Checkbox v-model:checked="formState.addBlacklist">
              自动将违规域名/URL 写入安全风控<span
                class="font-bold text-red-500"
                >【阻断黑名单】</span>并刷新 Redis
            </Checkbox>
          </FormItem>

          <FormItem label="审核说明 / 处理备注">
            <Input.TextArea
              v-model:value="formState.auditRemark"
              :rows="3"
              placeholder="请输入处理结论、依据或回执说明..."
            />
          </FormItem>
        </Form>
      </div>
    </div>
  </Modal>
</template>
