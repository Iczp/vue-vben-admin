<script lang="ts" setup>
import type { RecommendationRuleDto } from '#/api/cms';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteRecommendationRuleApi,
  getRecommendationRulesApi,
} from '#/api/cms';

import { useColumns } from './data';
import PreviewModal from './modules/preview-modal.vue';
import RuleModal from './modules/rule-modal.vue';

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RuleModal,
  destroyOnClose: true,
});

const [PreviewCompModal, previewModalApi] = useVbenModal({
  connectedComponent: PreviewModal,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(undefined).open();
}

function onEdit(row: RecommendationRuleDto) {
  formModalApi.setData(row).open();
}

function onPreview(row: RecommendationRuleDto) {
  previewModalApi.setData(row).open();
}

function onDelete(row: RecommendationRuleDto) {
  Modal.confirm({
    content: `确定要删除推荐规则【${row.name}】吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除规则确认',
    async onOk() {
      await deleteRecommendationRuleApi(row.id);
      message.success('规则删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: RecommendationRuleDto;
}) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'preview': {
      onPreview(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as RecommendationRuleDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getRecommendationRulesApi({
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
          });
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 推荐规则核心原理与开发调用指引卡片 -->
      <Card
        variant="borderless"
        class="shrink-0 shadow-sm"
        :body-style="{ padding: '14px 18px' }"
      >
        <div class="flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-base font-semibold">推荐规则引擎 (Recommendation Engine)</span>
              <span
                class="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded"
                >多维加权 + 曝光衰减 + 实时演算</span>
            </div>
            <div class="flex items-center gap-2">
              <Button type="primary" @click="onCreate">
                <template #icon><Plus class="size-4" /></template>
                新建规则
              </Button>
              <Button @click="refreshGrid">
                <template #icon><RotateCw class="size-4" /></template>
                刷新
              </Button>
            </div>
          </div>

          <!-- 原理与调用说明 -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-muted/20 p-3 rounded-lg border"
          >
            <div class="space-y-1.5">
              <div
                class="font-semibold text-foreground text-sm flex items-center gap-1.5"
              >
                <span>🎯</span> 核心原理与特征维度说明
              </div>
              <p class="text-muted-foreground leading-relaxed">
                推荐引擎对已发布且开启“允许推荐”的文章内容池进行多维打分排序，核心计分公式为：
              </p>
              <div
                class="bg-background/80 p-2 rounded border font-mono text-[11px] text-primary"
              >
                最终综合分 = (时效分 × W_fresh) + (热度分 × W_pop) + (人工分 ×
                W_manual) + (相似度 × W_sim) + (偏好 × W_interest)
              </div>
              <ul
                class="list-disc list-inside text-muted-foreground space-y-0.5"
              >
                <li>
                  <strong class="text-foreground">时效性 (Freshness)</strong>：基于时间衰减曲线，越新发布的内容得分越高。
                </li>
                <li>
                  <strong class="text-foreground">热度 (Popularity)</strong>：聚合实际阅读量与点赞互动量综合归一化计分。
                </li>
                <li>
                  <strong class="text-foreground">已读/曝光惩罚</strong>：对已阅读或多轮曝光未点击内容实施乘积惩罚，避免内容疲劳。
                </li>
                <li>
                  <strong class="text-foreground">同发布者打散</strong>：控制连续出现同一作者内容的最大数量，提升多样性。
                </li>
              </ul>
            </div>

            <div
              class="space-y-1.5 border-t md:border-t-0 md:border-l md:pl-3 pt-2 md:pt-0"
            >
              <div
                class="font-semibold text-foreground text-sm flex items-center gap-1.5"
              >
                <span>⚡</span> 前台 / 客户端集成调用指引
              </div>
              <p class="text-muted-foreground leading-relaxed">
                Web 门户、Flutter、H5
                等客户端无需认证即可通过以下公开接口调用推荐流：
              </p>
              <div class="space-y-1.5 text-muted-foreground">
                <div>
                  <div class="font-medium text-foreground">
                    1. 按场景位获取推荐（如首页信息流）：
                  </div>
                  <code
                    class="block bg-background/80 px-2 py-1 rounded border text-[11px] text-primary select-all"
                  >
                    GET /api/cms/recommendations/positions/{scene}?count=10
                  </code>
                </div>
                <div>
                  <div class="font-medium text-foreground">
                    2. 文章详情页相关阅读（自动排除当前文章）：
                  </div>
                  <code
                    class="block bg-background/80 px-2 py-1 rounded border text-[11px] text-primary select-all"
                  >
                    GET /api/cms/recommendations/articles/{code}?count=5
                  </code>
                </div>
                <div>
                  <div class="font-medium text-foreground">
                    3. 曝光与点击反馈上报（用于负反馈与惩罚计算）：
                  </div>
                  <code
                    class="block bg-background/80 px-2 py-1 rounded border text-[11px] text-primary select-all"
                  >
                    POST
                    /api/cms/recommendations/exposures?ruleId={id}&entityType=Article&entityId={id}&isClicked=true
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <!-- 规则列表表格 -->
      <div
        class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2"
      >
        <Grid />
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <FormModal @success="refreshGrid" />

    <!-- 效果演练与实时预览弹窗 -->
    <PreviewCompModal />
  </Page>
</template>
