<script lang="ts" setup>
import type { DeviceDetailDto, DeviceDto } from '#/api/device';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Badge,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  FormItem,
  Input,
  message,
  Spin,
  Switch,
  Tag,
} from 'antdv-next';

import { getDeviceApi, updateDeviceApi } from '#/api/device';
import { $t } from '#/locales';

interface ModalData {
  id?: string;
  isDetail?: boolean;
  row?: DeviceDto;
}

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const loading = ref(false);
const isDetailMode = ref(false);
const detailData = ref<DeviceDetailDto | null>(null);

// 编辑表单字段
const formState = ref({
  id: '',
  isEnabled: true,
  name: '',
  remarks: '',
});

const getTitle = computed(() => {
  const name = detailData.value?.name || detailData.value?.deviceId || '';
  if (isDetailMode.value) {
    return `设备详情 - ${name}`;
  }
  return `编辑设备 - ${name}`;
});

function resetState() {
  detailData.value = null;
  formState.value = {
    id: '',
    isEnabled: true,
    name: '',
    remarks: '',
  };
  isDetailMode.value = false;
}

// 调用 GET /api/chat/device/{id} 加载设备完整详情数据
async function fetchDetail(id: string) {
  try {
    loading.value = true;
    const res = await getDeviceApi(id);
    detailData.value = res;
    formState.value = {
      id: res.id,
      isEnabled: res.isEnabled ?? true,
      name: res.name || '',
      remarks: res.remarks || '',
    };
  } catch (error) {
    console.error('获取设备详情失败', error);
    message.error('获取设备详情失败');
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal<ModalData>({
  fullscreenButton: true,
  async onConfirm() {
    if (isDetailMode.value) {
      modalApi.close();
      return;
    }

    if (!formState.value.id) return;

    try {
      modalApi.lock();
      // 调用 POST /api/chat/device/{id}/update 保存修改
      await updateDeviceApi(formState.value.id, {
        isEnabled: formState.value.isEnabled,
        name: formState.value.name.trim(),
        remarks: formState.value.remarks.trim() || undefined,
      });

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        isDetailMode.value = !!payload.isDetail;
        const targetId = payload.id || payload.row?.id;
        if (targetId) {
          formState.value.id = targetId;
          await fetchDetail(targetId);
        }
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[720px]">
    <Spin :spinning="loading">
      <div v-if="detailData" class="p-4 max-h-[70vh] overflow-y-auto space-y-4">
        <!-- 1. 查看详情模式 -->
        <template v-if="isDetailMode">
          <Descriptions title="基本信息" bordered size="small" :column="2">
            <DescriptionsItem label="设备备注名称">
              <span class="font-medium text-foreground">{{ detailData.name || '-' }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="设备唯一 ID">
              <span class="font-mono text-xs">{{ detailData.deviceId }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="所属用户">
              {{ detailData.userName || detailData.userId || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="登录权限状态">
              <Tag :color="detailData.isEnabled ? 'green' : 'red'">
                {{ detailData.isEnabled ? '允许登录' : '已禁用' }}
              </Tag>
            </DescriptionsItem>
            <DescriptionsItem label="当前在线状态">
              <Badge
                :status="detailData.isOnline ? 'success' : 'default'"
                :text="detailData.isOnline ? '在线' : '离线'"
              />
            </DescriptionsItem>
            <DescriptionsItem label="最后活跃时间">
              {{ detailData.lastActiveTime || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="设备备注" :span="2">
              {{ detailData.remarks || '-' }}
            </DescriptionsItem>
          </Descriptions>

          <Descriptions title="硬件与系统" bordered size="small" :column="2">
            <DescriptionsItem label="客户端平台">
              <Tag color="blue">{{ detailData.platform || '-' }}</Tag>
            </DescriptionsItem>
            <DescriptionsItem label="操作系统及版本">
              {{ detailData.osName || '-' }} {{ detailData.osVersion || '' }}
            </DescriptionsItem>
            <DescriptionsItem label="设备品牌 / 型号">
              {{ detailData.brand || detailData.model || '-' }}
            </DescriptionsItem>
            <DescriptionsItem label="应用 App / 版本">
              {{ detailData.appName || detailData.app || '-' }}
              {{ detailData.appVersion ? `(v${detailData.appVersion})` : '' }}
            </DescriptionsItem>
            <DescriptionsItem label="屏幕分辨率">
              {{ detailData.screenWidth && detailData.screenHeight ? `${detailData.screenWidth} × ${detailData.screenHeight}` : '-' }}
              {{ detailData.pixelRatio ? `(@${detailData.pixelRatio}x)` : '' }}
            </DescriptionsItem>
            <DescriptionsItem label="浏览器 / WebView">
              {{ detailData.browserName || '-' }} {{ detailData.browserVersion || '' }}
            </DescriptionsItem>
            <DescriptionsItem label="系统语言 / 主题">
              {{ detailData.language || detailData.osLanguage || '-' }} / {{ detailData.theme || detailData.osTheme || '默认' }}
            </DescriptionsItem>
            <DescriptionsItem label="网络与硬件开关">
              Wi-Fi: {{ detailData.wifiEnabled ? '已开' : '关' }} | 蓝牙: {{ detailData.bluetoothEnabled ? '已开' : '关' }} | 定位: {{ detailData.locationEnabled ? '已开' : '关' }}
            </DescriptionsItem>
            <DescriptionsItem label="User-Agent" :span="2">
              <div class="font-mono text-xs break-all max-h-24 overflow-y-auto text-muted-foreground">
                {{ detailData.ua || '-' }}
              </div>
            </DescriptionsItem>
          </Descriptions>
        </template>

        <!-- 2. 编辑模式 -->
        <template v-else>
          <Form layout="vertical">
            <FormItem label="设备 ID (只读)">
              <Input :value="detailData.deviceId" disabled />
            </FormItem>

            <FormItem label="设备备注名称">
              <Input
                v-model:value="formState.name"
                placeholder="如：张三的 iPhone 15 Pro"
                :maxlength="128"
                allow-clear
              />
            </FormItem>

            <FormItem label="允许该设备登录">
              <div class="flex items-center justify-between border rounded p-3">
                <div>
                  <div class="font-medium text-sm">允许通过此设备凭据或 Token 登录</div>
                  <div class="text-xs text-muted-foreground">
                    若关闭，后端将拦截该设备的认证和访问请求
                  </div>
                </div>
                <Switch v-model:checked="formState.isEnabled" />
              </div>
            </FormItem>

            <FormItem label="设备备注">
              <Input.TextArea
                v-model:value="formState.remarks"
                placeholder="输入设备补充备注信息..."
                :rows="3"
                :maxlength="256"
                show-count
              />
            </FormItem>
          </Form>
        </template>
      </div>

      <Empty v-else-if="!loading" description="未获取到设备数据" class="py-8" />
    </Spin>
  </Modal>
</template>
