<script lang="ts" setup>
import type { AdminArticleListItemDto } from '#/api/cms';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import {
  Button,
  Card,
  Col,
  message,
  Row,
  Spin,
  Tag,
} from 'antdv-next';
import dayjs from 'dayjs';

import {
  approveArticleApi,
  ArticleStatus,
  getArticlesApi,
  getDailyStatsApi,
  getModerationsApi,
  rejectArticleApi,
} from '#/api/cms';
import ContentStatusBadge from '#/views/cms/components/ContentStatusBadge.vue';

const FileTextIcon = createIconifyIcon('lucide:file-text');
const CheckCircleIcon = createIconifyIcon('lucide:check-circle');
const ClockIcon = createIconifyIcon('lucide:clock');
const EyeIcon = createIconifyIcon('lucide:eye');
const PlusIcon = createIconifyIcon('lucide:plus');
const UploadIcon = createIconifyIcon('lucide:upload-cloud');
const ShieldAlertIcon = createIconifyIcon('lucide:shield-alert');
const FolderIcon = createIconifyIcon('lucide:folder');
const ArrowRightIcon = createIconifyIcon('lucide:arrow-right');

const router = useRouter();

const loading = ref(false);

// 核心指标
const pendingReviewCount = ref(0);
const draftCount = ref(0);
const publishedCount = ref(0);
const todayReadCount = ref(0);
const highRiskCount = ref(0);

// 待审列表与最新发布
const pendingArticles = ref<AdminArticleListItemDto[]>([]);
const recentArticles = ref<AdminArticleListItemDto[]>([]);

async function loadDashboardData() {
  loading.value = true;
  try {
    const today = dayjs().format('YYYY-MM-DD');

    const [
      pendingRes,
      draftRes,
      publishedRes,
      statsRes,
      moderationRes,
    ] = await Promise.allSettled([
      getArticlesApi({ maxResultCount: 5, status: ArticleStatus.PendingReview }),
      getArticlesApi({ maxResultCount: 1, status: ArticleStatus.Draft }),
      getArticlesApi({ maxResultCount: 5, status: ArticleStatus.Published }),
      getDailyStatsApi({ endDate: today, maxResultCount: 1, startDate: today }),
      getModerationsApi({ maxResultCount: 1, status: 2 }), // 待人工审核
    ]);

    if (pendingRes.status === 'fulfilled') {
      pendingReviewCount.value = pendingRes.value.totalCount;
      pendingArticles.value = pendingRes.value.items || [];
    }

    if (draftRes.status === 'fulfilled') {
      draftCount.value = draftRes.value.totalCount;
    }

    if (publishedRes.status === 'fulfilled') {
      publishedCount.value = publishedRes.value.totalCount;
      recentArticles.value = publishedRes.value.items || [];
    }

    if (statsRes.status === 'fulfilled') {
      const stats = statsRes.value.items?.[0];
      todayReadCount.value = stats?.viewCount || 0;
    }

    if (moderationRes.status === 'fulfilled') {
      highRiskCount.value = moderationRes.value.totalCount;
    }
  } catch (error) {
    console.error('加载控制台数据失败', error);
  } finally {
    loading.value = false;
  }
}

async function quickApprove(item: AdminArticleListItemDto) {
  try {
    await approveArticleApi(item.id, '控制台快速审核通过');
    message.success(`文章【${item.title}】已审核通过`);
    loadDashboardData();
  } catch (error) {
    console.error('审核失败', error);
  }
}

