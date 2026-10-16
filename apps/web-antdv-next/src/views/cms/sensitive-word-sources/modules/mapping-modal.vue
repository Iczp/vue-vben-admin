<script lang="ts" setup>
import type { SensitiveWordMappingProfileDto } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { Check } from '@vben/icons';

import {
  Alert,
  Button,
  Form,
  FormItem,
  Input,
  message,
  Select,
} from 'antdv-next';

import {
  createSensitiveWordMappingProfileApi,
  getSensitiveWordMappingProfileApi,
  ModerationScene,
  SensitiveRiskLevel,
  SensitiveWordAction,
  updateSensitiveWordMappingProfileApi,
  validateSensitiveWordMappingProfileApi,
} from '#/api/cms';

import {
  actionOptions,
  riskLevelOptions,
  sceneOptions,
} from '../../sensitive-words/data';

const emit = defineEmits<{
  success: [];
}>();

const isUpdate = ref(false);
const recordId = ref<string>();
const validating = ref(false);
const validationMessage = ref<string>();
const validationStatus = ref<'error' | 'success' | null>(null);

const formState = reactive({
  categoryMappingsJson:
    '{\n  "politics": "Political",\n  "porn": "Sexual",\n  "violence": "Violence",\n  "ad": "Advertisement"\n}',
  code: '',
  defaultAction: SensitiveWordAction.Reject,
  defaultRiskLevel: SensitiveRiskLevel.High,
  defaultScene: ModerationScene.General as ModerationScene | undefined,
  name: '',
  remark: '',
});

function handleFormatJson() {
  try {
    const parsed = JSON.parse(formState.categoryMappingsJson);
    formState.categoryMappingsJson = JSON.stringify(parsed, null, 2);
    message.success('JSON 格式化成功');
  } catch (error: any) {
    message.error(`JSON 语法错误: ${error.message}`);
  }
}

async function handleValidateJson() {
  try {
    JSON.parse(formState.categoryMappingsJson);
  } catch (error: any) {
    validationStatus.value = 'error';
    validationMessage.value = `JSON 本地解析失败: ${error.message}`;
    return;
  }

  if (recordId.value) {
    validating.value = true;
    try {
      const res = await validateSensitiveWordMappingProfileApi(recordId.value);
      if (res.isValid) {
        validationStatus.value = 'success';
        validationMessage.value = `校验通过！已解析 ${res.mappingCount} 条分类映射项。`;
      } else {
        validationStatus.value = 'error';
        validationMessage.value = `校验未通过: ${res.errors.join('; ')}`;
      }
    } catch (error: any) {
      validationStatus.value = 'error';
      validationMessage.value = `服务端校验失败: ${error?.message || error}`;
    } finally {
      validating.value = false;
    }
  } else {
    validationStatus.value = 'success';
    validationMessage.value = 'JSON 本地语法合法有效。';
  }
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      modalApi.setState({ confirmLoading: true });
      if (isUpdate.value && recordId.value) {
        await updateSensitiveWordMappingProfileApi(recordId.value, {
          categoryMappingsJson:
            formState.categoryMappingsJson.trim() || undefined,
          defaultAction: formState.defaultAction,
          defaultRiskLevel: formState.defaultRiskLevel,
          defaultScene: formState.defaultScene,
          name: formState.name,
          remark: formState.remark.trim() || undefined,
        });
        message.success('分类映射配置更新成功');
      } else {
        await createSensitiveWordMappingProfileApi({
          categoryMappingsJson:
            formState.categoryMappingsJson.trim() || undefined,
          code: formState.code,
          defaultAction: formState.defaultAction,
          defaultRiskLevel: formState.defaultRiskLevel,
          defaultScene: formState.defaultScene,
          name: formState.name,
          remark: formState.remark.trim() || undefined,
        });
        message.success('分类映射配置创建成功');
      }
      modalApi.close();
      emit('success');
    } catch (error: any) {
      console.error('保存分类映射失败', error);
      message.error(error?.message || '保存失败');
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange: async (isOpen) => {
    if (isOpen) {
      const data = modalApi.getData() as
        | SensitiveWordMappingProfileDto
        | undefined;
      validationStatus.value = null;
      validationMessage.value = undefined;
      if (data?.id) {
        isUpdate.value = true;
        recordId.value = data.id;
        modalApi.setState({ title: `编辑分类映射配置 - ${data.name}` });
        try {
          const detail = await getSensitiveWordMappingProfileApi(data.id);
          formState.code = detail.code;
          formState.name = detail.name;
          formState.defaultRiskLevel = detail.defaultRiskLevel;
          formState.defaultAction = detail.defaultAction;
          formState.defaultScene = detail.defaultScene;
          formState.categoryMappingsJson = detail.categoryMappingsJson || '{}';
          formState.remark = detail.remark || '';
        } catch (error) {
          console.error('获取分类映射详情失败', error);
        }
      } else {
        isUpdate.value = false;
        recordId.value = undefined;
        modalApi.setState({ title: '新建分类映射配置' });
        formState.code = '';
        formState.name = '';
        formState.defaultRiskLevel = SensitiveRiskLevel.High;
        formState.defaultAction = SensitiveWordAction.Reject;
        formState.defaultScene = ModerationScene.General;
        formState.categoryMappingsJson =
          '{\n  "politics": "Political",\n  "porn": "Sexual",\n  "violence": "Violence",\n  "ad": "Advertisement"\n}';
        formState.remark = '';
      }
    }
  },
});
</script>

<template>
  <Modal class="w-[720px]">
    <Form layout="vertical" class="py-2">
      <div class="grid grid-cols-2 gap-4">
        <FormItem label="映射配置编码" required>
          <Input
            v-model:value="formState.code"
            placeholder="例如: github-dict-mapping"
            :disabled="isUpdate"
          />
        </FormItem>

        <FormItem label="映射配置名称" required>
          <Input
            v-model:value="formState.name"
            placeholder="例如: GitHub开源敏感词分类映射"
          />
        </FormItem>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <FormItem label="默认风险等级" required>
          <Select
            v-model:value="formState.defaultRiskLevel"
            :options="riskLevelOptions"
          />
        </FormItem>

        <FormItem label="默认处置动作" required>
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
          />
        </FormItem>
      </div>

      <FormItem label="分类映射规则 (JSON Key-Value)">
        <div
          class="flex items-center justify-between pb-1 text-xs text-muted-foreground"
        >
          <span>键为外部词库分类名，值为系统内置分类枚举字符串</span>
          <div class="flex items-center gap-2">
            <Button size="small" type="link" @click="handleFormatJson">
              格式化
            </Button>
            <Button
              size="small"
              type="link"
              :loading="validating"
              @click="handleValidateJson"
            >
              <template #icon><Check class="size-3" /></template>
              校验语法
            </Button>
          </div>
        </div>
        <Input.TextArea
          v-model:value="formState.categoryMappingsJson"
          :rows="8"
          class="font-mono text-xs"
          placeholder="{\n  &quot;politics&quot;: &quot;Political&quot;,\n  &quot;porn&quot;: &quot;Sexual&quot;\n}"
        />
      </FormItem>

      <Alert
        v-if="validationStatus"
        :type="validationStatus"
        :message="validationMessage"
        show-icon
        class="mb-3"
      />

      <FormItem label="备注">
        <Input.TextArea
          v-model:value="formState.remark"
          :rows="2"
          placeholder="说明映射规则的用途或适用范围..."
        />
      </FormItem>
    </Form>
  </Modal>
</template>
