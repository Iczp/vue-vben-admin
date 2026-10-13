<script lang="ts" setup>
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
  UploadDragger,
} from 'antdv-next';

import { uploadAssetApi } from '#/api/cms';
import {
  createThumbnailFromFile,
  extractVideoFrame,
} from '#/api/cms/media-metadata';

const UploadIcon = markRaw(createIconifyIcon('lucide:upload-cloud'));
const VideoIcon = markRaw(createIconifyIcon('lucide:video'));
const ImageIcon = markRaw(createIconifyIcon('lucide:image'));

const emit = defineEmits<{
  success: [asset?: AssetDto];
}>();

const loading = ref(false);
const extracting = ref(false);

// 待上传文件
const selectedFile = ref<File | null>(null);
const isVideo = ref(false);
const videoDuration = ref(0);
const videoDimensions = ref({ height: 0, width: 0 });

// 封面模式: 'auto' (提取视频帧), 'custom' (用户自定义上传图片)
const coverMode = ref<'auto' | 'custom'>('auto');

// 视频时间进度提取
const captureTime = ref(0.1);

// 当前选定的封面 File 与预览 DataURL
const currentThumbnailFile = ref<File | null>(null);
const currentThumbnailUrl = ref<string>('');

// 重置状态
function resetState() {
  selectedFile.value = null;
  isVideo.value = false;
  videoDuration.value = 0;
  videoDimensions.value = { height: 0, width: 0 };
  coverMode.value = 'auto';
  captureTime.value = 0.1;
  currentThumbnailFile.value = null;
  currentThumbnailUrl.value = '';
}

// 当用户选择/拖入视频或常规文件
async function onFileSelected(file: File) {
  selectedFile.value = file;
  const isVid =
    file.type.startsWith('video/') ||
    /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(file.name);
  isVideo.value = isVid;

  if (isVid) {
    coverMode.value = 'auto';
    captureTime.value = 0.1;
    await doExtractVideoFrame(0.1);
  } else {
    currentThumbnailFile.value = null;
    currentThumbnailUrl.value = '';
  }
  return false; // 阻止 antdv 自动上传，交由我们的确认流程或自定义上传
}

// 提取视频帧
async function doExtractVideoFrame(timeSec: number) {
  if (!selectedFile.value || !isVideo.value) return;
  extracting.value = true;
  try {
    const res = await extractVideoFrame(selectedFile.value, timeSec);
    videoDuration.value = res.duration;
    videoDimensions.value = { height: res.height, width: res.width };
    currentThumbnailFile.value = res.file;
    currentThumbnailUrl.value = res.dataUrl;
  } catch (error) {
    console.error('视频帧提取失败', error);
    message.warning('未能从视频提取帧画面，支持手动上传自定义封面');
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

const currentFolderId = ref<string | undefined>(undefined);
const currentScope = ref<import('#/api/cms').AssetScope | undefined>(undefined);

// 执行最终上传
async function handleConfirmUpload() {
  if (!selectedFile.value) {
    message.warning('请先选择要上传的文件');
    return;
  }
  loading.value = true;
  try {
    const res = await uploadAssetApi(
      selectedFile.value,
      currentThumbnailFile.value || undefined,
      currentFolderId.value,
      currentScope.value,
    );
    message.success(`素材【${selectedFile.value.name}】上传成功`);
    emit('success', res);
    modalApi.close();
  } catch (error) {
    message.error('上传失败，请稍后重试');
    console.error(error);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  destroyOnClose: true,
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const data = modalApi.getData<{ folderId?: string; scope?: import('#/api/cms').AssetScope }>();
      currentFolderId.value = data?.folderId;
      currentScope.value = data?.scope;
    }
  },
  title: '上传素材文件',
});
</script>

