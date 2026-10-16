<script lang="ts" setup>
import type {
  RecommendationRuleDto,
  RecommendationRulePreviewItemDto,
} from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Empty,
  InputNumber,
  message,
  Row,
  Slider,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

import { previewRecommendationRuleApi } from '#/api/cms';

const currentRule = ref<null | RecommendationRuleDto>(null);
const loading = ref(false);

// 交互调参参数
const freshnessWeight = ref(0.2);
const similarityWeight = ref(0.3);
const interestWeight = ref(0.3);
const popularityWeight = ref(0.1);
const manualWeight = ref(0.1);
const resultCount = ref(10);

const previewList = ref<RecommendationRulePreviewItemDto[]>([]);

async function fetchPreview() {
  loading.value = true;
  try {
    const list = await previewRecommendationRuleApi({
      freshnessWeight: freshnessWeight.value,
      similarityWeight: similarityWeight.value,
      interestWeight: interestWeight.value,
      popularityWeight: popularityWeight.value,
      manualWeight: manualWeight.value,
      resultCount: resultCount.value,
      ruleId: currentRule.value?.id,
      scene: currentRule.value?.scene,
    });
    previewList.value = list || [];
  } catch (error) {
    console.error('获取预览失败', error);
    message.error('获取推荐预览列表失败');
  } finally {
    loading.value = false;
  }
}

function initData(rule?: RecommendationRuleDto) {
  if (rule) {
    currentRule.value = rule;
    freshnessWeight.value = Number(rule.freshnessWeight || 0.2);
    similarityWeight.value = Number(rule.similarityWeight || 0.3);
    interestWeight.value = Number(rule.interestWeight || 0.3);
    popularityWeight.value = Number(rule.popularityWeight || 0.1);
    manualWeight.value = Number(rule.manualWeight || 0.1);
    resultCount.value = Number(rule.resultCount || 10);
  } else {
    currentRule.value = null;
    freshnessWeight.value = 0.2;
    similarityWeight.value = 0.3;
    interestWeight.value = 0.3;
    popularityWeight.value = 0.1;
    manualWeight.value = 0.1;
    resultCount.value = 10;
  }
  fetchPreview();
}

const [Modal, modalApi] = useVbenModal<RecommendationRuleDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: true,
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as RecommendationRuleDto | undefined;
      initData(data);
    }
  },
});

import type { TableColumnsType } from 'antdv-next';

const previewColumns: TableColumnsType<RecommendationRulePreviewItemDto> = [
  {
    align: 'center',
    dataIndex: 'rank',
    key: 'rank',
    title: '推荐排位',
    width: 90,
  },
  {
    dataIndex: 'title',
    key: 'title',
    minWidth: 260,
    title: '内容标题与标识',
  },
  {
    dataIndex: 'categoryName',
    key: 'categoryName',
    title: '栏目分类',
    width: 120,
  },
  {
    dataIndex: 'authorName',
    key: 'authorName',
    title: '发布者',
    width: 120,
  },
  {
    align: 'center',
    dataIndex: 'calculatedScore',
    key: 'calculatedScore',
    title: '综合得分',
    width: 110,
  },
  {
    dataIndex: 'publishTime',
    key: 'publishTime',
    title: '发布时间',
    width: 160,
  },
];
</script>

