<script lang="ts" setup>
import type { ArticleRevisionDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Form,
  FormItem,
  Input,
  message,
  Modal as AntModal,
  Spin,
  Table,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  createArticleRevisionApi,
  getArticleRevisionsApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const articleId = ref('');
const articleTitle = ref('');
const revisions = ref<ArticleRevisionDto[]>([]);

// 新建版本抽屉
const showAddRevision = ref(false);
const newTitle = ref('');
const newSummary = ref('');
const newContent = ref('');
const newChangeLog = ref('');

const columns = [
  { dataIndex: 'version', title: '版本号', width: 90 },
  { dataIndex: 'title', title: '版本标题', ellipsis: true },
  { dataIndex: 'changeLog', title: '修改说明', ellipsis: true },
  {
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    dataIndex: 'creationTime',
    title: '版本创建时间',
    width: 170,
  },
  {
    key: 'action',
    title: '操作',
    width: 100,
  },
];

async function loadRevisions() {
  if (!articleId.value) return;
  loading.value = true;
  try {
    revisions.value = await getArticleRevisionsApi(articleId.value);
  } catch (error) {
    console.error('加载历史版本失败', error);
  } finally {
    loading.value = false;
  }
}

function onViewContent(record: ArticleRevisionDto) {
  AntModal.info({
    content: record.content,
    title: `版本 V${record.version} 正文内容预览`,
    width: 800,
  });
}

async function onSubmitNewRevision() {
  if (!newTitle.value.trim() || !newContent.value.trim()) {
    message.error('请输入版本标题和正文');
    return;
  }
  try {
    await createArticleRevisionApi(articleId.value, {
      changeLog: newChangeLog.value,
      content: newContent.value,
      summary: newSummary.value,
      title: newTitle.value,
    });
    message.success('新版本创建成功');
    showAddRevision.value = false;
    newTitle.value = '';
    newSummary.value = '';
    newContent.value = '';
    newChangeLog.value = '';
    loadRevisions();
    emit('success');
  } catch (error) {
    console.error('创建版本失败', error);
  }
}

const [Modal, modalApi] = useVbenModal<{ id: string; title: string }>({
  destroyOnClose: true,
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string; title: string } | undefined;
      articleId.value = data?.id || '';
      articleTitle.value = data?.title || '';
      showAddRevision.value = false;
      loadRevisions();
    }
  },
  title: '文章历史版本管理',
});
</script>

<template>
  <Modal class="w-[850px] max-w-full">
    <Spin :spinning="loading">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <span class="text-muted-foreground">当前文章：</span>
          <span class="font-medium">{{ articleTitle }}</span>
        </div>
        <Button
          type="primary"
          size="small"
          @click="showAddRevision = !showAddRevision"
        >
          {{ showAddRevision ? '返回版本列表' : '+ 创建新版本' }}
        </Button>
      </div>

      <div v-if="!showAddRevision">
        <Table
          :columns="columns"
          :data-source="revisions"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 5 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.dataIndex === 'version'">
              <Tag color="blue">V{{ record.version }}</Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button type="link" size="small" @click="onViewContent(record)">
                查看正文
              </Button>
            </template>
          </template>
        </Table>
      </div>

      <div v-else class="p-3 border rounded bg-muted/10">
        <div class="font-medium mb-3">创建新快照版本</div>
        <Form layout="vertical">
          <FormItem label="版本标题" required>
            <Input v-model:value="newTitle" placeholder="请输入新版本标题" />
          </FormItem>
          <FormItem label="修改说明 (ChangeLog)">
            <Input
              v-model:value="newChangeLog"
              placeholder="说明本次修改内容要点"
            />
          </FormItem>
          <FormItem label="版本正文" required>
            <Input.TextArea
              v-model:value="newContent"
              :rows="8"
              placeholder="请输入正文内容..."
            />
          </FormItem>
          <div class="text-right">
            <Button class="mr-2" @click="showAddRevision = false">取消</Button>
            <Button type="primary" @click="onSubmitNewRevision">
              保存版本
            </Button>
          </div>
        </Form>
      </div>
    </Spin>
  </Modal>
</template>
