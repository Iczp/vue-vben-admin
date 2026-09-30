<script lang="ts" setup>
import type { CategoryCreateDto, CategoryDto, CategoryUpdateDto } from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
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

import {
  createCategoryApi,
  getCategoriesApi,
  getCategoryApi,
  updateCategoryApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const activeTab = ref('basic');
const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑栏目分类' : '新建栏目分类'));

// 表单字段
const parentId = ref<string | undefined>(undefined);
const name = ref('');
const code = ref('');
const slug = ref('');
const description = ref('');
const coverUrl = ref('');
const sorting = ref(0);
const isActive = ref(true);
const seoTitle = ref('');
const seoKeywords = ref('');
const seoDescription = ref('');

const categoryOptions = ref<{ label: string; value: string }[]>([]);

function resetState() {
  recordId.value = null;
  activeTab.value = 'basic';
  parentId.value = undefined;
  name.value = '';
  code.value = '';
  slug.value = '';
  description.value = '';
  coverUrl.value = '';
  sorting.value = 0;
  isActive.value = true;
  seoTitle.value = '';
  seoKeywords.value = '';
  seoDescription.value = '';
}

async function loadParentCategories(currentId?: string) {
  try {
    const res = await getCategoriesApi({ maxResultCount: 200 });
    categoryOptions.value = (res.items || [])
      .filter((c: CategoryDto) => !currentId || c.id !== currentId)
      .map((c: CategoryDto) => ({
        label: c.name,
        value: c.id,
      }));
  } catch (error) {
    console.error('加载父级分类失败', error);
  }
}

async function initData(payload?: { parentId?: string; record?: CategoryDto }) {
  resetState();
  const currentId = payload?.record?.id;
  await loadParentCategories(currentId);

  if (payload?.record) {
    recordId.value = payload.record.id;
    loading.value = true;
    try {
      const detail: CategoryDto = await getCategoryApi(payload.record.id);
      parentId.value = detail.parentId || undefined;
      name.value = detail.name || '';
      code.value = detail.code || '';
      slug.value = detail.slug || '';
      description.value = detail.description || '';
      coverUrl.value = detail.coverUrl || '';
      sorting.value = detail.sorting || 0;
      isActive.value = detail.isActive ?? true;
      seoTitle.value = detail.seoTitle || '';
      seoKeywords.value = detail.seoKeywords || '';
      seoDescription.value = detail.seoDescription || '';
    } finally {
      loading.value = false;
    }
  } else if (payload?.parentId) {
    parentId.value = payload.parentId;
  }
}

const [Modal, modalApi] = useVbenModal<{
  parentId?: string;
  record?: CategoryDto;
}>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.error('请输入分类名称');
      activeTab.value = 'basic';
      return;
    }
    if (!code.value.trim()) {
      message.error('请输入分类编码');
      activeTab.value = 'basic';
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: CategoryUpdateDto = {
          coverUrl: coverUrl.value || undefined,
          description: description.value || undefined,
          isActive: isActive.value,
          name: name.value,
          parentId: parentId.value || undefined,
          code: code.value,
          seoDescription: seoDescription.value || undefined,
          seoKeywords: seoKeywords.value || undefined,
          seoTitle: seoTitle.value || undefined,
          slug: slug.value || undefined,
          sorting: sorting.value,
        };
        await updateCategoryApi(recordId.value, updateData);
        message.success('分类更新成功');
      } else {
        const createData: CategoryCreateDto = {
          code: code.value,
          coverUrl: coverUrl.value || undefined,
          description: description.value || undefined,
          isActive: isActive.value,
          name: name.value,
          parentId: parentId.value || undefined,
          seoDescription: seoDescription.value || undefined,
          seoKeywords: seoKeywords.value || undefined,
          seoTitle: seoTitle.value || undefined,
          slug: slug.value || undefined,
          sorting: sorting.value,
        };
        await createCategoryApi(createData);
        message.success('分类创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存分类失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as {
        parentId?: string;
        record?: CategoryDto;
      } | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[700px] max-w-full">
    <Spin :spinning="loading">
      <Tabs v-model:activeKey="activeTab">
        <Tabs.TabPane key="basic" tab="基本设置">
          <Form layout="vertical" class="mt-2">
            <FormItem label="上级分类">
              <Select
                v-model:value="parentId"
                placeholder="无上级（设为顶级一级栏目）"
                :options="categoryOptions"
                allow-clear
              />
            </FormItem>

            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="分类名称" required>
                  <Input
                    v-model:value="name"
                    placeholder="例如：科技动态 / 公司新闻"
                    :maxlength="64"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="分类编码 (唯一代码)" required>
                  <Input
                    v-model:value="code"
                    placeholder="例如：tech / news"
                    :maxlength="64"
                  />
                </FormItem>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <FormItem label="URL 别名 (Slug)">
                  <Input
                    v-model:value="slug"
                    placeholder="可选，例如 tech-news"
                    :maxlength="128"
                  />
                </FormItem>
              </Col>
              <Col :span="12">
                <FormItem label="排序序号">
                  <InputNumber
                    v-model:value="sorting"
                    class="w-full"
                    placeholder="数字越大越靠前"
                  />
                </FormItem>
              </Col>
            </Row>

            <FormItem label="分类图标 / 封面图 URL">
              <Input
                v-model:value="coverUrl"
                placeholder="请输入封面图片 URL 或图标地址"
              />
            </FormItem>

            <FormItem label="栏目介绍描述">
              <Input.TextArea
                v-model:value="description"
                placeholder="请输入关于本分类栏目的简要说明..."
                :rows="3"
                :maxlength="256"
              />
            </FormItem>

            <div class="flex items-center justify-between p-3 border rounded bg-muted/20">
              <div>
                <div class="font-medium text-sm">启用状态</div>
                <div class="text-xs text-muted-foreground">停用后，该分类下内容将不在导航展示</div>
              </div>
              <Switch v-model:checked="isActive" />
            </div>
          </Form>
        </Tabs.TabPane>

        <Tabs.TabPane key="seo" tab="SEO 搜索引擎配置">
          <Form layout="vertical" class="mt-2">
            <FormItem label="SEO 标题 (SeoTitle)">
              <Input
                v-model:value="seoTitle"
                placeholder="请输入针对搜索引擎展示的自定义标题"
                :maxlength="128"
              />
            </FormItem>

            <FormItem label="SEO 关键词 (SeoKeywords)">
              <Input
                v-model:value="seoKeywords"
                placeholder="关键词用英文逗号分隔，如：科技, 互联网, 资讯"
                :maxlength="256"
              />
            </FormItem>

            <FormItem label="SEO 描述 (SeoDescription)">
              <Input.TextArea
                v-model:value="seoDescription"
                placeholder="针对搜索引擎爬虫展示的分类摘要描述..."
                :rows="4"
                :maxlength="500"
              />
            </FormItem>
          </Form>
        </Tabs.TabPane>
      </Tabs>
    </Spin>
  </Modal>
</template>
