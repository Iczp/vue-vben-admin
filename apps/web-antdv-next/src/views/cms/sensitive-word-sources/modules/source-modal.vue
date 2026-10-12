<script lang="ts" setup>
import type { SensitiveWordMappingProfileDto, SensitiveWordSourceDto } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
  Switch,
} from 'antdv-next';

import {
  createSensitiveWordSourceApi,
  getSensitiveWordMappingProfilesApi,
  getSensitiveWordSourceApi,
  SensitiveWordSourceType,
  SensitiveWordSyncMode,
  updateSensitiveWordSourceApi,
} from '#/api/cms';

import { sourceTypeOptions, syncModeOptions } from '../data';

const emit = defineEmits<{
  success: [];
}>();

const isUpdate = ref(false);
const recordId = ref<string>();
const mappingProfiles = ref<SensitiveWordMappingProfileDto[]>([]);

const formState = reactive({
  autoSync: false,
  branch: 'main',
  checkIntervalSeconds: 86400,
  code: '',
  fileManifestJson: '',
  isEnabled: true,
  mappingProfileId: undefined as string | undefined,
  name: '',
  priority: 100,
  sourceType: SensitiveWordSourceType.Git,
  sourceUri: '',
  syncMode: SensitiveWordSyncMode.ReviewBeforeApply,
});

async function loadMappingProfiles() {
  try {
    const res = await getSensitiveWordMappingProfilesApi({ maxResultCount: 100 });
    mappingProfiles.value = res.items || [];
  } catch (error) {
    console.error('加载分类映射失败', error);
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
        await updateSensitiveWordSourceApi(recordId.value, {
          autoSync: formState.autoSync,
          branch: formState.branch || undefined,
          checkIntervalSeconds: formState.checkIntervalSeconds,
          fileManifestJson: formState.fileManifestJson.trim() || undefined,
          mappingProfileId: formState.mappingProfileId,
          name: formState.name,
          priority: formState.priority,
          sourceUri: formState.sourceUri,
          syncMode: formState.syncMode,
        });
        message.success('数据源更新成功');
      } else {
        await createSensitiveWordSourceApi({
          autoSync: formState.autoSync,
          branch: formState.branch || undefined,
          checkIntervalSeconds: formState.checkIntervalSeconds,
          code: formState.code,
          fileManifestJson: formState.fileManifestJson.trim() || undefined,
          isEnabled: formState.isEnabled,
          mappingProfileId: formState.mappingProfileId,
          name: formState.name,
          priority: formState.priority,
          sourceType: formState.sourceType,
          sourceUri: formState.sourceUri,
          syncMode: formState.syncMode,
        });
        message.success('数据源创建成功');
      }
      modalApi.close();
      emit('success');
    } catch (error: any) {
      console.error(error);
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      loadMappingProfiles();
      const data = modalApi.getData() as SensitiveWordSourceDto | undefined;
      if (data && data.id) {
        isUpdate.value = true;
        recordId.value = data.id;
        modalApi.setState({ title: '编辑词库数据源' });
        getSensitiveWordSourceApi(data.id).then((detail) => {
          formState.code = detail.code;
          formState.name = detail.name;
          formState.sourceType = detail.sourceType;
          formState.sourceUri = detail.sourceUri;
          formState.branch = detail.branch || '';
          formState.priority = detail.priority;
          formState.syncMode = detail.syncMode;
          formState.autoSync = detail.autoSync;
          formState.checkIntervalSeconds = detail.checkIntervalSeconds || 86400;
          formState.mappingProfileId = detail.mappingProfileId;
          formState.fileManifestJson = detail.fileManifestJson || '';
        });
      } else {
        isUpdate.value = false;
        recordId.value = undefined;
        modalApi.setState({ title: '新建词库数据源' });
        formState.code = '';
        formState.name = '';
        formState.sourceType = SensitiveWordSourceType.Git;
        formState.sourceUri = '';
        formState.branch = 'main';
        formState.priority = 100;
        formState.syncMode = SensitiveWordSyncMode.ReviewBeforeApply;
        formState.autoSync = false;
        formState.checkIntervalSeconds = 86400;
        formState.mappingProfileId = undefined;
        formState.fileManifestJson = '';
      }
    }
  },
});
</script>

<template>
  <Modal>
    <Form layout="vertical" class="px-2">
      <FormItem label="数据源编码" required>
        <Input
          v-model:value="formState.code"
          :disabled="isUpdate"
          placeholder="例如：OFFICIAL_GIT_SOURCE"
        />
      </FormItem>

      <FormItem label="数据源名称" required>
        <Input
          v-model:value="formState.name"
          placeholder="例如：开源主库敏感词源"
        />
      </FormItem>

      <div class="grid grid-cols-2 gap-4">
        <FormItem label="数据源类型" required>
          <Select
            v-model:value="formState.sourceType"
            :disabled="isUpdate"
            :options="sourceTypeOptions"
          />
        </FormItem>

        <FormItem label="优先级 (数值越小优先级越高)">
          <InputNumber
            v-model:value="formState.priority"
            class="w-full"
            :min="1"
            :max="1000"
          />
        </FormItem>
      </div>

      <FormItem label="源地址 URI" required extra="支持 Git Clone 地址、HTTP(S) 文本链接或服务器受信本地路径">
        <Input
          v-model:value="formState.sourceUri"
          placeholder="https://github.com/example/sensitive-words.git"
        />
      </FormItem>

      <div v-if="formState.sourceType === SensitiveWordSourceType.Git" class="grid grid-cols-2 gap-4">
        <FormItem label="Git 分支">
          <Input
            v-model:value="formState.branch"
            placeholder="master 或 main"
          />
        </FormItem>

        <FormItem label="检查周期 (秒)">
          <InputNumber
            v-model:value="formState.checkIntervalSeconds"
            class="w-full"
            :min="60"
          />
        </FormItem>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <FormItem label="同步模式" required>
          <Select
            v-model:value="formState.syncMode"
            :options="syncModeOptions"
          />
        </FormItem>

        <FormItem label="分类映射配置 Profile">
          <Select
            v-model:value="formState.mappingProfileId"
            allow-clear
            placeholder="可选分类映射配置"
            :options="mappingProfiles.map(p => ({ label: `${p.name} (${p.code})`, value: p.id }))"
          />
        </FormItem>
      </div>

      <div class="flex items-center gap-6 mb-4">
        <div class="flex items-center gap-2">
          <span>启用自动同步:</span>
          <Switch v-model:checked="formState.autoSync" />
        </div>
      </div>

      <FormItem label="文件清单配置 (Manifest JSON)" extra="若不填将使用根目录下的默认识别规则">
        <Input.TextArea
          v-model:value="formState.fileManifestJson"
          :rows="4"
          placeholder='{"files": [{"filePath": "dict.txt", "category": "Political", "parser": "LineByLine"}]}'
        />
      </FormItem>
    </Form>
  </Modal>
</template>
