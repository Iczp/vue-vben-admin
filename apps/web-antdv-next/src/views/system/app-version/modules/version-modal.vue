<script lang="ts" setup>
import type { AppVersionDto } from '#/api/app-version';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Checkbox,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';

import { createAppVersionApi, updateAppVersionApi } from '#/api/app-version';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const versionModel = ref<AppVersionDto | null>(null);

const appId = ref('chat-app');
const platform = ref('android');
const version = ref('');
const versionCode = ref<number>(100);
const title = ref('');
const content = ref('');
const pkgUrl = ref('');
const pageUrl = ref('');
const isForce = ref(false);
const isWidget = ref(false);
const isPublic = ref(true);
const isEnabled = ref(true);

const isEdit = computed(() => Boolean(versionModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑版本')} - ${versionModel.value?.version}`
    : '发布新 App 版本',
);

function resetState() {
  versionModel.value = null;
  appId.value = 'chat-app';
  platform.value = 'android';
  version.value = '';
  versionCode.value = 100;
  title.value = '';
  content.value = '';
  pkgUrl.value = '';
  pageUrl.value = '';
  isForce.value = false;
  isWidget.value = false;
  isPublic.value = true;
  isEnabled.value = true;
}

const [Modal, modalApi] = useVbenModal<AppVersionDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!version.value.trim() || !title.value.trim()) {
      message.error('请填写完整的版本号和更新标题');
      return;
    }

    try {
      modalApi.lock();
      const payload = {
        appId: appId.value,
        content: content.value,
        isEnabled: isEnabled.value,
        isForce: isForce.value,
        isPublic: isPublic.value,
        isWidget: isWidget.value,
        pageUrl: pageUrl.value,
        pkgUrl: pkgUrl.value,
        platform: platform.value,
        title: title.value.trim(),
        version: version.value.trim(),
        versionCode: versionCode.value,
      };

      if (isEdit.value && versionModel.value?.id) {
        await updateAppVersionApi(versionModel.value.id, payload);
      } else {
        await createAppVersionApi(payload);
      }

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        versionModel.value = payload;
        appId.value = payload.appId || 'chat-app';
        platform.value = payload.platform || 'android';
        version.value = payload.version || '';
        versionCode.value = payload.versionCode || 100;
        title.value = payload.title || '';
        content.value = payload.content || '';
        pkgUrl.value = payload.pkgUrl || '';
        pageUrl.value = payload.pageUrl || '';
        isForce.value = Boolean(payload.isForce);
        isWidget.value = Boolean(payload.isWidget);
        isPublic.value = payload.isPublic ?? true;
        isEnabled.value = payload.isEnabled ?? true;
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[640px]">
    <div class="space-y-3 p-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 font-medium">应用标识 (App ID)</div>
          <Input v-model:value="appId" placeholder="如：chat-app" />
        </div>

        <div>
          <div class="mb-1 font-medium">目标平台 (Platform)</div>
          <Select
            v-model:value="platform"
            class="w-full"
            :options="[
              { label: 'Android', value: 'android' },
              { label: 'iOS', value: 'ios' },
              { label: 'Windows', value: 'windows' },
              { label: 'macOS', value: 'macos' },
              { label: 'Web/H5', value: 'web' },
            ]"
          />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 font-medium">
            <span class="text-red-500">*</span> 版本号 (Version)
          </div>
          <Input v-model:value="version" placeholder="如：1.2.0" />
        </div>

        <div>
          <div class="mb-1 font-medium">
            <span class="text-red-500">*</span> 版本编码 (Version Code)
          </div>
          <InputNumber
            v-model:value="versionCode"
            class="w-full"
            :min="1"
            :max="999999"
          />
        </div>
      </div>

      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span> 更新标题
        </div>
        <Input v-model:value="title" placeholder="如：V1.2.0 重磅更新，优化聊天性能" />
      </div>

      <div>
        <div class="mb-1 font-medium">更新日志内容</div>
        <Input.TextArea
          v-model:value="content"
          :rows="3"
          placeholder="请输入更新说明清单..."
        />
      </div>

      <div>
        <div class="mb-1 font-medium">安装包下载地址 (Package URL)</div>
        <Input v-model:value="pkgUrl" placeholder="如：https://download.example.com/app-v1.2.0.apk" />
      </div>

      <div>
        <div class="mb-1 font-medium">更新页面地址 (Web Page URL)</div>
        <Input v-model:value="pageUrl" placeholder="选填，如：https://example.com/download" />
      </div>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <Checkbox v-model:checked="isForce">强制更新 (Force Update)</Checkbox>
        <Checkbox v-model:checked="isWidget">热更新资源包 (.wgt)</Checkbox>
        <Checkbox v-model:checked="isPublic">全量公开可用</Checkbox>
        <Checkbox v-model:checked="isEnabled">已上架启用</Checkbox>
      </div>
    </div>
  </Modal>
</template>
