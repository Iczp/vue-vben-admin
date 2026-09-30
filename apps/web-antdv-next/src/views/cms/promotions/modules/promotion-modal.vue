<script lang="ts" setup>
import type {
  ContentPromotionCreateDto,
  ContentPromotionDto,
  ContentPromotionUpdateDto,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  DatePicker,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Spin,
  Switch,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  createPromotionApi,
  getPromotionApi,
  updatePromotionApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑置顶推广' : '新建置顶推广'));

const entityType = ref('Article');
const entityId = ref('');
const scene = ref('home');
const weight = ref<number>(10);
const startTime = ref<any>(null);
const endTime = ref<any>(null);
const isEnabled = ref(true);
const reason = ref('');

function resetState() {
  recordId.value = null;
  entityType.value = 'Article';
  entityId.value = '';
  scene.value = 'home';
  weight.value = 10;
  startTime.value = null;
  endTime.value = null;
  isEnabled.value = true;
  reason.value = '';
}

async function initData(record?: ContentPromotionDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getPromotionApi(record.id);
      entityType.value = detail.entityType || 'Article';
      entityId.value = detail.entityId || '';
      scene.value = detail.scene || '';
      weight.value = detail.weight || 10;
      startTime.value = detail.startTime ? dayjs(detail.startTime) : null;
      endTime.value = detail.endTime ? dayjs(detail.endTime) : null;
      isEnabled.value = detail.isEnabled ?? true;
      reason.value = detail.reason || '';
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<ContentPromotionDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!isEdit.value && (!entityType.value.trim() || !entityId.value.trim())) {
      message.error('请输入实体类型和实体ID');
      return;
    }
    if (!scene.value.trim()) {
      message.error('请输入推广场景');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: ContentPromotionUpdateDto = {
          endTime: endTime.value ? endTime.value.toISOString() : undefined,
          isEnabled: isEnabled.value,
          reason: reason.value || undefined,
          startTime: startTime.value ? startTime.value.toISOString() : undefined,
          weight: weight.value,
        };
        await updatePromotionApi(recordId.value, updateData);
        message.success('推广配置更新成功');
      } else {
        const createData: ContentPromotionCreateDto = {
          endTime: endTime.value ? endTime.value.toISOString() : undefined,
          entityId: entityId.value,
          entityType: entityType.value,
          isEnabled: isEnabled.value,
          reason: reason.value || undefined,
          scene: scene.value,
          startTime: startTime.value ? startTime.value.toISOString() : undefined,
          weight: weight.value,
        };
        await createPromotionApi(createData);
        message.success('推广创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存推广失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as ContentPromotionDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[580px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <Row :gutter="16">
          <Col :span="10">
            <FormItem label="推广实体类型" required>
              <Select
                v-model:value="entityType"
                :disabled="isEdit"
                :options="[
                  { label: '文章 (Article)', value: 'Article' },
                  { label: '其他实体', value: 'Other' },
                ]"
              />
            </FormItem>
          </Col>
          <Col :span="14">
            <FormItem label="目标实体 ID" required>
              <Input
                v-model:value="entityId"
                :disabled="isEdit"
                placeholder="请输入文章或目标的主键 Guid"
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="推广场景标识 (Scene)" required>
              <Input
                v-model:value="scene"
                placeholder="例如：home / banner / sidebar"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="提权权重 (Weight)">
              <InputNumber
                v-model:value="weight"
                :min="1"
                class="w-full"
                placeholder="数值越大排序越优先"
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="生效起始时间">
              <DatePicker
                v-model:value="startTime"
                show-time
                class="w-full"
                placeholder="留空即刻生效"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="截止下线时间">
              <DatePicker
                v-model:value="endTime"
                show-time
                class="w-full"
                placeholder="留空为长期有效"
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem label="推广事由 / 备注说明">
          <Input.TextArea
            v-model:value="reason"
            placeholder="例如：市场活动头条推荐 / 专栏置顶..."
            :rows="3"
            :maxlength="256"
          />
        </FormItem>

        <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
          <div>
            <div class="font-medium text-sm">投放状态</div>
            <div class="text-xs text-muted-foreground">关闭后将立即从指定场景取消推广曝光</div>
          </div>
          <Switch v-model:checked="isEnabled" />
        </div>
      </Form>
    </Spin>
  </Modal>
</template>
