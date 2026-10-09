<script lang="ts" setup>
import type { ArticleRevisionDto } from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Divider,
  Form,
  FormItem,
  Input,
  message,
  Modal as AntModal,
  Popconfirm,
  Radio,
  RadioGroup,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  createArticleRevisionApi,
  deleteArticleRevisionApi,
  getArticleRevisionsApi,
  rollbackArticleRevisionApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const actionLoading = ref(false);
const articleId = ref('');
const articleTitle = ref('');
const revisions = ref<ArticleRevisionDto[]>([]);

// 新建版本抽屉/视图
const showAddRevision = ref(false);
const newTitle = ref('');
const newSummary = ref('');
const newContent = ref('');
const newChangeLog = ref('');

// 预览正文弹窗状态
const previewVisible = ref(false);
const previewTitle = ref('');
const previewHtml = ref('');
const previewRevision = ref<ArticleRevisionDto | null>(null);

// 版本对比弹窗状态
const diffVisible = ref(false);
const diffSourceVersion = ref<number | null>(null);
const diffTargetVersion = ref<number | null>(null);

const sourceRevision = computed(() =>
  revisions.value.find((r) => r.version === diffSourceVersion.value),
);
const targetRevision = computed(() =>
  revisions.value.find((r) => r.version === diffTargetVersion.value),
);

