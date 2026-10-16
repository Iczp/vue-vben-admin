<script lang="ts" setup>
import type {
  ModerationRuleTestResultDto,
  SensitiveWordHitDto,
  SensitiveWordRuntimeStateDto,
} from '#/api/cms';

import { onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';
import { RotateCw, Search } from '@vben/icons';

import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Descriptions,
  DescriptionsItem,
  Divider,
  Empty,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Row,
  Select,
  Spin,
  Table,
  Tag,
} from 'antdv-next';

import {
  ContentRiskLevel,
  getModerationRuleRuntimeStateApi,
  ModerationDecision,
  ModerationScene,
  ModerationTestTarget,
  reloadModerationRulesApi,
  SensitiveRiskLevel,
  SensitiveWordAction,
  testModerationRuleApi,
} from '#/api/cms';

import { sceneOptions } from '../sensitive-words/data';

// 运行时状态
const runtimeLoading = ref(false);
const runtimeState = ref<SensitiveWordRuntimeStateDto>();
const reloading = ref(false);

// 测试参数
const testParams = reactive<{
  expectedDraftRevision?: number;
  scene?: ModerationScene;
  testTarget: ModerationTestTarget;
  text: string;
  versionId?: string;
}>({
  expectedDraftRevision: undefined,
  scene: ModerationScene.General,
  testTarget: ModerationTestTarget.CurrentPublished,
  text: '',
  versionId: undefined,
});

// 测试结果
const testing = ref(false);
const testResult = ref<ModerationRuleTestResultDto>();

async function loadRuntimeState() {
  runtimeLoading.value = true;
  try {
    runtimeState.value = await getModerationRuleRuntimeStateApi();
  } catch (error) {
    console.error('获取引擎状态失败', error);
  } finally {
    runtimeLoading.value = false;
  }
}

function onReloadRules() {
  Modal.confirm({
    content:
      '立即重载将从数据库重新拉取全部启用的敏感词和白名单，并重新构建内存检索快照树。确定继续吗？',
    okText: '确认重载',
    title: '手动刷新引擎规则',
    async onOk() {
      reloading.value = true;
      try {
        await reloadModerationRulesApi();
        message.success('规则重载指令已触发成功！');
        await loadRuntimeState();
      } catch (error) {
        console.error('重载失败', error);
      } finally {
        reloading.value = false;
      }
    },
  });
}

async function onRunTest() {
  if (!testParams.text.trim()) {
    message.warning('请输入待检测的文本内容');
    return;
  }
  testing.value = true;
  try {
    testResult.value = await testModerationRuleApi({
      expectedDraftRevision: testParams.expectedDraftRevision,
      scene: testParams.scene,
      testTarget: testParams.testTarget,
      text: testParams.text,
      versionId:
        testParams.testTarget === ModerationTestTarget.Version
          ? testParams.versionId?.trim() || undefined
          : undefined,
    });
  } catch (error) {
    console.error('规则检测失败', error);
  } finally {
    testing.value = false;
  }
}

function getDecisionTag(decision?: ModerationDecision) {
  switch (decision) {
    case ModerationDecision.Approve: {
      return { color: 'success', text: '通过 (Approve)' };
    }
    case ModerationDecision.ManualReview: {
      return { color: 'warning', text: '人工复审 (ManualReview)' };
    }
    case ModerationDecision.Reject: {
      return { color: 'error', text: '拦截拒绝 (Reject)' };
    }
    default: {
      return { color: 'default', text: '未知' };
    }
  }
}

function getRiskLevelTag(riskLevel?: ContentRiskLevel) {
  switch (riskLevel) {
    case ContentRiskLevel.High: {
      return { color: 'error', text: '高风险 (High)' };
    }
    case ContentRiskLevel.Low: {
      return { color: 'processing', text: '低风险 (Low)' };
    }
    case ContentRiskLevel.Medium: {
      return { color: 'warning', text: '中风险 (Medium)' };
    }
    case ContentRiskLevel.Pass: {
      return { color: 'success', text: '正常安全 (Pass)' };
    }
    default: {
      return { color: 'default', text: '未知' };
    }
  }
}

