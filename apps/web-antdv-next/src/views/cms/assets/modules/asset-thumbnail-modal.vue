<script setup lang="ts">
import type { AssetDto } from '#/api/cms';

import { markRaw, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';

import {
  Button,
  Divider,
  message,
  RadioButton,
  RadioGroup,
  Slider,
  Spin,
  Tag,
  Upload,
} from 'antdv-next';

import { setAssetThumbnailApi } from '#/api/cms';
import {
  createThumbnailFromFile,
  extractVideoFrame,
} from '#/api/cms/media-metadata';

const VideoIcon = markRaw(createIconifyIcon('lucide:video'));
const ImageIcon = markRaw(createIconifyIcon('lucide:image'));

const emit = defineEmits<{
  success: [asset: AssetDto];
}>();

const currentAsset = ref<AssetDto | null>(null);
const loading = ref(false);
const extracting = ref(false);

// 封面模式: 'auto' (提取视频帧), 'custom' (用户自定义上传图片)
const coverMode = ref<'auto' | 'custom'>('auto');

// 视频时间进度提取
const captureTime = ref(0.1);
const videoDuration = ref(0);

// 当前选定的封面 File 与预览 DataURL
const currentThumbnailFile = ref<File | null>(null);
const currentThumbnailUrl = ref<string>('');

// 重置状态
function resetState() {
  loading.value = false;
  extracting.value = false;
  coverMode.value = 'auto';
  captureTime.value = 0.1;
  videoDuration.value = currentAsset.value?.duration || 0;
  currentThumbnailFile.value = null;
  currentThumbnailUrl.value = currentAsset.value?.thumbnailUrl || '';
}

// 提取视频帧
async function doExtractVideoFrame(timeSec: number) {
  if (!currentAsset.value?.url) return;
  extracting.value = true;
  try {
    const res = await extractVideoFrame(currentAsset.value.url, timeSec);
    if (res.duration > 0) {
      videoDuration.value = res.duration;
    }
    currentThumbnailFile.value = res.file;
    currentThumbnailUrl.value = res.dataUrl;
  } catch (error) {
    console.error('视频帧提取失败', error);
    message.warning('未能从视频提取帧画面，支持手动上传自定义封面图片');
  } finally {
    extracting.value = false;
  }
}

// 视频滑块松开/改变提取时间
function onSliderChange(value: number) {
  captureTime.value = value;
  void doExtractVideoFrame(value);
}

// 自定义上传封面图片
async function onCustomCoverSelected(file: File) {
  if (!file.type.startsWith('image/')) {
    message.error('封面必须为图片格式 (JPG/PNG/WebP等)');
    return false;
  }
  extracting.value = true;
  try {
    const thumb = await createThumbnailFromFile(file);
    currentThumbnailFile.value = thumb.file;
    currentThumbnailUrl.value = URL.createObjectURL(thumb.file);
    message.success('已应用自定义封面图片');
  } catch (e) {
    message.error('封面图片处理失败');
  } finally {
    extracting.value = false;
  }
  return false;
}

// 保存修改封面
async function handleSaveThumbnail() {
  if (!currentAsset.value) return;
  if (!currentThumbnailFile.value) {
    message.warning('请先截取或上传新的封面图片');
    return;
  }
  loading.value = true;
  try {
    const updated = await setAssetThumbnailApi(
      currentAsset.value.id,
      currentThumbnailFile.value,
    );
    message.success('视频封面更新成功');
    emit('success', updated);
    modalApi.close();
  } catch (error) {
    console.error(error);
    message.error('封面更新失败，请稍后重试');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { asset?: AssetDto } | undefined;
      if (data?.asset) {
        currentAsset.value = data.asset;
        resetState();
        // 自动尝试提取首帧作为候选
        if (data.asset.url) {
          void doExtractVideoFrame(0.1);
        }
      }
    }
  },
  title: '设置/修改视频封面',
});
</script>