const columns = [
  { dataIndex: 'version', title: '版本号', width: 90 },
  { dataIndex: 'title', title: '版本标题', ellipsis: true },
  {
    customRender: ({ record }: { record: ArticleRevisionDto }) =>
      record.changeSummary || record.changeLog || '-',
    dataIndex: 'changeSummary',
    title: '修改说明',
    ellipsis: true,
  },
  {
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
    dataIndex: 'creationTime',
    title: '版本创建时间',
    width: 170,
  },
  {
    fixed: 'right' as const,
    key: 'action',
    title: '操作',
    width: 200,
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
  previewRevision.value = record;
  previewTitle.value = `版本 V${record.version} 详情与正文预览 - ${record.title || ''}`;
  previewHtml.value =
    record.contentHtml ||
    record.content ||
    record.contentText ||
    record.contentJson ||
    '';
  previewVisible.value = true;
}

async function onRollback(record: ArticleRevisionDto) {
  actionLoading.value = true;
  try {
    await rollbackArticleRevisionApi(articleId.value, record.id);
    message.success(`已成功恢复并生成基于 V${record.version} 的新修订版本！`);
    await loadRevisions();
    emit('success');
  } catch (error) {
    console.error('版本回滚失败', error);
  } finally {
    actionLoading.value = false;
  }
}

async function onDeleteRevision(record: ArticleRevisionDto) {
  actionLoading.value = true;
  try {
    await deleteArticleRevisionApi(articleId.value, record.id);
    message.success(`版本 V${record.version} 已删除`);
    await loadRevisions();
    emit('success');
  } catch (error) {
    console.error('删除版本失败', error);
  } finally {
    actionLoading.value = false;
  }
}

function onOpenDiff(record?: ArticleRevisionDto) {
  if (revisions.value.length < 2) {
    message.warning('历史版本数量少于2个，无法进行版本对比');
    return;
  }
  // 默认对比当前选中的版本与它的前一个版本，或者最新两个版本
  if (record) {
    diffTargetVersion.value = record.version;
    const prev = revisions.value.find((r) => r.version < record.version);
    diffSourceVersion.value = prev ? prev.version : revisions.value[revisions.value.length - 1]?.version ?? null;
  } else {
    diffTargetVersion.value = revisions.value[0]?.version ?? null;
    diffSourceVersion.value = revisions.value[1]?.version ?? null;
  }
  diffVisible.value = true;
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
  <Modal class="w-[980px] max-w-full">
    <Spin :spinning="loading || actionLoading">
      <div class="mb-3 flex items-center justify-between">
        <div>
          <span class="text-muted-foreground">当前文章：</span>
          <span class="font-medium">{{ articleTitle }}</span>
          <span class="ml-3 text-xs text-muted-foreground">共 {{ revisions.length }} 个版本记录</span>
        </div>
        <Space>
          <Button
            v-if="!showAddRevision && revisions.length >= 2"
            size="small"
            @click="onOpenDiff()"
          >
            版本对比
          </Button>
          <Button
            type="primary"
            size="small"
            @click="showAddRevision = !showAddRevision"
          >
            {{ showAddRevision ? '返回版本列表' : '+ 创建新快照版本' }}
          </Button>
        </Space>
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
              <Tag :color="record.version === revisions[0]?.version ? 'green' : 'blue'">
                V{{ record.version }}
                <span v-if="record.version === revisions[0]?.version" class="text-[10px] ml-0.5">(最新)</span>
              </Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Space :size="4">
                <Button type="link" size="small" @click="onViewContent(record)">
                  查看
                </Button>

                <Button
                  v-if="revisions.length >= 2"
                  type="link"
                  size="small"
                  @click="onOpenDiff(record)"
                >
                  对比
                </Button>

                <Popconfirm
                  :title="`确认将文章内容回滚恢复至版本 V${record.version} 吗？`"
                  ok-text="确认回滚"
                  cancel-text="取消"
                  @confirm="onRollback(record)"
                >
                  <Tooltip title="恢复当前文章为此版本，并自动生成新的回滚修订记录">
                    <Button type="link" size="small">
                      回滚
                    </Button>
                  </Tooltip>
                </Popconfirm>

                <Popconfirm
                  :title="`确认删除历史版本 V${record.version} 吗？`"
                  ok-text="确认删除"
                  cancel-text="取消"
                  ok-type="danger"
                  @confirm="onDeleteRevision(record)"
                >
                  <Button type="link" danger size="small">
                    删除
                  </Button>
                </Popconfirm>
              </Space>
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

    <!-- 正文内容与元数据预览弹窗 -->
    <AntModal
      v-model:open="previewVisible"
      :title="previewTitle"
      :width="850"
      :footer="null"
      destroy-on-hidden
    >
      <div v-if="previewRevision" class="mb-3">
        <Descriptions size="small" bordered :column="2">
          <DescriptionsItem label="版本号">
            <Tag color="blue">V{{ previewRevision.version }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="修改时间">
            {{ previewRevision.creationTime ? dayjs(previewRevision.creationTime).format('YYYY-MM-DD HH:mm:ss') : '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="版本标题" :span="2">
            {{ previewRevision.title }}
          </DescriptionsItem>
          <DescriptionsItem v-if="previewRevision.subtitle" label="副标题" :span="2">
            {{ previewRevision.subtitle }}
          </DescriptionsItem>
          <DescriptionsItem v-if="previewRevision.changeSummary || previewRevision.changeLog" label="修订说明" :span="2">
            {{ previewRevision.changeSummary || previewRevision.changeLog }}
          </DescriptionsItem>
          <DescriptionsItem v-if="previewRevision.summary" label="摘要" :span="2">
            {{ previewRevision.summary }}
          </DescriptionsItem>
        </Descriptions>
      </div>

      <Divider class="my-2">正文内容</Divider>

      <div class="max-h-[55vh] overflow-y-auto p-4 border rounded bg-background">
        <div
          v-if="previewHtml"
          class="prose dark:prose-invert max-w-none text-sm leading-relaxed"
          v-html="previewHtml"
        ></div>
        <div v-else class="text-center text-muted-foreground py-8">
          该版本暂无正文内容
        </div>
      </div>

      <div class="mt-4 flex justify-end gap-2">
        <Popconfirm
          v-if="previewRevision"
          :title="`确认将文章内容回滚恢复至版本 V${previewRevision.version} 吗？`"
          ok-text="确认回滚"
          cancel-text="取消"
          @confirm="onRollback(previewRevision)"
        >
          <Button type="primary">
            回滚恢复至此版本
          </Button>
        </Popconfirm>
        <Button @click="previewVisible = false">关闭</Button>
      </div>
    </AntModal>

    <!-- 版本对比弹窗 -->
    <AntModal
      v-model:open="diffVisible"
      title="版本内容对比"
      :width="1000"
      :footer="null"
      destroy-on-hidden
    >
      <div class="mb-4 flex items-center justify-between gap-4 p-3 bg-muted/20 border rounded">
        <div class="flex items-center gap-2">
          <span class="font-medium text-xs">对比基准版本 (左)：</span>
          <RadioGroup v-model:value="diffSourceVersion" size="small">
            <Radio
              v-for="item in revisions"
              :key="`source-${item.version}`"
              :value="item.version"
            >
              V{{ item.version }}
            </Radio>
          </RadioGroup>
        </div>
        <div class="flex items-center gap-2">
          <span class="font-medium text-xs">目标版本 (右)：</span>
          <RadioGroup v-model:value="diffTargetVersion" size="small">
            <Radio
              v-for="item in revisions"
              :key="`target-${item.version}`"
              :value="item.version"
            >
              V{{ item.version }}
            </Radio>
          </RadioGroup>
        </div>
      </div>

      <div v-if="sourceRevision && targetRevision" class="grid grid-cols-2 gap-4">
        <!-- 左侧基准版本 -->
        <div class="border rounded p-3 bg-background flex flex-col">
          <div class="flex items-center justify-between border-b pb-2 mb-2">
            <Tag color="blue">V{{ sourceRevision.version }}</Tag>
            <span class="text-xs text-muted-foreground">
              {{ dayjs(sourceRevision.creationTime).format('YYYY-MM-DD HH:mm') }}
            </span>
          </div>
          <div class="font-medium text-sm mb-1">{{ sourceRevision.title }}</div>
          <div class="text-xs text-muted-foreground mb-2">
            说明: {{ sourceRevision.changeSummary || sourceRevision.changeLog || '无' }}
          </div>
          <Divider class="my-1" />
          <div class="flex-1 max-h-[50vh] overflow-y-auto text-xs leading-relaxed p-2 bg-muted/10 rounded">
            <div
              class="prose dark:prose-invert max-w-none text-xs"
              v-html="sourceRevision.contentHtml || sourceRevision.contentText || '无正文'"
            ></div>
          </div>
        </div>

        <!-- 右侧目标版本 -->
        <div class="border rounded p-3 bg-background flex flex-col">
          <div class="flex items-center justify-between border-b pb-2 mb-2">
            <Tag color="green">V{{ targetRevision.version }}</Tag>
            <span class="text-xs text-muted-foreground">
              {{ dayjs(targetRevision.creationTime).format('YYYY-MM-DD HH:mm') }}
            </span>
          </div>
          <div class="font-medium text-sm mb-1">{{ targetRevision.title }}</div>
          <div class="text-xs text-muted-foreground mb-2">
            说明: {{ targetRevision.changeSummary || targetRevision.changeLog || '无' }}
          </div>
          <Divider class="my-1" />
          <div class="flex-1 max-h-[50vh] overflow-y-auto text-xs leading-relaxed p-2 bg-muted/10 rounded">
            <div
              class="prose dark:prose-invert max-w-none text-xs"
              v-html="targetRevision.contentHtml || targetRevision.contentText || '无正文'"
            ></div>
          </div>
        </div>
      </div>
      <div v-else class="text-center py-8 text-muted-foreground">
        请选择两个版本进行对比
      </div>

      <div class="mt-4 flex justify-end">
        <Button @click="diffVisible = false">关闭对比</Button>
      </div>
    </AntModal>
  </Modal>
</template>
