<script lang="ts" setup>
import type { AssetDto } from '#/api/cms';

import { computed, ref } from 'vue';

import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Empty,
  Image,
  Input,
  InputSearch,
  message,
  Modal,
  Pagination,
  Spin,
  Tabs,
  UploadDragger,
} from 'antdv-next';

import { AssetType, getAssetsApi, uploadAssetApi } from '#/api/cms';

const ImageIcon = createIconifyIcon('lucide:image');
const UploadIcon = createIconifyIcon('lucide:upload-cloud');

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    placeholder?: string;
    value?: string;
  }>(),
  {
    disabled: false,
    placeholder: '请输入或选择媒体/封面图片 URL',
    value: '',
  },
);

const emit = defineEmits<{
  'update:value': [val: string];
}>();

const modelValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val),
});

// Modal State
const isModalVisible = ref(false);
const activeTab = ref('library');
const loading = ref(false);
const assetList = ref<AssetDto[]>([]);
const totalCount = ref(0);
const page = ref(1);
const pageSize = ref(12);
const searchKeyword = ref('');
const selectedAssetUrl = ref('');

// Uploading State
const uploading = ref(false);

async function loadAssets() {
  loading.value = true;
  try {
    const res = await getAssetsApi({
      keyword: searchKeyword.value || undefined,
      maxResultCount: pageSize.value,
      skipCount: (page.value - 1) * pageSize.value,
      type: AssetType.Image,
    });
    assetList.value = res.items || [];
    totalCount.value = res.totalCount || 0;
  } catch (error) {
    console.error('加载素材库失败', error);
  } finally {
    loading.value = false;
  }
}

function openSelectorModal() {
  if (props.disabled) return;
  selectedAssetUrl.value = modelValue.value || '';
  isModalVisible.value = true;
  page.value = 1;
  loadAssets();
}

function handleSelectAsset(asset: AssetDto) {
  const url = asset.sourceUrl || asset.blobName;
  if (url) {
    selectedAssetUrl.value = url;
  }
}

function handleConfirmSelection() {
  if (!selectedAssetUrl.value) {
    message.warning('请选择一张图片');
    return;
  }
  modelValue.value = selectedAssetUrl.value;
  isModalVisible.value = false;
}

async function handleCustomUpload(options: any) {
  const { file, onSuccess, onError } = options;
  uploading.value = true;
  try {
    const res = await uploadAssetApi(file as File);
    message.success(`文件【${file.name}】上传成功`);
    onSuccess(res);
    const newUrl = res.sourceUrl || res.blobName;
    if (newUrl) {
      selectedAssetUrl.value = newUrl;
      modelValue.value = newUrl;
      isModalVisible.value = false;
    }
  } catch (error) {
    message.error(`文件【${file.name}】上传失败`);
    onError(error);
  } finally {
    uploading.value = false;
  }
}
</script>

<template>
  <div class="flex items-center gap-3 w-full">
    <div class="flex-1">
      <Input
        v-model:value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        allow-clear
      />
    </div>

    <!-- 预览图 -->
    <div
      v-if="modelValue"
      class="size-10 border rounded overflow-hidden shrink-0 flex items-center justify-center bg-muted/20"
    >
      <Image
        :src="modelValue"
        :width="40"
        :height="40"
        class="object-cover"
        fallback="https://via.placeholder.com/40"
      />
    </div>

    <!-- 选择器触发按钮 -->
    <Button :disabled="disabled" @click="openSelectorModal">
      <template #icon>
        <ImageIcon class="size-4 mr-1 inline-block align-middle" />
      </template>
      选择图片
    </Button>

    <!-- 弹窗：选择素材或直接上传 -->
    <Modal
      v-model:open="isModalVisible"
      title="选择素材文件"
      :width="760"
      destroy-on-close
      @ok="handleConfirmSelection"
    >
      <Tabs v-model:activeKey="activeTab">
        <!-- 选项卡 1：从素材库选择 -->
        <Tabs.TabPane key="library" tab="素材图库">
          <div class="flex items-center justify-between gap-4 mb-4 mt-2">
            <InputSearch
              v-model:value="searchKeyword"
              placeholder="搜索素材文件名..."
              class="max-w-[300px]"
              allow-clear
              @search="() => { page = 1; loadAssets(); }"
            />
          </div>

          <Spin :spinning="loading">
            <div
              v-if="assetList.length > 0"
              class="grid grid-cols-4 gap-3 max-h-[380px] overflow-y-auto p-1"
            >
              <div
                v-for="item in assetList"
                :key="item.id"
                class="group relative border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md"
                :class="[
                  selectedAssetUrl === (item.sourceUrl || item.blobName)
                    ? 'border-primary ring-2 ring-primary/30'
                    : 'border-border',
                ]"
                @click="handleSelectAsset(item)"
              >
                <div class="w-full h-24 bg-muted/20 flex items-center justify-center overflow-hidden">
                  <img
                    :src="item.sourceUrl || item.blobName"
                    :alt="item.fileName"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                </div>
                <div class="p-1.5 text-xs truncate bg-background text-foreground" :title="item.fileName">
                  {{ item.fileName }}
                </div>
              </div>
            </div>
            <Empty v-else description="暂无符合条件的素材" class="py-8" />

            <div v-if="totalCount > pageSize" class="flex justify-end mt-4">
              <Pagination
                v-model:current="page"
                :page-size="pageSize"
                :total="totalCount"
                size="small"
                show-less-items
                @change="loadAssets"
              />
            </div>
          </Spin>
        </Tabs.TabPane>

        <!-- 选项卡 2：本地上传新素材 -->
        <Tabs.TabPane key="upload" tab="上传新图片">
          <Spin :spinning="uploading">
            <div class="py-6">
              <UploadDragger
                name="file"
                :multiple="false"
                :custom-request="handleCustomUpload"
                :show-upload-list="false"
                accept="image/*"
              >
                <p class="ant-upload-drag-icon flex justify-center py-4">
                  <UploadIcon class="size-12 text-primary" />
                </p>
                <p class="ant-upload-text font-medium text-base">
                  点击或将图片拖拽到此处上传
                </p>
                <p class="ant-upload-hint text-xs text-muted-foreground mt-1">
                  支持 JPG、PNG、WEBP、GIF 等主流格式图片，上传后将自动选中
                </p>
              </UploadDragger>
            </div>
          </Spin>
        </Tabs.TabPane>
      </Tabs>
    </Modal>
  </div>
</template>