<template>
  <Modal class="w-[660px]">
    <Spin :spinning="loading">
      <div v-if="currentAsset" class="py-2 space-y-4">
        <!-- 视频资产基本信息条 -->
        <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="p-2 rounded bg-primary/10 text-primary shrink-0">
              <VideoIcon class="size-6" />
            </div>
            <div class="overflow-hidden">
              <div class="font-medium text-sm truncate" :title="currentAsset.fileName">
                {{ currentAsset.fileName }}
              </div>
              <div class="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                <span>{{ (currentAsset.fileSize / 1024 / 1024).toFixed(2) }} MB</span>
                <Tag color="blue">视频素材</Tag>
                <span v-if="videoDuration > 0">时长: {{ videoDuration.toFixed(1) }} 秒</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 封面修改与设置区 -->
        <div class="border rounded p-4 bg-background space-y-3">
          <div class="flex items-center justify-between border-b pb-2">
            <span class="font-medium text-sm flex items-center gap-2">
              <span>选择封面来源</span>
              <span class="text-xs text-muted-foreground font-normal">
                (可从原视频画面截取或自定义上传新图片)
              </span>
            </span>

            <RadioGroup v-model:value="coverMode" size="small" button-style="solid">
              <RadioButton value="auto">从视频截取</RadioButton>
              <RadioButton value="custom">自定义上传图片</RadioButton>
            </RadioGroup>
          </div>

          <Spin :spinning="extracting" tip="正在截取画面...">
            <div class="flex gap-4 items-start">
              <!-- 封面预览图（完整显示不剪裁） -->
              <div
                class="w-[200px] h-[120px] border rounded bg-black/90 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner"
              >
                <img
                  v-if="currentThumbnailUrl"
                  :src="currentThumbnailUrl"
                  class="max-w-full max-h-full object-contain"
                  alt="视频封面预览"
                />
                <div v-else class="text-xs text-white/60 text-center p-2">
                  暂无封面预览
                </div>

                <span
                  v-if="currentThumbnailUrl"
                  class="absolute bottom-1 right-1 text-[10px] bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur"
                >
                  完整封面预览
                </span>
              </div>

              <!-- 模式 A：从视频进度截取 -->
              <div v-if="coverMode === 'auto'" class="flex-1 space-y-2 min-w-0">
                <div class="text-xs text-muted-foreground">
                  拖动滑块截取视频中不同秒数的画面：
                </div>
                <Slider
                  v-model:value="captureTime"
                  :min="0"
                  :max="videoDuration > 0 ? Number(videoDuration.toFixed(1)) : 10"
                  :step="0.5"
                  @after-change="onSliderChange"
                />
                <div class="flex justify-between items-center text-xs text-muted-foreground">
                  <span>截取点: {{ captureTime }} 秒</span>
                  <span>总时长: {{ videoDuration > 0 ? `${videoDuration.toFixed(1)} 秒` : '获取中...' }}</span>
                </div>
                <div class="flex gap-2 pt-1">
                  <Button size="small" @click="onSliderChange(0.1)">首帧</Button>
                  <Button
                    v-if="videoDuration > 1"
                    size="small"
                    @click="onSliderChange(Number((videoDuration * 0.25).toFixed(1)))"
                  >
                    1/4 处
                  </Button>
                  <Button
                    v-if="videoDuration > 2"
                    size="small"
                    @click="onSliderChange(Number((videoDuration * 0.5).toFixed(1)))"
                  >
                    居中帧
                  </Button>
                </div>
              </div>

              <!-- 模式 B：自定义上传图片封面 -->
              <div v-else class="flex-1 space-y-2">
                <div class="text-xs text-muted-foreground">
                  从本地电脑选择一张图片作为新封面：
                </div>
                <Upload
                  :show-upload-list="false"
                  accept="image/*"
                  :before-upload="onCustomCoverSelected"
                >
                  <Button size="small">
                    <template #icon><ImageIcon class="size-3.5" /></template>
                    选择本地图片
                  </Button>
                </Upload>
                <p class="text-[11px] text-muted-foreground">
                  推荐上传 16:9 比例的高清图片，系统将自动优化并缩放存储。
                </p>
              </div>
            </div>
          </Spin>
        </div>

        <Divider class="my-2" />

        <!-- 底部按钮 -->
        <div class="flex justify-end gap-2 pt-2">
          <Button @click="modalApi.close()">取消</Button>
          <Button
            type="primary"
            :loading="loading || extracting"
            :disabled="!currentThumbnailFile"
            @click="handleSaveThumbnail"
          >
            保存封面
          </Button>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
