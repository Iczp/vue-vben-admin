<script lang="ts" setup>
import type {
  RecommendationRuleCreateDto,
  RecommendationRuleDto,
  RecommendationRuleUpdateDto,
} from '#/api/cms';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Col,
  Divider,
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Row,
  Spin,
  Switch,
} from 'antdv-next';

import {
  createRecommendationRuleApi,
  getRecommendationRuleApi,
  updateRecommendationRuleApi,
} from '#/api/cms';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() => (isEdit.value ? '编辑推荐规则' : '新建推荐规则'));

const name = ref('');
const scene = ref('');
const isEnabled = ref(true);
const freshnessWeight = ref<number>(0.2);
const similarityWeight = ref<number>(0.3);
const interestWeight = ref<number>(0.3);
const popularityWeight = ref<number>(0.1);
const manualWeight = ref<number>(0.1);
const readPenalty = ref<number>(0.5);
const exposurePenalty = ref<number>(0.3);
const candidateCount = ref<number>(100);
const resultCount = ref<number>(20);
const maxSamePublisherCount = ref<number>(2);

function resetState() {
  recordId.value = null;
  name.value = '';
  scene.value = '';
  isEnabled.value = true;
  freshnessWeight.value = 0.2;
  similarityWeight.value = 0.3;
  interestWeight.value = 0.3;
  popularityWeight.value = 0.1;
  manualWeight.value = 0.1;
  readPenalty.value = 0.5;
  exposurePenalty.value = 0.3;
  candidateCount.value = 100;
  resultCount.value = 20;
  maxSamePublisherCount.value = 2;
}

async function initData(record?: RecommendationRuleDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getRecommendationRuleApi(record.id);
      name.value = detail.name || '';
      scene.value = detail.scene || '';
      isEnabled.value = detail.isEnabled ?? true;
      freshnessWeight.value = detail.freshnessWeight || 0;
      similarityWeight.value = detail.similarityWeight || 0;
      interestWeight.value = detail.interestWeight || 0;
      popularityWeight.value = detail.popularityWeight || 0;
      manualWeight.value = detail.manualWeight || 0;
      readPenalty.value = detail.readPenalty || 0;
      exposurePenalty.value = detail.exposurePenalty || 0;
      candidateCount.value = detail.candidateCount || 100;
      resultCount.value = detail.resultCount || 20;
      maxSamePublisherCount.value = detail.maxSamePublisherCount || 2;
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<RecommendationRuleDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim() || !scene.value.trim()) {
      message.error('请填写规则名称及应用场景');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: RecommendationRuleUpdateDto = {
          candidateCount: candidateCount.value,
          exposurePenalty: exposurePenalty.value,
          freshnessWeight: freshnessWeight.value,
          interestWeight: interestWeight.value,
          isEnabled: isEnabled.value,
          manualWeight: manualWeight.value,
          maxSamePublisherCount: maxSamePublisherCount.value,
          name: name.value,
          popularityWeight: popularityWeight.value,
          readPenalty: readPenalty.value,
          resultCount: resultCount.value,
          scene: scene.value,
          similarityWeight: similarityWeight.value,
        };
        await updateRecommendationRuleApi(recordId.value, updateData);
        message.success('推荐规则更新成功');
      } else {
        const createData: RecommendationRuleCreateDto = {
          candidateCount: candidateCount.value,
          exposurePenalty: exposurePenalty.value,
          freshnessWeight: freshnessWeight.value,
          interestWeight: interestWeight.value,
          isEnabled: isEnabled.value,
          manualWeight: manualWeight.value,
          maxSamePublisherCount: maxSamePublisherCount.value,
          name: name.value,
          popularityWeight: popularityWeight.value,
          readPenalty: readPenalty.value,
          resultCount: resultCount.value,
          scene: scene.value,
          similarityWeight: similarityWeight.value,
        };
        await createRecommendationRuleApi(createData);
        message.success('推荐规则创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存规则失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as RecommendationRuleDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[680px] max-w-full">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="规则名称" required>
              <Input
                v-model:value="name"
                placeholder="例如：首页个性化推荐 / 相关阅读"
              />
            </FormItem>
          </Col>
          <Col :span="12">
            <FormItem label="应用场景 (Scene)" required>
              <Input
                v-model:value="scene"
                placeholder="例如：home / article_detail"
              />
            </FormItem>
          </Col>
        </Row>

        <Divider class="text-xs text-muted-foreground">
          特征权重配置 (权重范围建议 0 ~ 1)
        </Divider>

        <Row :gutter="16">
          <Col :span="8">
            <FormItem label="时效权重 (Freshness)">
              <InputNumber
                v-model:value="freshnessWeight"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="相似度权重 (Similarity)">
              <InputNumber
                v-model:value="similarityWeight"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="兴趣偏好权重 (Interest)">
              <InputNumber
                v-model:value="interestWeight"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
        </Row>

        <Row :gutter="16">
          <Col :span="8">
            <FormItem label="热度权重 (Popularity)">
              <InputNumber
                v-model:value="popularityWeight"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="人工干预权重 (Manual)">
              <InputNumber
                v-model:value="manualWeight"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="已读降权惩罚系数">
              <InputNumber
                v-model:value="readPenalty"
                :step="0.05"
                :min="0"
                class="w-full"
              />
            </FormItem>
          </Col>
        </Row>

        <Divider class="text-xs text-muted-foreground">
          结果规模与去重限制
        </Divider>

        <Row :gutter="16">
          <Col :span="8">
            <FormItem label="候选集数量 (CandidateCount)">
              <InputNumber
                v-model:value="candidateCount"
                :min="1"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="返回条数 (ResultCount)">
              <InputNumber
                v-model:value="resultCount"
                :min="1"
                class="w-full"
              />
            </FormItem>
          </Col>
          <Col :span="8">
            <FormItem label="同作者最大条目数">
              <InputNumber
                v-model:value="maxSamePublisherCount"
                :min="1"
                class="w-full"
              />
            </FormItem>
          </Col>
        </Row>

        <div class="flex items-center justify-between p-3 border rounded bg-muted/20 mt-2">
          <div>
            <div class="font-medium text-sm">启用该推荐规则</div>
            <div class="text-xs text-muted-foreground">停用后对应场景将降级为默认时间线推荐</div>
          </div>
          <Switch v-model:checked="isEnabled" />
        </div>
      </Form>
    </Spin>
  </Modal>
</template>
