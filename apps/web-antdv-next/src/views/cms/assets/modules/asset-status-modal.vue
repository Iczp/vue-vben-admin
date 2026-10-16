<script setup lang="ts">
import type { AssetDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  message,
  Radio,
  RadioGroup,
  Spin,
  Tag,
} from 'antdv-next';

import { AssetStatus, updateAssetStatusApi } from '#/api/cms';

const emit = defineEmits<{
  success: [asset: AssetDto];
}>();

const currentAsset = ref<AssetDto | null>(null);
const loading = ref(false);
const status = ref<AssetStatus>(AssetStatus.Normal);

async function handleConfirm() {
  if (!currentAsset.value) return;
  loading.value = true;
  try {
    const updated = await updateAssetStatusApi(currentAsset.value.id, {
      status: status.value,
    });
    message.success('素材状态更新成功');
    emit('success', updated);
    modalApi.close();
  } catch (error) {
    console.error(error);
    message.error('更新素材状态失败');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  onConfirm: handleConfirm,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as undefined | { asset?: AssetDto };
      if (data?.asset) {
        currentAsset.value = data.asset;
        status.value = data.asset.status;
      }
    }
  },
  title: '修改素材状态',
});
</script>

<template>
  <Modal class="w-[500px]">
    <Spin :spinning="loading">
      <div v-if="currentAsset" class="py-2 space-y-4">
        <div
          class="flex items-center justify-between p-3 border rounded bg-muted/20 text-xs"
        >
          <div
            class="font-medium text-sm text-foreground truncate"
            :title="currentAsset.fileName"
          >
            {{ currentAsset.fileName }}
          </div>
          <Tag color="blue">
{{
            currentAsset.extension || currentAsset.mimeType
          }}
</Tag>
        </div>

        <Form layout="vertical">
          <FormItem label="变更素材状态" required>
            <RadioGroup v-model:value="status" class="flex flex-col gap-3">
              <Radio :value="AssetStatus.Normal">
                <span class="font-medium">正常</span>
                <span class="text-xs text-muted-foreground ml-2">素材处于可用状态，正常对外提供访问</span>
              </Radio>
              <Radio :value="AssetStatus.Disabled">
                <span class="font-medium text-destructive">已禁用</span>
                <span class="text-xs text-muted-foreground ml-2">禁止外部访问并保留引用，已被引用的素材建议在此禁用</span>
              </Radio>
              <Radio :value="AssetStatus.Processing">
                <span class="font-medium text-primary">处理中</span>
                <span class="text-xs text-muted-foreground ml-2">媒体后台转码或截图中</span>
              </Radio>
              <Radio :value="AssetStatus.Failed">
                <span class="font-medium text-warning">处理失败</span>
                <span class="text-xs text-muted-foreground ml-2">素材上传或转码异常</span>
              </Radio>
            </RadioGroup>
          </FormItem>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
