<script lang="ts" setup>
import type {
  ContentSourceCreateDto,
  ContentSourceDto,
  ContentSourceUpdateDto,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  Form,
  FormItem,
  Input,
  message,
  Row,
  Select,
  Spin,
} from 'antdv-next';

import {
  createSourceApi,
  getSourceApi,
  SourceType,
  updateSourceApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑数据源' : '新建数据源'));

const articleId = ref('');
const sourceType = ref<SourceType>(SourceType.Manual);
const sourceSystem = ref('');
const sourceId = ref('');
const externalId = ref('');
const sourceUrl = ref('');
const importer = ref('');
const metadataJson = ref('');

const sourceTypeOptions = [
  { label: '手动创建', value: SourceType.Manual },
  { label: '导入', value: SourceType.Import },
  { label: '微信公众号', value: SourceType.Wechat },
  { label: '旧系统迁移', value: SourceType.OldCms },
  { label: 'Markdown 导入', value: SourceType.Markdown },
  { label: '网络爬虫采集', value: SourceType.Crawler },
  { label: '外部开放 API', value: SourceType.ExternalApi },
  { label: 'AI 生成任务', value: SourceType.AI },
];

function resetState() {
  recordId.value = null;
  articleId.value = '';
  sourceType.value = SourceType.Manual;
  sourceSystem.value = '';
  sourceId.value = '';
  externalId.value = '';
  sourceUrl.value = '';
  importer.value = '';
  metadataJson.value = '';
}

async function initData(record?: ContentSourceDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getSourceApi(record.id);
      articleId.value = detail.articleId || '';
      sourceType.value = detail.sourceType || SourceType.Manual;
      sourceSystem.value = detail.sourceSystem || '';
      sourceId.value = detail.sourceId || '';
      externalId.value = detail.externalId || '';
      sourceUrl.value = detail.sourceUrl || '';
      importer.value = detail.importer || '';
      metadataJson.value = detail.metadataJson || '';
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<ContentSourceDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!isEdit.value && !articleId.value.trim()) {
      message.error('请输入关联文章 ID');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: ContentSourceUpdateDto = {
          externalId: externalId.value || undefined,
          importer: importer.value || undefined,
          metadataJson: metadataJson.value || undefined,
          sourceId: sourceId.value || undefined,
          sourceSystem: sourceSystem.value || undefined,
          sourceType: sourceType.value,
          sourceUrl: sourceUrl.value || undefined,
        };
        await updateSourceApi(recordId.value, updateData);
        message.success('数据源信息更新成功');
      } else {
        const createData: ContentSourceCreateDto = {
          articleId: articleId.value,
          externalId: externalId.value || undefined,
          importer: importer.value || undefined,
          metadataJson: metadataJson.value || undefined,
          sourceId: sourceId.value || undefined,
          sourceSystem: sourceSystem.value || undefined,
          sourceType: sourceType.value,
          sourceUrl: sourceUrl.value || undefined,
        };
        await createSourceApi(createData);
        message.success('数据源创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存数据源失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as ContentSourceDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[600px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <FormItem label="关联文章 ID" required>
          <Input
            v-model:value="articleId"
            :disabled="isEdit"
            placeholder="请输入文章主键 Guid"
          />
        </FormItem>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="来源渠道类型" required>
              <Select
                v-model:value="sourceType"
                :options="sourceTypeOptions"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="来源系统名称">
              <Input
                v-model:value="sourceSystem"
                placeholder="例如：微信公众平台 / 抓取服务"
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="外部原始 ID (ExternalId)">
              <Input
                v-model:value="externalId"
                placeholder="外部系统的文章或消息 ID"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="执行程序 / 导入人">
              <Input
                v-model:value="importer"
                placeholder="例如：WechatSyncWorker"
              />
            </FormItem>
          </Col>
        </Row>

        <FormItem label="源网址链接 (SourceUrl)">
          <Input
            v-model:value="sourceUrl"
            placeholder="请输入文章原始网页链接"
          />
        </FormItem>

        <FormItem label="元数据扩展 (Metadata JSON)">
          <Input.TextArea
            v-model:value="metadataJson"
            placeholder="可选填入外部原始 JSON 报文或配置..."
            :rows="4"
            class="font-mono text-xs"
          />
        </FormItem>
      </Form>
    </Spin>
  </Modal>
</template>