function getHitActionTag(action: SensitiveWordAction) {
  switch (action) {
    case SensitiveWordAction.Pass: {
      return { color: 'success', text: '放行通过' };
    }
    case SensitiveWordAction.Reject: {
      return { color: 'error', text: '直接拦截' };
    }
    case SensitiveWordAction.Review: {
      return { color: 'warning', text: '转人工审' };
    }
    default: {
      return { color: 'default', text: String(action) };
    }
  }
}

function getHitRiskLevelTag(level: SensitiveRiskLevel) {
  switch (level) {
    case SensitiveRiskLevel.High: {
      return { color: 'red', text: '高' };
    }
    case SensitiveRiskLevel.Low: {
      return { color: 'blue', text: '低' };
    }
    case SensitiveRiskLevel.Medium: {
      return { color: 'orange', text: '中' };
    }
    default: {
      return { color: 'default', text: String(level) };
    }
  }
}

const hitColumns = [
  { dataIndex: 'word', key: 'word', title: '命中敏感词' },
  { dataIndex: 'category', key: 'category', title: '风险分类' },
  { dataIndex: 'riskLevel', key: 'riskLevel', title: '风险等级' },
  { dataIndex: 'action', key: 'action', title: '处置策略' },
  { dataIndex: 'startIndex', key: 'startIndex', title: '位置区间 (起始-长度)' },
];

