<script lang="ts" setup>
import type {
  AdminArticleCreateInput,
  AdminArticleDetailDto,
  AdminArticleUpdateInput,
  CategoryDto,
  TagDto,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { VbenTiptap } from '@vben/plugins/tiptap';

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
  Tabs,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  createArticleApi,
  getArticleApi,
  getCategoriesApi,
  getTagsApi,
  SourceType,
  updateArticleApi,
  uploadAssetApi,
} from '#/api/cms';
import MediaSelector from '#/views/cms/components/MediaSelector.vue';

const emit = defineEmits(['success']);

const activeTab = ref('basic');
const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑文章' : '新建文章'));

// 下拉数据源
const categoryOptions = ref<{ label: string; value: string }[]>([]);
const tagOptions = ref<{ label: string; value: string }[]>([]);

// 表单字段
const title = ref('');
const subTitle = ref('');
const summary = ref('');
const slug = ref('');
const coverUrl = ref('');
const content = ref('');
const markdownContent = ref('');
const sourceType = ref<SourceType>(SourceType.Manual);
const sourceUrl = ref('');
const sourceAuthor = ref('');
const categoryIds = ref<string[]>([]);
const mainCategoryId = ref<string | undefined>(undefined);
const tagNames = ref<string[]>([]);
const isVisible = ref(true);
const isTop = ref(false);
const topExpireTime = ref<any>(null);
const isRecommend = ref(false);
const allowComment = ref(true);
const sorting = ref<number>(0);
const password = ref('');

const sourceTypeOptions = [
  { label: '原创手动编写', value: SourceType.Manual },
  { label: '批量导入', value: SourceType.Import },
  { label: '微信公众号图文', value: SourceType.Wechat },
  { label: '旧CMS迁移', value: SourceType.OldCms },
  { label: 'Markdown 导入', value: SourceType.Markdown },
  { label: '网络爬虫采集', value: SourceType.Crawler },
  { label: '第三方外部API', value: SourceType.ExternalApi },
  { label: 'AI辅助生成', value: SourceType.AI },
];

function resetState() {
  recordId.value = null;
  activeTab.value = 'basic';
  title.value = '';
  subTitle.value = '';
  summary.value = '';
  slug.value = '';
  coverUrl.value = '';
  content.value = '';
  markdownContent.value = '';
  sourceType.value = SourceType.Manual;
  sourceUrl.value = '';
  sourceAuthor.value = '';
  categoryIds.value = [];
  mainCategoryId.value = undefined;
  tagNames.value = [];
  isVisible.value = true;
  isTop.value = false;
  topExpireTime.value = null;
  isRecommend.value = false;
  allowComment.value = true;
  sorting.value = 0;
  password.value = '';
}

async function loadOptions() {
  try {
    const [catRes, tagRes] = await Promise.all([
      getCategoriesApi({ maxResultCount: 200 }),
      getTagsApi({ maxResultCount: 200 }),
    ]);
    categoryOptions.value = (catRes.items || []).map((c: CategoryDto) => ({
      label: c.name,
      value: c.id,
    }));
    tagOptions.value = (tagRes.items || []).map((t: TagDto) => ({
      label: t.name,
      value: t.name,
    }));
  } catch (error) {
    console.error('加载分类和标签失败', error);
  }
}

async function initData(id?: string) {
  resetState();
  await loadOptions();

  if (id) {
    recordId.value = id;
    loading.value = true;
    try {
      const detail: AdminArticleDetailDto = await getArticleApi(id);
      title.value = detail.title || '';
      subTitle.value = detail.subTitle || '';
      summary.value = detail.summary || '';
      slug.value = detail.slug || '';
      coverUrl.value = detail.coverUrl || '';
      content.value = detail.content || '';
      markdownContent.value = detail.markdownContent || '';
      sourceType.value = detail.sourceType || SourceType.Manual;
      sourceUrl.value = detail.sourceUrl || '';
      sourceAuthor.value = detail.sourceAuthor || '';
      categoryIds.value = (detail.categories || []).map((c) => c.id);
      mainCategoryId.value = detail.mainCategoryId || undefined;
      tagNames.value = (detail.tags || []).map((t) => t.name);
      isVisible.value = detail.isVisible ?? true;
      isTop.value = detail.isTop ?? false;
      topExpireTime.value = detail.topExpireTime ? dayjs(detail.topExpireTime) : null;
      isRecommend.value = detail.isRecommend ?? false;
      allowComment.value = detail.allowComment ?? true;
      sorting.value = detail.sorting || 0;
    } finally {
      loading.value = false;
    }
  }
}

