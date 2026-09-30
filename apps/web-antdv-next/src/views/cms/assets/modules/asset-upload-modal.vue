<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import { message, Spin, UploadDragger } from 'antdv-next';

import { uploadAssetApi } from '#/api/cms';

const UploadIcon = createIconifyIcon('lucide:upload-cloud');

const emit = defineEmits(['success']);

const loading = ref(false);
const fileList = ref<any[]>([]);

async function customRequest(options: any) {
  const { file, onSuccess, onError } = options;
  loading.value = true;
  try {
    const res = await uploadAssetApi(file as File);
    message.success(`文件【${file.name}】上传成功`);
    onSuccess(res);
    emit('success');
  } catch (error) {
    message.error(`文件【${file.name}】上传失败`);
    onError(error);
  } finally {
    loading.value = false;
  }
}

const [Modal] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      fileList.value = [];
    }
  },
  title: '上传素材文件',
});
</script>

<template>
  <Modal class="w-[560px]">
    <Spin :spinning="loading">
      <div class="py-2">
        <UploadDragger
          v-model:file-list="fileList"
          name="file"
          :multiple="true"
          :custom-request="customRequest"
          :show-upload-list="true"
        >
          <p class="ant-upload-drag-icon flex justify-center py-4">
            <UploadIcon class="size-12 text-primary" />
          </p>
          <p class="ant-upload-text font-medium text-base">
            点击或将文件拖拽至此区域上传
          </p>
          <p class="ant-upload-hint text-xs text-muted-foreground px-4">
            支持图片 (PNG/JPG/GIF/WebP)、视频 (MP4/WebM)、音频与常用文档。系统将自动存储至统一对象存储并返回可访问链接。
          </p>
        </UploadDragger>
      </div>
    </Spin>
  </Modal>
</template>
