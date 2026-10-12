<script setup lang="ts">
import type { SensitiveWordRulePreviewDto } from '#/api/cms';

import { reactive, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Form,
  FormItem,
  Input,
  message,
  Spin,
} from 'antdv-next';

import {
  previewSensitiveWordRuleVersionApi,
  publishSensitiveWordRuleVersionApi,
} from '#/api/cms';

const emit = defineEmits<{
  success: [];
}>();

const loading = ref(false);
const preview = ref<SensitiveWordRulePreviewDto | null>(null);

const formState = reactive({
  remark: '',
});

async function loadPreview() {
  loading.value = true;
  try {
    preview.value = await previewSensitiveWordRuleVersionApi();
  } catch (error) {
    console.error('获取草稿预览失败', error);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    try {
      modalApi.setState({ confirmLoading: true });
      await publishSensitiveWordRuleVersionApi({
        remark: formState.remark.trim() || undefined,
      });
      message.success('新版本发布成功！运行时节点已收到更新通知。');
      modalApi.close();
      emit('success');
    } catch (error: any) {
      console.error('发布版本失败', error);
      message.error(error?.message || '发布版本失败');
    } finally {
      modalApi.setState({ confirmLoading: false });
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      modalApi.setState({ title: '发布敏感词规则新版本' });
      formState.remark = '';
      loadPreview();
    } else {
      preview.value = null;
    }
  },
});
</script>

<template>
  <Modal class="w-[620px]">
    <Spin :spinning="loading">
      <div class="flex flex-col gap-4 py-2">
        <Alert
          v-if="preview?.hasUnpublishedChanges"
          type="info"
          message="检测到草稿态存在未发布变更，发布后将构建不可变规则引擎快照并热加载到所有业务节点。"
          show-icon
        />
        <Alert
          v-else
          type="warning"
          message="当前草稿态与线上生效版本完全一致，暂无未发布的词条变更。"
          show-icon
        />

        <!-- 草稿指标 -->
        <div class="grid grid-cols-3 gap-3 p-3 rounded-lg border bg-gray-50/70 dark:bg-gray-900/50 text-sm">
          <div>
            <div class="text-xs text-muted-foreground">词条总数</div>
            <div class="text-lg font-bold text-foreground mt-0.5">{{ preview?.totalWords ?? 0 }}</div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">正则词条</div>
            <div class="text-lg font-bold text-foreground mt-0.5">{{ preview?.totalRegexWords ?? 0 }}</div>
          </div>
          <div>
            <div class="text-xs text-muted-foreground">白名单总数</div>
            <div class="text-lg font-bold text-foreground mt-0.5">{{ preview?.totalWhitelists ?? 0 }}</div>
          </div>
          <div class="col-span-3 text-xs text-muted-foreground flex gap-4 pt-1 border-t">
            <span>草稿修订版本: <code>#{{ preview?.currentDraftRevision ?? 0 }}</code></span>
            <span>内容 SHA256: <code class="font-mono">{{ preview?.contentHash ? `${preview.contentHash.slice(0, 12)}...` : '-' }}</code></span>
          </div>
        </div>

        <Form layout="vertical">
          <FormItem label="版本发布说明 (可选)">
            <Input.TextArea
              v-model:value="formState.remark"
              :rows="3"
              placeholder="例如：同步2026年Q4开源违禁词库，修复部分涉诈欺诈误报规则..."
            />
          </FormItem>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