/**
 * Tiptap 富文本编辑器图片上传配置
 */
const tiptapImageUploadOptions = {
  upload: async (file: File) => {
    try {
      const res = await uploadAssetApi(file);
      const url = res.sourceUrl || res.blobName;
      if (!url) {
        throw new Error('未返回有效的图片链接');
      }
      return url;
    } catch (err) {
      message.error(`图片【${file.name}】上传失败`);
      throw err;
    }
  },
};

const [Modal, modalApi] = useVbenModal<string | undefined>({
  fullscreenButton: true,
  async onConfirm() {
    if (!title.value.trim()) {
      message.error('请输入文章标题');
      activeTab.value = 'basic';
      return;
    }
    if (!content.value.trim()) {
      message.error('请输入文章正文内容');
      activeTab.value = 'content';
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateInput: AdminArticleUpdateInput = {
          allowComment: allowComment.value,
          categoryIds: categoryIds.value,
          content: content.value,
          coverUrl: coverUrl.value || undefined,
          isRecommend: isRecommend.value,
          isTop: isTop.value,
          isVisible: isVisible.value,
          mainCategoryId: mainCategoryId.value || undefined,
          markdownContent: markdownContent.value || undefined,
          password: password.value || undefined,
          slug: slug.value || undefined,
          sorting: sorting.value,
          sourceAuthor: sourceAuthor.value || undefined,
          sourceType: sourceType.value,
          sourceUrl: sourceUrl.value || undefined,
          subTitle: subTitle.value || undefined,
          summary: summary.value || undefined,
          tagNames: tagNames.value,
          title: title.value,
          topExpireTime: topExpireTime.value
            ? topExpireTime.value.toISOString()
            : undefined,
        };
        await updateArticleApi(recordId.value, updateInput);
        message.success('文章信息更新成功');
      } else {
        const createInput: AdminArticleCreateInput = {
          allowComment: allowComment.value,
          categoryIds: categoryIds.value,
          content: content.value,
          coverUrl: coverUrl.value || undefined,
          isRecommend: isRecommend.value,
          isTop: isTop.value,
          isVisible: isVisible.value,
          mainCategoryId: mainCategoryId.value || undefined,
          markdownContent: markdownContent.value || undefined,
          password: password.value || undefined,
          slug: slug.value || undefined,
          sorting: sorting.value,
          sourceAuthor: sourceAuthor.value || undefined,
          sourceType: sourceType.value,
          sourceUrl: sourceUrl.value || undefined,
          subTitle: subTitle.value || undefined,
          summary: summary.value || undefined,
          tagNames: tagNames.value,
          title: title.value,
          topExpireTime: topExpireTime.value
            ? topExpireTime.value.toISOString()
            : undefined,
        };
        await createArticleApi(createInput);
        message.success('文章创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存文章失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as string | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[960px] max-w-full">
    <Spin :spinning="loading">
      <Tabs v-model:activeKey="activeTab" class="px-2">
        <!-- Tab 1: 基本信息 -->
        <Tabs.TabPane key="basic" tab="基本信息">
          <Form layout="vertical" class="mt-2">
            <FormItem label="文章标题" required>
              <Input
                v-model:value="title"
                placeholder="请输入文章主标题"
                :maxlength="256"
                show-count
              />
            </FormItem>

            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="副标题">
                  <Input
                    v-model:value="subTitle"
                    placeholder="可选，请输入副标题"
                    :maxlength="256"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="自定义 URL 别名 (Slug)">
                  <Input
                    v-model:value="slug"
                    placeholder="可选，例如 my-first-post"
                    :maxlength="128"
                  />
                </FormItem>
              </Col>
            </Row>

            <FormItem label="封面图片">
              <MediaSelector
                v-model:value="coverUrl"
                placeholder="请输入图片 URL 或点击右侧选择图片"
              />
            </FormItem>

            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="文章分类">
                  <Select
                    v-model:value="categoryIds"
                    mode="multiple"
                    placeholder="选择所属分类（支持多选）"
                    :options="categoryOptions"
                    allow-clear
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="主分类">
                  <Select
                    v-model:value="mainCategoryId"
                    placeholder="选择主分类"
                    :options="categoryOptions"
                    allow-clear
                  />
                </FormItem>
              </Col>
            </Row>

            <FormItem label="内容标签">
              <Select
                v-model:value="tagNames"
                mode="tags"
                placeholder="输入或选择标签，回车新增"
                :options="tagOptions"
              />
            </FormItem>

            <FormItem label="文章摘要">
              <Input.TextArea
                v-model:value="summary"
                placeholder="请输入文章导读摘要（若不填写，前台将自动截取正文首段）"
                :rows="3"
                :maxlength="500"
                show-count
              />
            </FormItem>
          </Form>
        </Tabs.TabPane>

        <!-- Tab 2: 文章正文 (使用 Tiptap HTML 富文本编辑器) -->
        <Tabs.TabPane key="content" tab="正文编辑">
          <Form layout="vertical" class="mt-2">
            <FormItem
              label="文章正文 (Tiptap HTML 富文本)"
              required
              extra="使用内置 Tiptap 编辑器直接所见即所得排版，支持标题、列表、引用、表格与图片插入"
            >
              <div class="border rounded-lg overflow-hidden">
                <VbenTiptap
                  v-model="content"
                  :min-height="350"
                  :max-height="600"
                  :image-upload="tiptapImageUploadOptions"
                  placeholder="在此输入或粘贴文章正文内容..."
                />
              </div>
            </FormItem>

            <FormItem
              label="Markdown 源码备份 (可选)"
              extra="如有 Markdown 源稿，可存入此字段方便二次编辑与导出"
            >
              <Input.TextArea
                v-model:value="markdownContent"
                placeholder="可选填入 Markdown 格式源码..."
                :rows="4"
                class="font-mono text-xs"
              />
            </FormItem>
          </Form>
        </Tabs.TabPane>

        <!-- Tab 3: 来源与属性 -->
        <Tabs.TabPane key="source" tab="来源与作者">
          <Form layout="vertical" class="mt-2">
            <Row :gutter="16">
              <Col :span="8">
                <FormItem label="内容来源渠道">
                  <Select
                    v-model:value="sourceType"
                    :options="sourceTypeOptions"
                  />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="原作者署名">
                  <Input
                    v-model:value="sourceAuthor"
                    placeholder="例如：新华社 / 专栏作者"
                  />
                </FormItem>
              </Col>
              <Col :span="8">
                <FormItem label="排序权重">
                  <InputNumber
                    v-model:value="sorting"
                    class="w-full"
                    placeholder="数字越大越靠前"
                  />
                </FormItem>
              </Col>
            </Row>

            <FormItem label="原文链接 (SourceUrl)">
              <Input
                v-model:value="sourceUrl"
                placeholder="如系转载，请输入原始出处链接"
              />
            </FormItem>

            <FormItem label="访问密码 (可选)">
              <Input.Password
                v-model:value="password"
                placeholder="留空表示公开无密码"
              />
            </FormItem>
          </Form>
        </Tabs.TabPane>

        <!-- Tab 4: 推荐与权限控制 -->
        <Tabs.TabPane key="settings" tab="发布属性与控制">
          <div class="grid grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg mt-2">
            <div class="flex items-center justify-between p-3 bg-background rounded border">
              <div>
                <div class="font-medium">前台可见</div>
                <div class="text-xs text-muted-foreground">控制文章是否在客户端列表中展示</div>
              </div>
              <Switch v-model:checked="isVisible" />
            </div>

            <div class="flex items-center justify-between p-3 bg-background rounded border">
              <div>
                <div class="font-medium">允许评论</div>
                <div class="text-xs text-muted-foreground">是否开启读者在文章下方的评论互动</div>
              </div>
              <Switch v-model:checked="allowComment" />
            </div>

            <div class="flex items-center justify-between p-3 bg-background rounded border">
              <div>
                <div class="font-medium">首页置顶</div>
                <div class="text-xs text-muted-foreground">文章将被固定在栏目列表首部</div>
              </div>
              <Switch v-model:checked="isTop" />
            </div>

            <div class="flex items-center justify-between p-3 bg-background rounded border">
              <div>
                <div class="font-medium">编辑推荐</div>
                <div class="text-xs text-muted-foreground">标记为精选文章，在推荐场景加权展示</div>
              </div>
              <Switch v-model:checked="isRecommend" />
            </div>
          </div>

          <div v-if="isTop" class="mt-4">
            <FormItem label="置顶过期时间 (到期后自动取消置顶)">
              <DatePicker
                v-model:value="topExpireTime"
                show-time
                class="w-full"
                placeholder="可选，留空为永久置顶"
              />
            </FormItem>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Spin>
  </Modal>
</template>
