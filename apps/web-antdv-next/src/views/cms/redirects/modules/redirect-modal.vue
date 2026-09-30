<script lang="ts" setup>
import type {
  ContentRedirectCreateDto,
  ContentRedirectDto,
  ContentRedirectUpdateDto,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  Form,
  FormItem,
  Input,
  message,
  Radio,
  RadioGroup,
  Row,
  Select,
  Spin,
  Switch,
} from 'antdv-next';

import {
  createRedirectApi,
  getRedirectApi,
  updateRedirectApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑重定向' : '新建重定向'));

const sourcePath = ref('');
const entityType = ref('Article');
const entityId = ref('');
const targetCode = ref('');
const httpStatusCode = ref(301);
const isEnabled = ref(true);

function resetState() {
  recordId.value = null;
  sourcePath.value = '';
  entityType.value = 'Article';
  entityId.value = '';
  targetCode.value = '';
  httpStatusCode.value = 301;
  isEnabled.value = true;
}

async function initData(record?: ContentRedirectDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getRedirectApi(record.id);
      sourcePath.value = detail.sourcePath || '';
      entityType.value = detail.entityType || 'Article';
      entityId.value = detail.entityId || '';
      targetCode.value = detail.targetCode || '';
      httpStatusCode.value = detail.httpStatusCode || 301;
      isEnabled.value = detail.isEnabled ?? true;
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<ContentRedirectDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!isEdit.value && !sourcePath.value.trim()) {
      message.error('请输入源路径');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: ContentRedirectUpdateDto = {
          httpStatusCode: httpStatusCode.value,
          isEnabled: isEnabled.value,
          targetCode: targetCode.value || undefined,
        };
        await updateRedirectApi(recordId.value, updateData);
        message.success('重定向更新成功');
      } else {
        const createData: ContentRedirectCreateDto = {
          entityId: entityId.value,
          entityType: entityType.value,
          httpStatusCode: httpStatusCode.value,
          isEnabled: isEnabled.value,
          sourcePath: sourcePath.value,
          targetCode: targetCode.value || undefined,
        };
        await createRedirectApi(createData);
        message.success('重定向创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存重定向失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as ContentRedirectDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[540px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <FormItem label="原始请求路径 (SourcePath)" required>
          <Input
            v-model:value="sourcePath"
            :disabled="isEdit"
            placeholder="例如：/old-news/2023/hello-world"
          />
        </FormItem>

        <Row :gutter="16">
          <Col :span="10">
            <FormItem label="目标实体类型" required>
              <Select
                v-model:value="entityType"
                :disabled="isEdit"
                :options="[
                  { label: '文章 (Article)', value: 'Article' },
                  { label: '其他', value: 'Other' },
                ]"
              />
            </FormItem>
          </Col>
          <Col :span="14">
            <FormItem label="目标实体 ID" required>
              <Input
                v-model:value="entityId"
                :disabled="isEdit"
                placeholder="目标实体主键 Guid"
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem label="目标短代码 (TargetCode)">
          <Input
            v-model:value="targetCode"
            placeholder="可选填入对应文章 Base62 短代码，如 7Kx92FmQaP"
          />
        </FormItem>

        <FormItem label="重定向响应状态码" required>
          <RadioGroup v-model:value="httpStatusCode">
            <Radio :value="301">301 (Moved Permanently 永久迁移)</Radio>
            <Radio :value="302">302 (Found 临时跳转)</Radio>
          </RadioGroup>
        </FormItem>

        <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
          <div>
            <div class="font-medium text-sm">启用规则</div>
            <div class="text-xs text-muted-foreground">关闭后访问该路径将不再触发重定向</div>
          </div>
          <Switch v-model:checked="isEnabled" />
        </div>
      </Form>
    </Spin>
  </Modal>
</template>