onMounted(() => {
  void loadRuntimeState();
});
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-4 overflow-y-auto pr-1">
      <!-- 引擎节点运行时状态 Card -->
      <Card
        title="本地敏感词规则引擎 · 节点运行时状态"
        variant="borderless"
        class="shadow-sm shrink-0"
      >
        <template #extra>
          <div class="flex items-center gap-2">
            <Button
              size="small"
              :loading="runtimeLoading"
              @click="loadRuntimeState"
            >
              <template #icon><RotateCw class="size-3.5" /></template>
              刷新状态
            </Button>
            <Button
              size="small"
              type="primary"
              :loading="reloading"
              @click="onReloadRules"
            >
              <template #icon><RotateCw class="size-3.5" /></template>
              强制重载快照
            </Button>
          </div>
        </template>

        <Spin :spinning="runtimeLoading">
          <div v-if="runtimeState" class="space-y-3">
            <Descriptions :column="4" bordered size="small">
              <DescriptionsItem label="当前快照版本" :span="1">
                <span class="font-mono text-xs font-semibold">{{
                  runtimeState.version || '未加载'
                }}</span>
              </DescriptionsItem>
              <DescriptionsItem label="内存敏感词条数" :span="1">
                <span class="font-bold text-primary">{{
                  runtimeState.wordCount
                }}</span>
                条
              </DescriptionsItem>
              <DescriptionsItem label="内存白名单数" :span="1">
                <span class="font-bold text-success">{{
                  runtimeState.whitelistCount
                }}</span>
                条
              </DescriptionsItem>
              <DescriptionsItem label="最后重载时间" :span="1">
                <span class="text-xs">{{
                  runtimeState.lastReloadTime || '-'
                }}</span>
              </DescriptionsItem>
              <DescriptionsItem label="重载状态" :span="4">
                <Badge
                  :status="runtimeState.lastReloadSuccess ? 'success' : 'error'"
                  :text="
                    runtimeState.lastReloadSuccess
                      ? '引擎快照加载正常 / 运行中'
                      : '引擎重载异常'
                  "
                />
                <span
                  v-if="runtimeState.lastErrorMessage"
                  class="text-error text-xs ml-3"
                >
                  异常信息: {{ runtimeState.lastErrorMessage }}
                </span>
              </DescriptionsItem>
            </Descriptions>
          </div>
          <Empty v-else description="暂未获取到引擎状态" />
        </Spin>
      </Card>

      <!-- 规则调试台与高亮结果 -->
      <Row :gutter="16" class="flex-1 min-h-[500px]">
        <!-- 左侧输入栏 -->
        <Col :span="12" class="h-full flex flex-col">
          <Card
            title="规则调试沙箱 · 输入待测文本"
            variant="borderless"
            class="shadow-sm h-full flex flex-col"
            :body-style="{ flex: 1, display: 'flex', flexDirection: 'column' }"
          >
            <div class="space-y-4 flex-1 flex flex-col">
              <div class="flex flex-col gap-2">
                <div class="flex items-center gap-3">
                  <span class="text-sm font-medium shrink-0">测试规则目标：</span>
                  <RadioGroup
                    v-model:value="testParams.testTarget"
                    button-style="solid"
                    size="small"
                  >
                    <RadioButton :value="ModerationTestTarget.CurrentPublished">
                      当前生效版本
                    </RadioButton>
                    <RadioButton :value="ModerationTestTarget.Draft">
                      未发布草稿态
                    </RadioButton>
                    <RadioButton :value="ModerationTestTarget.Version">
                      指定历史版本
                    </RadioButton>
                  </RadioGroup>
                </div>
                <div
                  v-if="testParams.testTarget === ModerationTestTarget.Version"
                  class="flex items-center gap-3 mt-1"
                >
                  <span class="text-xs text-muted-foreground shrink-0">指定版本标识：</span>
                  <Input
                    v-model:value="testParams.versionId"
                    placeholder="输入历史规则版本 GUID..."
                    class="w-[280px]"
                    size="small"
                  />
                </div>
              </div>

              <div class="flex items-center gap-3">
                <span class="text-sm font-medium shrink-0">模拟审核场景：</span>
                <Select
                  v-model:value="testParams.scene"
                  class="w-[200px]"
                  :options="sceneOptions"
                />
              </div>

              <div class="flex-1 flex flex-col">
                <span class="text-sm font-medium mb-1">待检测文本内容：</span>
                <Input.TextArea
                  v-model:value="testParams.text"
                  placeholder="在此输入包含涉政、暴恐、违禁品、色情、广告引流等测试样本，例如：'这是一个包含违规词汇的测试内容'..."
                  class="flex-1 !resize-none"
                  :rows="12"
                  show-count
                />
              </div>

              <div class="flex items-center justify-between pt-2">
                <div class="text-xs text-muted-foreground">
                  提示：引擎将结合场景隔离策略与白名单免过滤树进行快速判定。
                </div>
                <Button type="primary" :loading="testing" @click="onRunTest">
                  <template #icon><Search class="size-4" /></template>
                  开始风控检测
                </Button>
              </div>
            </div>
          </Card>
        </Col>

        <!-- 右侧检测结果 -->
        <Col :span="12" class="h-full flex flex-col">
          <Card
            title="风控检测诊断结果"
            variant="borderless"
            class="shadow-sm h-full flex flex-col overflow-y-auto"
            :body-style="{ flex: 1 }"
          >
            <Spin :spinning="testing">
              <div v-if="testResult" class="space-y-4">
                <!-- 顶层裁决看板 -->
                <div
                  class="p-4 bg-muted/40 rounded-lg flex items-center justify-between"
                >
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">机审决策：</span>
                    <Tag
                      :color="getDecisionTag(testResult.decision).color"
                      class="px-2.5 py-1 text-sm font-semibold"
                    >
                      {{ getDecisionTag(testResult.decision).text }}
                    </Tag>
                  </div>
                  <div class="flex items-center gap-3">
                    <span class="text-sm font-medium">内容风险：</span>
                    <Tag
                      :color="getRiskLevelTag(testResult.riskLevel).color"
                      class="px-2 py-0.5 font-medium"
                    >
                      {{ getRiskLevelTag(testResult.riskLevel).text }}
                    </Tag>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-3 text-center">
                  <div class="p-2.5 border rounded-md">
                    <div class="text-xs text-muted-foreground">
                      综合风险分值
                    </div>
                    <div class="text-lg font-bold text-primary">
                      {{ testResult.score }}
                    </div>
                  </div>
                  <div class="p-2.5 border rounded-md">
                    <div class="text-xs text-muted-foreground">
                      检测执行耗时
                    </div>
                    <div class="text-lg font-bold">
                      {{ testResult.elapsedMilliseconds }}
                      <span class="text-xs font-normal">ms</span>
                    </div>
                  </div>
                  <div class="p-2.5 border rounded-md">
                    <div class="text-xs text-muted-foreground">
                      命中敏感词条数
                    </div>
                    <div
                      class="text-lg font-bold"
                      :class="
                        testResult.hits.length > 0
                          ? 'text-error'
                          : 'text-success'
                      "
                    >
                      {{ testResult.hits.length }}
                    </div>
                  </div>
                </div>

                <Divider class="my-2" />

                <!-- 命中的关键词明细 -->
                <div>
                  <div
                    class="font-medium text-sm mb-2 flex items-center justify-between"
                  >
                    <span>命中敏感词明细</span>
                    <div
                      class="text-xs text-muted-foreground flex items-center gap-3"
                    >
                      <span>生效规则版本:
                        <strong>{{
                          testResult.ruleVersion || '-'
                        }}</strong></span>
                      <span v-if="testResult.draftRevision">草稿修订:
                        <strong>#{{ testResult.draftRevision }}</strong></span>
                      <span v-if="testResult.activationSequence">激活流水:
                        <strong>#{{ testResult.activationSequence }}</strong></span>
                      <Tag v-if="testResult.runtimeStatus" color="blue">
                        {{ testResult.runtimeStatus }}
                      </Tag>
                    </div>
                  </div>

                  <Table
                    v-if="testResult.hits.length > 0"
                    :columns="hitColumns"
                    :data-source="testResult.hits"
                    :pagination="false"
                    row-key="sensitiveWordId"
                    size="small"
                    bordered
                  >
                    <template #bodyCell="{ column, record }">
                      <template v-if="column.key === 'word'">
                        <span class="font-bold text-error">{{
                          (record as SensitiveWordHitDto).word
                        }}</span>
                      </template>
                      <template v-else-if="column.key === 'riskLevel'">
                        <Tag
                          :color="
                            getHitRiskLevelTag(
                              (record as SensitiveWordHitDto).riskLevel,
                            ).color
                          "
                        >
                          {{
                            getHitRiskLevelTag(
                              (record as SensitiveWordHitDto).riskLevel,
                            ).text
                          }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'action'">
                        <Tag
                          :color="
                            getHitActionTag(
                              (record as SensitiveWordHitDto).action,
                            ).color
                          "
                        >
                          {{
                            getHitActionTag(
                              (record as SensitiveWordHitDto).action,
                            ).text
                          }}
                        </Tag>
                      </template>
                      <template v-else-if="column.key === 'startIndex'">
                        <span class="text-xs font-mono">
                          [{{ (record as SensitiveWordHitDto).startIndex }} ,
                          {{
                            (record as SensitiveWordHitDto).startIndex +
                            (record as SensitiveWordHitDto).length
                          }}] (长{{ (record as SensitiveWordHitDto).length }})
                        </span>
                      </template>
                    </template>
                  </Table>

                  <Alert
                    v-else
                    message="未命中任何敏感词"
                    description="文本内容安全，或所有匹配项已被当前场景的白名单免除。"
                    type="success"
                    show-icon
                    class="mt-2"
                  />
                </div>
              </div>

              <div v-else class="h-[360px] flex items-center justify-center">
                <Empty
                  description="在左侧输入测试文本后，点击【开始风控检测】查看详细命中分析"
                />
              </div>
            </Spin>
          </Card>
        </Col>
      </Row>
    </div>
  </Page>
</template>
