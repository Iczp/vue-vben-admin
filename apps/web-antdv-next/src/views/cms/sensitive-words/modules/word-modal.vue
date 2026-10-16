<script lang="ts" setup>
import type {
  CreateSensitiveWordInput,
  SensitiveWordDto,
  UpdateSensitiveWordInput,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  message,
  Select,
  Spin,
  Switch,
} from 'antdv-next';

import {
  createSensitiveWordApi,
  getSensitiveWordApi,
  ModerationScene,
  SensitiveRiskLevel,
  SensitiveWordAction,
  SensitiveWordCategories,
  updateSensitiveWordApi,
} from '#/api/cms';

import {
  actionOptions,
  categoryOptions,
  riskLevelOptions,
  sceneOptions,
} from '../data';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑敏感词' : '新建敏感词'));

const word = ref('');
const category = ref<string>(SensitiveWordCategories.Custom);
const riskLevel = ref(SensitiveRiskLevel.Medium);
const action = ref(SensitiveWordAction.Review);
const scene = ref<ModerationScene | undefined>(undefined);
const isRegex = ref(false);
const remark = ref('');

function resetState() {
  recordId.value = null;
  word.value = '';
  category.value = SensitiveWordCategories.Custom;
  riskLevel.value = SensitiveRiskLevel.Medium;
  action.value = SensitiveWordAction.Review;
  scene.value = undefined;
  isRegex.value = false;
  remark.value = '';
}

async function initData(record?: SensitiveWordDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getSensitiveWordApi(record.id);
      word.value = detail.word;
      category.value = detail.category;
      riskLevel.value = detail.riskLevel;
      action.value = detail.action;
      scene.value = detail.scene;
      isRegex.value = detail.isRegex;
      remark.value = detail.remark || '';
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<SensitiveWordDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!word.value.trim()) {
      message.error('请输入敏感词原词');
      return;
    }
    if (!category.value.trim()) {
      message.error('请选择风险分类');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: UpdateSensitiveWordInput = {
          action: action.value,
          category: category.value,
          isRegex: isRegex.value,
          remark: remark.value || undefined,
          riskLevel: riskLevel.value,
          scene: scene.value,
        };
        await updateSensitiveWordApi(recordId.value, updateData);
        message.success('敏感词更新成功');
      } else {
        const createData: CreateSensitiveWordInput = {
          action: action.value,
          category: category.value,
          isRegex: isRegex.value,
          remark: remark.value || undefined,
          riskLevel: riskLevel.value,
          scene: scene.value,
          word: word.value.trim(),
        };
        await createSensitiveWordApi(createData);
        message.success('敏感词创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存敏感词失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as SensitiveWordDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[560px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <FormItem label="敏感词词条" required>
          <Input
            v-model:value="word"
            :disabled="isEdit"
            placeholder="请输入敏感关键词（或正则表达式）"
            :maxlength="128"
          />
        </FormItem>

        <div class="grid grid-cols-2 gap-4">
          <FormItem label="风险分类" required>
            <Select
              v-model:value="category"
              :options="categoryOptions"
              placeholder="选择风险分类"
            />
          </FormItem>

          <FormItem label="风险等级" required>
            <Select
              v-model:value="riskLevel"
              :options="riskLevelOptions"
              placeholder="选择风险等级"
            />
          </FormItem>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <FormItem label="处置动作" required>
            <Select
              v-model:value="action"
              :options="actionOptions"
              placeholder="选择触发动作"
            />
          </FormItem>

          <FormItem label="生效业务场景">
            <Select
              v-model:value="scene"
              :options="sceneOptions"
              allow-clear
              placeholder="全局通用 (默认)"
            />
          </FormItem>
        </div>

        <div
          class="flex items-center justify-between p-3 border rounded bg-muted/20 mb-4"
        >
          <div>
            <div class="font-medium text-sm">正则表达式匹配</div>
            <div class="text-xs text-muted-foreground">
              若开启，将按正则 Pattern 进行文本匹配评估
            </div>
          </div>
          <Switch v-model:checked="isRegex" />
        </div>

        <FormItem label="备注说明">
          <Input.TextArea
            v-model:value="remark"
            placeholder="请输入敏感词添加原因、来源或相关策略说明..."
            :rows="3"
            :maxlength="512"
          />
        </FormItem>
      </Form>
    </Spin>
  </Modal>
</template>