<template>
  <Modal class="w-[640px]">
    <Spin :spinning="loading">
      <div class="py-2 space-y-4">
        <!-- 未选择文件时的拖拽区 -->
        <div v-if="!selectedFile">
          <UploadDragger
            :multiple="false"
            :show-upload-list="false"
            :before-upload="onFileSelected"
          >
            <p class="ant-upload-drag-icon flex justify-center py-4">
              <UploadIcon class="size-12 text-primary" />
            </p>
            <p class="ant-upload-text font-medium text-base">
              点击或将文件拖拽至此区域
            </p>
            <p class="ant-upload-hint text-xs text-muted-foreground px-4">
              支持视频 (MP4/WebM)、图片 (PNG/JPG/GIF/WebP)、音频与常用文档。上传视频支持自定义封面设置或自动提取帧画面。
            </p>
          </UploadDragger>
        </div>

        <!-- 已选文件展示与设置区 -->
        <div v-else class="space-y-4">
          <!-- 文件基本信息条 -->
          <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
            <div class="flex items-center gap-3 overflow-hidden">
              <div class="p-2 rounded bg-primary/10 text-primary shrink-0">
                <VideoIcon v-if="isVideo" class="size-6" />
                <ImageIcon v-else class="size-6" />
              </div>
              <div class="overflow-hidden">
                <div class="font-medium text-sm truncate" :title="selectedFile.name">
                  {{ selectedFile.name }}
                </div>
                <div class="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span>{{ (selectedFile.size / 1024 / 1024).toFixed(2) }} MB</span>
                  <Tag v-if="isVideo" color="blue">视频媒体</Tag>
                  <Tag v-else color="cyan">素材文件</Tag>
                </div>
              </div>
            </div>

            <Button size="small" @click="resetState">重新选择</Button>
          </div>

          <!-- 视频专属：封面设置与提取区 -->
          <div v-if="isVideo" class="border rounded p-4 bg-background space-y-3">
            <div class="flex items-center justify-between border-b pb-2">
              <span class="font-medium text-sm flex items-center gap-2">
                <span>视频封面设置</span>
                <span class="text-xs text-muted-foreground font-normal">
                  (可自定义上传或从视频画面截取)
                </span>
              </span>

              <RadioGroup v-model:value="coverMode" size="small" button-style="solid">
                <RadioButton value="auto">从视频截取</RadioButton>
                <RadioButton value="custom">自定义上传</RadioButton>
              </RadioGroup>
            </div>

            <Spin :spinning="extracting" tip="正在截取画面...">
              <div class="flex gap-4 items-start">
                <!-- 封面预览图（完整显示不剪裁） -->
                <div class="w-[200px] h-[120px] border rounded bg-black/90 overflow-hidden flex items-center justify-center shrink-0 relative group shadow-inner">
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

                <!-- 模式 A：从视频进度提取 -->
                <div v-if="coverMode === 'auto'" class="flex-1 space-y-2 min-w-0">
                  <div class="text-xs text-muted-foreground">
                    拖动滑块截取视频中不同秒数的画面作为封面：
                  </div>
                  <Slider
                    v-model:value="captureTime"
                    :min="0"
                    :max="videoDuration > 0 ? Number(videoDuration.toFixed(1)) : 10"
                    :step="0.5"
                    @after-change="onSliderChange"
                  />
                  <div class="flex justify-between items-center text-xs text-muted-foreground">
                    <span>当前截取点: {{ captureTime }} 秒</span>
                    <span>总时长: {{ videoDuration > 0 ? `${videoDuration.toFixed(1)} 秒` : '获取中...' }}</span>
                  </div>
                  <div class="flex gap-2 pt-1">
                    <Button
                      size="small"
                      @click="onSliderChange(0.1)"
                    >
                      首帧
                    </Button>
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
                    从本地选择一张图片作为此视频的专属封面：
                  </div>
                  <Upload
                    :show-upload-list="false"
                    accept="image/*"
                    :before-upload="onCustomCoverSelected"
                  >
                    <Button size="small">
                      <template #icon><ImageIcon class="size-3.5" /></template>
                      选择本地图片作为封面
                    </Button>
                  </Upload>
                  <p class="text-[11px] text-muted-foreground">
                    推荐上传 16:9 比例 (如 1280x720) 的高清图片，系统将自动优化并缩放存储。
                  </p>
                </div>
              </div>
            </Spin>
          </div>

          <Divider class="my-2" />

          <!-- 操作按钮栏 -->
          <div class="flex justify-end gap-2 pt-2">
            <Button @click="resetState">取消</Button>
            <Button
              type="primary"
              :loading="loading || extracting"
              @click="handleConfirmUpload"
            >
              确认上传
            </Button>
          </div>
        </div>
      </div>
    </Spin>
  </Modal>
</template>