async function quickReject(item: AdminArticleListItemDto) {
  try {
    await rejectArticleApi(item.id, { opinion: '内容需调整，已驳回修改' });
    message.warning(`文章【${item.title}】已驳回修改`);
    loadDashboardData();
  } catch (error) {
    console.error('驳回失败', error);
  }
}

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <!-- 顶部数据概览卡片 -->
      <Row :gutter="16">
        <Col :xs="24" :sm="12" :md="6">
          <Card :bordered="false" class="shadow-sm hover:shadow transition-shadow cursor-pointer" @click="router.push('/cms/articles')">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-muted-foreground font-medium">待审核内容</div>
                <div class="text-2xl font-bold mt-1 text-amber-500">{{ pendingReviewCount }}</div>
                <div class="text-xs text-muted-foreground mt-2">亟需编辑或主编审核入库</div>
              </div>
              <div class="p-3 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500">
                <ClockIcon class="size-6" />
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :md="6">
          <Card :bordered="false" class="shadow-sm hover:shadow transition-shadow cursor-pointer" @click="router.push('/cms/articles')">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-muted-foreground font-medium">草稿箱文章</div>
                <div class="text-2xl font-bold mt-1 text-blue-500">{{ draftCount }}</div>
                <div class="text-xs text-muted-foreground mt-2">作者正在编写未提交</div>
              </div>
              <div class="p-3 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500">
                <FileTextIcon class="size-6" />
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :md="6">
          <Card :bordered="false" class="shadow-sm hover:shadow transition-shadow cursor-pointer" @click="router.push('/cms/articles')">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-muted-foreground font-medium">已发布文章总数</div>
                <div class="text-2xl font-bold mt-1 text-green-500">{{ publishedCount }}</div>
                <div class="text-xs text-muted-foreground mt-2">面向前台全网生效文章</div>
              </div>
              <div class="p-3 rounded-full bg-green-50 dark:bg-green-950/40 text-green-500">
                <CheckCircleIcon class="size-6" />
              </div>
            </div>
          </Card>
        </Col>

        <Col :xs="24" :sm="12" :md="6">
          <Card :bordered="false" class="shadow-sm hover:shadow transition-shadow cursor-pointer" @click="router.push('/cms/statistics')">
            <div class="flex items-center justify-between">
              <div>
                <div class="text-xs text-muted-foreground font-medium">今日阅读访问量</div>
                <div class="text-2xl font-bold mt-1 text-purple-500">{{ todayReadCount }}</div>
                <div class="text-xs text-muted-foreground mt-2">全站今日内容访问统计</div>
              </div>
              <div class="p-3 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-500">
                <EyeIcon class="size-6" />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <!-- 快捷入口操作栏 -->
      <Card :bordered="false" class="shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="font-medium text-sm flex items-center gap-2">
            <span>常用快捷操作</span>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Button type="primary" @click="router.push('/cms/articles')">
              <template #icon><PlusIcon class="size-4" /></template>
              撰写发布新文章
            </Button>
            <Button @click="router.push('/cms/assets')">
              <template #icon><UploadIcon class="size-4" /></template>
              媒体库上传
            </Button>
            <Button @click="router.push('/cms/categories')">
              <template #icon><FolderIcon class="size-4" /></template>
              栏目分类管理
            </Button>
            <Button danger ghost @click="router.push('/cms/moderation')">
              <template #icon><ShieldAlertIcon class="size-4" /></template>
              风控拦截待办 ({{ highRiskCount }})
            </Button>
          </div>
        </div>
      </Card>

      <!-- 主体双列布局 -->
      <Row :gutter="16">
        <!-- 左列：待处理审核与最新发布动态 -->
        <Col :xs="24" :lg="16">
          <div class="space-y-4">
            <!-- 待审核列表 -->
            <Card :bordered="false" class="shadow-sm" title="待审核工作流 (待办任务)">
              <template #extra>
                <Button type="link" size="small" @click="router.push('/cms/articles')">
                  查看全部 <ArrowRightIcon class="size-3.5 inline ml-1" />
                </Button>
              </template>

              <Spin :spinning="loading">
                <div v-if="pendingArticles.length === 0" class="py-8 text-center text-muted-foreground text-sm">
                  暂无待审核内容，所有稿件均已妥善处理
                </div>
                <div v-else class="divide-y">
                  <div
                    v-for="item in pendingArticles"
                    :key="item.id"
                    class="py-3 flex items-center justify-between gap-4"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="font-medium text-sm truncate">{{ item.title }}</div>
                      <div class="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span>提交时间：{{ item.creationTime ? dayjs(item.creationTime).format('MM-DD HH:mm') : '-' }}</span>
                        <span>编码：{{ item.code }}</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 shrink-0">
                      <Button type="link" size="small" class="text-green-600" @click="quickApprove(item)">
                        快速通过
                      </Button>
                      <Button type="link" size="small" danger @click="quickReject(item)">
                        驳回
                      </Button>
                    </div>
                  </div>
                </div>
              </Spin>
            </Card>

            <!-- 最近发布内容 -->
            <Card :bordered="false" class="shadow-sm" title="最新发布动态">
              <template #extra>
                <Button type="link" size="small" @click="router.push('/cms/articles')">
                  所有内容 <ArrowRightIcon class="size-3.5 inline ml-1" />
                </Button>
              </template>

              <Spin :spinning="loading">
                <div v-if="recentArticles.length === 0" class="py-8 text-center text-muted-foreground text-sm">
                  暂无已发布文章
                </div>
                <div v-else class="divide-y">
                  <div
                    v-for="item in recentArticles"
                    :key="item.id"
                    class="py-3 flex items-center justify-between gap-4"
                  >
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center gap-2">
                        <span class="font-medium text-sm truncate">{{ item.title }}</span>
                        <ContentStatusBadge :status="item.status" />
                      </div>
                      <div class="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span>发布时间：{{ item.publishTime ? dayjs(item.publishTime).format('YYYY-MM-DD HH:mm') : '-' }}</span>
                        <span>浏览量：{{ item.viewCount || 0 }}</span>
                        <span>评论数：{{ item.commentCount || 0 }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Spin>
            </Card>
          </div>
        </Col>

        <!-- 右列：系统内容类型形态与指引 -->
        <Col :xs="24" :lg="8">
          <div class="space-y-4">
            <!-- 系统内容形态形态卡片 -->
            <Card :bordered="false" class="shadow-sm" title="系统内容模型与类型">
              <template #extra>
                <Button type="link" size="small" @click="router.push('/cms/content-types')">
                  类型字典 <ArrowRightIcon class="size-3.5 inline ml-1" />
                </Button>
              </template>

              <div class="space-y-3">
                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">标准文章 (Article)</div>
                    <div class="text-xs text-muted-foreground">长图文、深度专栏、新闻报道</div>
                  </div>
                  <Tag color="blue">核心模型</Tag>
                </div>

                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">快讯资讯 (News)</div>
                    <div class="text-xs text-muted-foreground">即时滚动简讯、要闻直达</div>
                  </div>
                  <Tag color="cyan">轻量时效</Tag>
                </div>

                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">通知公告 (Notice)</div>
                    <div class="text-xs text-muted-foreground">站内公告、系统升级、官方声明</div>
                  </div>
                  <Tag color="orange">官方公告</Tag>
                </div>

                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">图集画廊 (Gallery)</div>
                    <div class="text-xs text-muted-foreground">多图展示、摄影相册、视觉焦点</div>
                  </div>
                  <Tag color="purple">多媒体</Tag>
                </div>

                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">视频内容 (Video)</div>
                    <div class="text-xs text-muted-foreground">短视频流、长视频点播课程</div>
                  </div>
                  <Tag color="red">音视频</Tag>
                </div>

                <div class="p-3 rounded border bg-muted/20 flex items-center justify-between">
                  <div>
                    <div class="font-medium text-sm">百科词条 (Wiki)</div>
                    <div class="text-xs text-muted-foreground">结构化知识图谱、术语释义</div>
                  </div>
                  <Tag color="green">知识库</Tag>
                </div>
              </div>
            </Card>

            <!-- 审核与发布准则卡片 -->
            <Card :bordered="false" class="shadow-sm" title="CMS 采编与风控规范">
              <div class="text-xs leading-relaxed text-muted-foreground space-y-2">
                <p>1. <strong>机审风控前置：</strong> 所有提交审核稿件均将触发敏感词及风控机审，出现高风险将自动流转至风控裁决台。</p>
                <p>2. <strong>定时发布机制：</strong> 设置未来时间的定时发布任务将在到达对应时刻后由后台调度作业自动生效推送。</p>
                <p>3. <strong>版本历史追溯：</strong> 每次关键编辑均支持归档为快照版本，可在版本记录中一键查看比对。</p>
              </div>
            </Card>
          </div>
        </Col>
      </Row>
    </div>
  </Page>
</template>
