<script lang="ts" setup>
import type { ContentModerationDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Card,
  Descriptions,
  DescriptionsItem,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  Radio,
  RadioGroup,
  Spin,
  Table,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getModerationApi, reviewModerationApi } from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref('');
const moderationData = ref<ContentModerationDto | null>(null);

const isApproved = ref(true);
const opinion = ref('');

const itemColumns = [
  { dataIndex: 'itemKey', title: '检验字段/条目', width: 130 },
  { dataIndex: 'riskLabel', title: '风险类型/标签', width: 130 },
  { dataIndex: 'riskScore', title: '风险评分', width: 90 },
  { dataIndex: 'matchedContext', title: '命中上下文/关键词', ellipsis: true },
];

async function loadDetail(id: string) {
  loading.value = true;
  try {
    moderationData.value = await getModerationApi(id);
  } catch (error) {
    console.error('获取机审详情失败', error);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal<{ id: string }>({
  destroyOnClose: true,
  fullscreenButton: true,
  async onConfirm() {
    try {
      modalApi.lock();
      await reviewModerationApi(recordId.value, {
        isApproved: isApproved.value,
        opinion: opinion.value || undefined,
      });
      message.success('人工复核裁决已提交');
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('裁决提交失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string } | undefined;
      recordId.value = data?.id || '';
      isApproved.value = true;
      opinion.value = '';
      if (recordId.value) {
        loadDetail(recordId.value);
      }
    }
  },
  title: '风控机审详情与人工裁决',
});
</script>

<template>
  <Modal class="w-[800px] max-w-full">
    <Spin :spinning="loading">
      <div v-if="moderationData">
        <!-- 基础报告概述 -->
        <Descriptions bordered size="small" :column="2" class="mb-4">
          <DescriptionsItem label="目标实体类型">
            {{ moderationData.entityType }}
          </DescriptionsItem>
          <DescriptionsItem label="目标实体 ID">
            <span class="font-mono text-xs">{{ moderationData.entityId }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="审核服务引擎">
            {{ moderationData.provider }}
          </DescriptionsItem>
          <DescriptionsItem label="完成时间">
            {{
              moderationData.completedTime
                ? dayjs(moderationData.completedTime).format(
                    'YYYY-MM-DD HH:mm:ss',
                  )
                : '-'
            }}
          </DescriptionsItem>
          <DescriptionsItem label="处置建议" :span="2">
            {{ moderationData.suggestion || '无明确建议' }}
          </DescriptionsItem>
        </Descriptions>

        <!-- 违规详情项 -->
        <div class="font-medium text-sm mb-2">机审检出条目清单</div>
        <Table
          :columns="itemColumns"
          :data-source="moderationData.items || []"
          row-key="id"
          size="small"
          :pagination="false"
          class="mb-4"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'riskScore'">
              <span
                :class="
                  record.riskScore > 0.6 ? 'text-red-500 font-bold' : 'text-foreground'
                "
              >
                {{ record.riskScore }}
              </span>
            </template>
            <template v-else-if="column.dataIndex === 'matchedContext'">
              <span class="text-xs text-red-600 bg-red-50 dark:bg-red-950/30 px-1 py-0.5 rounded">
                {{ record.matchedContext || '未检出关键词' }}
              </span>
            </template>
          </template>
        </Table>

        <Divider />

        <!-- 人工复核终审表单 -->
        <Card title="人工复审终审决策" size="small" class="bg-muted/10">
          <Form layout="vertical">
            <FormItem label="人工裁定结论" required>
              <RadioGroup v-model:value="isApproved">
                <Radio :value="true">准予合规通过</Radio>
                <Radio :value="false">确认为违规并驳回</Radio>
              </RadioGroup>
            </FormItem>

            <FormItem label="复审意见说明">
              <Input.TextArea
                v-model:value="opinion"
                placeholder="请输入人工复审说明或批注..."
                :rows="3"
              />
            </FormItem>
          </Form>
        </Card>
      </div>
    </Spin>
  </Modal>
</template>
