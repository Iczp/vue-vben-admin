<script lang="ts" setup>
import type { BatchImportResultDto, SensitiveWordBatchImportInput } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Form,
  FormItem,
  Input,
  message,
  Radio,
  RadioGroup,
  Select,
  Spin,
} from 'antdv-next';

import {
  importSensitiveWordsApi,
  SensitiveRiskLevel,
  SensitiveWordAction,
  SensitiveWordCategories,
} from '#/api/cms';

import { actionOptions, categoryOptions, riskLevelOptions, sceneOptions } from '../data';

const emit = defineEmits(['success']);

const loading = ref(false);
const importResult = ref<BatchImportResultDto | null>(null);

const formState = reactive<SensitiveWordBatchImportInput>({
  conflictStrategy: 'Skip',
  content: '',
  defaultAction: SensitiveWordAction.Review,
  defaultCategory: SensitiveWordCategories.Custom,
  defaultRiskLevel: SensitiveRiskLevel.Medium,
  defaultScene: undefined,
});

function resetState() {
  formState.content = '';
  formState.defaultCategory = SensitiveWordCategories.Custom;
  formState.defaultRiskLevel = SensitiveRiskLevel.Medium;
  formState.defaultAction = SensitiveWordAction.Review;
  formState.defaultScene = undefined;
  formState.conflictStrategy = 'Skip';
  importResult.value = null;
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!formState.content.trim()) {
      message.error('请输入待导入的词库内容');
      return;
    }

    try {
      loading.value = true;
      modalApi.lock();
      const res = await importSensitiveWordsApi({
        conflictStrategy: formState.conflictStrategy,
        content: formState.content,
        defaultAction: formState.defaultAction,
        defaultCategory: formState.defaultCategory,
        defaultRiskLevel: formState.defaultRiskLevel,
        defaultScene: formState.defaultScene,
      });
      importResult.value = res;
      message.success(`导入完成：新增 ${res.createdCount} 条，更新 ${res.updatedCount} 条，跳过 ${res.skippedCount} 条`);
      emit('success');
    } catch (error) {
      console.error('批量导入失败', error);
    } finally {
      loading.value = false;
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
    }
  },
});
</script>

<template>
  <Modal title="批量导入敏感词" class="w-[640px]">
    <Spin :spinning="loading">
      <div class="flex flex-col gap-3 mt-2">
        <Alert
          type="info"
          show-icon
          message="导入规则说明"
          description="支持纯文本每行一个词条（自动应用下方默认属性），或者每行以逗号分隔指定独立属性：词条,分类,风险等级(1-3),处置动作(1-3)。支持以 # 开头的注释行。"
        />

        <div v-if="importResult" class="p-3 border rounded bg-muted/30">
          <div class="font-medium text-sm mb-1 text-primary">最近一次导入汇总：</div>
          <div class="text-xs text-muted-foreground flex flex-wrap gap-4">
            <span>总计提交: {{ importResult.totalCount }}</span>
            <span class="text-emerald-600">成功新增: {{ importResult.createdCount }}</span>
            <span class="text-amber-600">覆盖更新: {{ importResult.updatedCount }}</span>
            <span>已跳过: {{ importResult.skippedCount }}</span>
            <span v-if="importResult.failedCount > 0" class="text-rose-600">失败: {{ importResult.failedCount }}</span>
          </div>
        </div>

        <Form layout="vertical">
          <FormItem label="词库批量文本内容" required>
            <Input.TextArea
              v-model:value="formState.content"
              placeholder="请输入词条列表，每行一个词条，例如：&#10;违禁关键词1&#10;违禁关键词2&#10;违禁关键词3,Fraud,3,3"
              :rows="8"
            />
          </FormItem>

          <div class="grid grid-cols-2 gap-4">
            <FormItem label="默认分类">
              <Select
                v-model:value="formState.defaultCategory"
                :options="categoryOptions"
              />
            </FormItem>

            <FormItem label="默认风险等级">
              <Select
                v-model:value="formState.defaultRiskLevel"
                :options="riskLevelOptions"
              />
            </FormItem>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <FormItem label="默认处置动作">
              <Select
                v-model:value="formState.defaultAction"
                :options="actionOptions"
              />
            </FormItem>

            <FormItem label="默认生效场景">
              <Select
                v-model:value="formState.defaultScene"
                :options="sceneOptions"
                allow-clear
                placeholder="全局通用 (默认)"
              />
            </FormItem>
          </div>

          <FormItem label="遇到已存在同名词条时的策略">
            <RadioGroup v-model:value="formState.conflictStrategy">
              <Radio value="Skip">跳过不处理 (保留原记录)</Radio>
              <Radio value="Overwrite">覆盖更新 (更新为当前分类与处置规则)</Radio>
            </RadioGroup>
          </FormItem>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