<template>
  <Modal title="推荐规则效果实时演练与预览" class="w-[1000px] max-w-full">
    <div class="flex flex-col gap-4">
      <Alert
        type="info"
        show-icon
        message="推荐计算实时模拟"
        description="您可以随意拖动下方各维度权重或调整候选条数，点击“重新计算排序”即可实时查看该场景下排名前列的文章结果及综合打分。"
      />

      <!-- 规则基本场景卡片 -->
      <Card size="small" variant="borderless" class="bg-muted/20">
        <Descriptions size="small" :column="3">
          <DescriptionsItem label="当前规则">
            <span class="font-semibold">{{
              currentRule?.name || '默认推荐规则'
            }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="绑定应用场景">
            <Tag color="blue">
              {{ currentRule?.scene || '通用场景 (General)' }}
            </Tag>
          </DescriptionsItem>
          <DescriptionsItem label="前台客户端调用代码">
            <code class="text-xs bg-muted px-1.5 py-0.5 rounded text-primary">
              GET /api/cms/recommendations/positions/{{
                currentRule?.scene || 'Scene'
              }}
            </code>
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <!-- 交互权重调参面板 -->
      <Card
        size="small"
        title="算法参数调节面板"
        :bordered="false"
        class="bg-muted/10"
      >
        <Row :gutter="[24, 8]">
          <Col :span="8">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">时效性权重 (Freshness):</span>
              <span class="text-primary font-bold">{{ freshnessWeight }}</span>
            </div>
            <Slider
              v-model:value="freshnessWeight"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </Col>

          <Col :span="8">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">相似度权重 (Similarity):</span>
              <span class="text-primary font-bold">{{ similarityWeight }}</span>
            </div>
            <Slider
              v-model:value="similarityWeight"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </Col>

          <Col :span="8">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">兴趣偏好权重 (Interest):</span>
              <span class="text-primary font-bold">{{ interestWeight }}</span>
            </div>
            <Slider
              v-model:value="interestWeight"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </Col>

          <Col :span="8">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">热度权重 (Popularity):</span>
              <span class="text-primary font-bold">{{ popularityWeight }}</span>
            </div>
            <Slider
              v-model:value="popularityWeight"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </Col>

          <Col :span="8">
            <div class="flex items-center justify-between text-xs">
              <span class="font-medium">人工干预权重 (Manual):</span>
              <span class="text-primary font-bold">{{ manualWeight }}</span>
            </div>
            <Slider
              v-model:value="manualWeight"
              :min="0"
              :max="1"
              :step="0.05"
            />
          </Col>

          <Col :span="8">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-medium">输出条目规模:</span>
            </div>
            <div class="flex items-center gap-2">
              <InputNumber
                v-model:value="resultCount"
                :min="1"
                :max="50"
                class="w-full"
              />
              <Button type="primary" :loading="loading" @click="fetchPreview">
                <template #icon><RotateCw class="size-3.5" /></template>
                重新计算
              </Button>
            </div>
          </Col>
        </Row>
      </Card>

      <!-- 推荐排序结果预览列表 -->
      <Spin :spinning="loading">
        <div class="border rounded-md overflow-hidden bg-background">
          <Table
            :data-source="previewList"
            :columns="previewColumns"
            :pagination="false"
            row-key="articleId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'rank'">
                <Badge
                  :count="record.rank"
                  :number-style="{
                    backgroundColor:
                      record.rank === 1
                        ? '#ff4d4f'
                        : record.rank === 2
                          ? '#fa8c16'
                          : record.rank === 3
                            ? '#faad14'
                            : '#d9d9d9',
                    color: record.rank <= 3 ? '#fff' : '#666',
                    fontWeight: 'bold',
                  }"
                />
              </template>

              <template v-else-if="column.key === 'title'">
                <div class="flex items-center gap-2 py-1">
                  <Avatar
                    v-if="record.coverUrl"
                    shape="square"
                    :size="40"
                    :src="record.coverUrl"
                    class="shrink-0 rounded"
                  />
                  <div class="flex flex-col min-w-0">
                    <span
                      class="font-medium text-sm truncate hover:text-primary cursor-default"
                      :title="record.title"
                    >
                      {{ record.title }}
                    </span>
                    <span class="text-xs text-muted-foreground">短代码: {{ record.code }}</span>
                  </div>
                </div>
              </template>

              <template v-else-if="column.key === 'categoryName'">
                <Tag v-if="record.categoryName" color="cyan">
                  {{ record.categoryName }}
                </Tag>
                <span v-else class="text-muted-foreground text-xs">未分类</span>
              </template>

              <template v-else-if="column.key === 'authorName'">
                <span class="text-xs">{{
                  record.authorName || '系统发布'
                }}</span>
              </template>

              <template v-else-if="column.key === 'calculatedScore'">
                <Tag color="processing" class="font-mono font-semibold">
                  {{ record.calculatedScore }}
                </Tag>
              </template>

              <template v-else-if="column.key === 'publishTime'">
                <span class="text-xs text-muted-foreground">
                  {{
                    record.publishTime
                      ? new Date(record.publishTime).toLocaleString()
                      : '未设定'
                  }}
                </span>
              </template>
            </template>

            <template #emptyText>
              <Empty
                description="暂无符合条件的推荐候选文章（请确保已发布文章开启了【允许推荐】）"
              />
            </template>
          </Table>
        </div>
      </Spin>
    </div>
  </Modal>
</template>
