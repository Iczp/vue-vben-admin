<script lang="ts" setup>
import type { UrlSecurityRuleDto } from '#/api/chat/security';

import { computed, reactive, ref, watch } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Alert,
  Button,
  Descriptions,
  DescriptionsItem,
  Input,
  message,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Switch,
  Tag,
} from 'antdv-next';

import {
  createUrlSecurityRuleApi,
  getUrlSecurityRulesApi,
  refreshUrlSecurityCacheApi,
  updateUrlSecurityRuleApi,
  UrlRiskCategory,
  UrlSecurityLevel,
} from '#/api/chat/security';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

// 安全级别选项
const levelOptions = [
  { label: '安全 (白名单 - 直接放行)', value: UrlSecurityLevel.Safe },
  { label: '警告 (提示中转 - 提示防诈风险)', value: UrlSecurityLevel.Warning },
  {
    label: '阻断 (黑名单 - 禁止打开并拦截发送)',
    value: UrlSecurityLevel.Blocked,
  },
];

// 风险细分类别
const categoryOptions = [
  { label: '平台官方/白名单', value: UrlRiskCategory.OfficialOrWhitelisted },
  { label: '未认证第三方', value: UrlRiskCategory.UnknownThirdParty },
  { label: '电信诈骗', value: UrlRiskCategory.Fraud },
  { label: '仿冒钓鱼', value: UrlRiskCategory.Phishing },
  { label: '色情低俗', value: UrlRiskCategory.Porn },
  { label: '非法赌博', value: UrlRiskCategory.IllegalGambling },
  { label: '病毒木马', value: UrlRiskCategory.Malware },
  { label: '其它违规', value: UrlRiskCategory.Other },
];

// 示例数据
const SAMPLE_INPUT = `google.com
https://accounts.google.com/o/oauth2/v2/auth?client_id=123
*.google.com
github.com
https://github.com/explore
*.tencent.com
baidu.com
google.com`;

const rawInput = ref('');

// 配置表单
const formState = reactive({
  category: UrlRiskCategory.OfficialOrWhitelisted,
  duplicateStrategy: 'skip' as 'overwrite' | 'skip', // skip: 跳过已存在; overwrite: 覆盖已存在
  isEnabled: true,
  level: UrlSecurityLevel.Safe,
  reason: '批量导入安全规则',
});

// 解析状态
const parseResult = reactive({
  invalidLines: [] as string[],
  selfDuplicateCount: 0,
  totalParsedCount: 0,
  validHosts: [] as string[],
});

// 导入执行状态
const importState = reactive({
  createdCount: 0,
  currentHost: '',
  errorCount: 0,
  errorHosts: [] as string[],
  isFinished: false,
  isImporting: false,
  progress: 0,
  skippedCount: 0,
  skippedHosts: [] as string[],
  updatedCount: 0,
  updatedHosts: [] as string[],
});

/**
 * 智能提取纯净域名/匹配模式
 */
function extractHost(line: string): null | string {
  let text = line.trim();
  if (!text) return null;

  // 1. 如果带协议 http:// 或 https://
  if (/^https?:\/\//i.test(text)) {
    try {
      const u = new URL(text);
      text = u.hostname;
    } catch {
      text = text.replace(/^https?:\/\//i, '');
    }
  }

  // 2. 去除路径、端口与查询参数
  text = text.split('/')[0] || '';
  text = text.split('?')[0] || '';
  text = text.split('#')[0] || '';
  if (text.includes(':')) {
    text = text.split(':')[0] || '';
  }

  text = text.trim().toLowerCase();
  if (!text) return null;

  // 3. 通配符域名 (*.domain.com)
  if (text.startsWith('*.')) {
    const sub = text.slice(2);
    if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(sub)) {
      return text;
    }
    return null;
  }

  // 4. 标准多级域名 (如 domain.com, api.site.org)
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(text)) {
    return text;
  }

  // 5. localhost 或内网主机名
  if (/^[a-z0-9-]+$/.test(text) && text.length > 1) {
    return text;
  }

  return null;
}

/**
 * 执行文本解析并去重
 */
function parseRawInput() {
  const text = rawInput.value.trim();
  if (!text) {
    parseResult.validHosts = [];
    parseResult.invalidLines = [];
    parseResult.selfDuplicateCount = 0;
    parseResult.totalParsedCount = 0;
    return;
  }

  // 支持换行、逗号、分号分割
  const rawLines = text
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  parseResult.totalParsedCount = rawLines.length;

  const validSet = new Set<string>();
  const invalidList: string[] = [];
  let dupCount = 0;

  for (const line of rawLines) {
    const host = extractHost(line);
    if (host) {
      if (validSet.has(host)) {
        dupCount++;
      } else {
        validSet.add(host);
      }
    } else {
      invalidList.push(line);
    }
  }

  parseResult.validHosts = [...validSet];
  parseResult.invalidLines = invalidList;
  parseResult.selfDuplicateCount = dupCount;
}

watch(rawInput, () => {
  parseRawInput();
});

// 重置全部状态
function resetState() {
  rawInput.value = '';
  formState.level = UrlSecurityLevel.Safe;
  formState.category = UrlRiskCategory.OfficialOrWhitelisted;
  formState.reason = '批量导入安全规则';
  formState.isEnabled = true;
  formState.duplicateStrategy = 'skip';

  parseResult.validHosts = [];
  parseResult.invalidLines = [];
  parseResult.selfDuplicateCount = 0;
  parseResult.totalParsedCount = 0;

  importState.isImporting = false;
  importState.isFinished = false;
  importState.progress = 0;
  importState.createdCount = 0;
  importState.updatedCount = 0;
  importState.skippedCount = 0;
  importState.errorCount = 0;
  importState.skippedHosts = [];
  importState.updatedHosts = [];
  importState.errorHosts = [];
  importState.currentHost = '';
}

// 填入示例数据
function onFillSample() {
  rawInput.value = SAMPLE_INPUT;
}

// 清空输入
function onClearInput() {
  rawInput.value = '';
}

/**
 * 执行批量导入核心流程
 */
async function executeBatchImport() {
  if (parseResult.validHosts.length === 0) {
    message.warning('请先输入有效的域名或 URL 列表');
    return;
  }

  importState.isImporting = true;
  importState.isFinished = false;
  importState.progress = 0;
  importState.createdCount = 0;
  importState.updatedCount = 0;
  importState.skippedCount = 0;
  importState.errorCount = 0;
  importState.skippedHosts = [];
  importState.updatedHosts = [];
  importState.errorHosts = [];

  modalApi.lock(true);

  const list = parseResult.validHosts;
  const total = list.length;

  for (let i = 0; i < total; i++) {
    const host = list[i]!;
    importState.currentHost = host;
    importState.progress = Math.round(((i + 1) / total) * 100);

    try {
      // 1. 尝试直接新增规则
      await createUrlSecurityRuleApi({
        category: formState.category,
        host,
        isEnabled: formState.isEnabled,
        level: formState.level,
        reason: formState.reason.trim(),
      });
      importState.createdCount++;
    } catch (error: any) {
      // 捕获可能存在的重复冲突 (HTTP 400 或已存在异常)
      const errMsg = error?.message || error?.error?.message || String(error);
      const isDuplicate =
        errMsg.includes('已存在') ||
        errMsg.includes('duplicate') ||
        errMsg.includes('Duplicate');

      if (isDuplicate) {
        if (formState.duplicateStrategy === 'skip') {
          // 策略为：跳过已存在
          importState.skippedCount++;
          importState.skippedHosts.push(host);
        } else {
          // 策略为：覆盖更新已存在
          try {
            // 根据域名检索现有规则获取 ID
            const searchRes = await getUrlSecurityRulesApi({
              keyword: host,
              maxResultCount: 5,
              skipCount: 0,
            });
            const existing = searchRes?.items?.find(
              (item: UrlSecurityRuleDto) => item.host === host,
            );
            if (existing?.id) {
              await updateUrlSecurityRuleApi(existing.id, {
                category: formState.category,
                host,
                isEnabled: formState.isEnabled,
                level: formState.level,
                reason: formState.reason.trim(),
              });
              importState.updatedCount++;
              importState.updatedHosts.push(host);
            } else {
              // 无法精确定位旧规则，计入异常
              importState.errorCount++;
              importState.errorHosts.push(`${host} (未找到已存在记录)`);
            }
          } catch {
            importState.errorCount++;
            importState.errorHosts.push(`${host} (覆盖更新失败)`);
          }
        }
      } else {
        // 其他未知错误
        importState.errorCount++;
        importState.errorHosts.push(`${host} (${errMsg})`);
      }
    }
  }

  // 导入完毕，统一执行一次 Redis 缓存全量刷新
  try {
    await refreshUrlSecurityCacheApi();
  } catch (error) {
    console.warn('刷新 Redis 缓存提示:', error);
  }

  importState.isImporting = false;
  importState.isFinished = true;
  modalApi.lock(false);

  message.success(
    `批量导入完成！新增 ${importState.createdCount} 条，覆盖 ${importState.updatedCount} 条，跳过 ${importState.skippedCount} 条`,
  );
  emit('success');
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onCancel() {
    modalApi.close();
  },
  onConfirm: async () => {
    if (importState.isFinished) {
      modalApi.close();
      return;
    }
    await executeBatchImport();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
    }
  },
  title: '批量导入 URL 安全风控规则',
});

const canSubmit = computed(() => {
  return parseResult.validHosts.length > 0 && !importState.isImporting;
});
</script>

<template>
  <Modal class="w-[720px]">
    <div class="space-y-4 p-4 text-sm">
      <!-- 批量输入大文本框 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <span class="font-medium">
            待导入域名或网址列表 <span class="text-red-500">*</span>
          </span>
          <div class="flex items-center gap-2">
            <Button
              size="small"
              type="link"
              class="p-0 text-xs"
              @click="onFillSample"
            >
              填入示例数据
            </Button>
            <span class="text-muted-foreground/40">|</span>
            <Button
              size="small"
              type="link"
              danger
              class="p-0 text-xs"
              @click="onClearInput"
            >
              清空
            </Button>
          </div>
        </div>

        <Input.TextArea
          v-model:value="rawInput"
          :disabled="importState.isImporting"
          placeholder="支持直接粘贴域名、完整网页链接，每行一个或用逗号、分号隔开。&#10;系统将自动智能提取纯净域名、去除 URL 参数与重复项。&#10;&#10;示例：&#10;google.com&#10;https://accounts.google.com/auth?redirect_uri=xxx&#10;*.badphishing.xyz&#10;github.com"
          :rows="6"
        />

        <!-- 实时解析状态指示 -->
        <div
          class="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground"
        >
          <div>
            输入总行目:
            <span class="font-bold text-foreground">
              {{ parseResult.totalParsedCount }}
            </span>
          </div>
          <div>
            有效纯净域名:
            <span class="font-bold text-emerald-600">
              {{ parseResult.validHosts.length }}
            </span>
          </div>
          <div v-if="parseResult.selfDuplicateCount > 0">
            批次内重复已合并:
            <span class="font-bold text-amber-600">
              {{ parseResult.selfDuplicateCount }}
            </span>
          </div>
          <div v-if="parseResult.invalidLines.length > 0">
            无效格式已忽略:
            <span class="font-bold text-red-500">
              {{ parseResult.invalidLines.length }}
            </span>
          </div>
        </div>
      </div>

      <!-- 规则属性统一设定 -->
      <div class="border rounded-md p-3 bg-muted/20 space-y-3">
        <div class="text-xs font-semibold text-foreground/80">
          批量导入规则统一属性
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <div class="mb-1 text-xs font-medium">安全风控级别</div>
            <Select
              v-model:value="formState.level"
              :options="levelOptions"
              class="w-full"
              :disabled="importState.isImporting"
            />
          </div>
          <div>
            <div class="mb-1 text-xs font-medium">风险细分类别</div>
            <Select
              v-model:value="formState.category"
              :options="categoryOptions"
              class="w-full"
              :disabled="importState.isImporting"
            />
          </div>
        </div>

        <div>
          <div class="mb-1 text-xs font-medium">说明 / 依据备注</div>
          <Input
            v-model:value="formState.reason"
            placeholder="如：202610安全合规批量加白名单 / 涉案反诈通报黑名单"
            :maxlength="256"
            :disabled="importState.isImporting"
          />
        </div>

        <!-- 重复处理策略 (核心需求) -->
        <div class="border-t pt-2 mt-2">
          <div
            class="text-xs font-medium mb-1.5 flex items-center justify-between"
          >
            <span>遇到系统中已存在的域名时（处理重复）：</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs text-muted-foreground">立即启用规则</span>
              <Switch
                v-model:checked="formState.isEnabled"
                size="small"
                :disabled="importState.isImporting"
              />
            </div>
          </div>
          <RadioGroup
            v-model:value="formState.duplicateStrategy"
            :disabled="importState.isImporting"
          >
            <Radio value="skip">
              <span class="font-medium text-xs">跳过已存在 (推荐)</span>
              <span class="text-xs text-muted-foreground ml-1">
                保留系统已有设置，不修改现有规则，仅新增不存在的域名
              </span>
            </Radio>
            <div class="mt-1">
              <Radio value="overwrite">
                <span class="font-medium text-xs">覆盖更新已存在</span>
                <span class="text-xs text-muted-foreground ml-1">
                  若域名已存在，将其安全级别、分类与说明自动更新为当前所选属性
                </span>
              </Radio>
            </div>
          </RadioGroup>
        </div>
      </div>

      <!-- 解析有效域名列表预览 -->
      <div
        v-if="
          parseResult.validHosts.length > 0 &&
          !importState.isImporting &&
          !importState.isFinished
        "
      >
        <div class="text-xs font-medium text-muted-foreground mb-1">
          解析有效域名预览 (共 {{ parseResult.validHosts.length }} 个)：
        </div>
        <div
          class="max-h-24 overflow-y-auto flex flex-wrap gap-1 p-2 bg-background border rounded-md"
        >
          <Tag
            v-for="h in parseResult.validHosts.slice(0, 50)"
            :key="h"
            color="blue"
            class="text-xs"
          >
            {{ h }}
          </Tag>
          <span
            v-if="parseResult.validHosts.length > 50"
            class="text-xs text-muted-foreground self-center ml-1"
          >
            ... 等 {{ parseResult.validHosts.length }} 条
          </span>
        </div>
      </div>

      <!-- 执行导入进度条 -->
      <div v-if="importState.isImporting" class="space-y-2 py-2">
        <div class="flex items-center justify-between text-xs">
          <span>正在导入处理：<code class="font-bold text-primary">{{
              importState.currentHost
            }}</code></span>
          <span>{{ importState.progress }}%</span>
        </div>
        <Progress :percent="importState.progress" status="active" />
      </div>

      <!-- 导入结果完成报告 -->
      <div v-if="importState.isFinished" class="space-y-3">
        <Alert
          type="success"
          show-icon
          message="批量导入处理已完成，已同步刷新 Redis 规则引擎缓存！"
        />

        <Descriptions
          bordered
          size="small"
          :column="2"
          class="bg-background rounded-md"
        >
          <DescriptionsItem label="本次处理总计">
            <span class="font-bold">{{ parseResult.validHosts.length }} 条</span>
          </DescriptionsItem>
          <DescriptionsItem label="新增成功">
            <Tag color="success">+ {{ importState.createdCount }} 条</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="覆盖更新已存在">
            <Tag color="blue">{{ importState.updatedCount }} 条</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="跳过已存在重复">
            <Tag color="warning">{{ importState.skippedCount }} 条</Tag>
          </DescriptionsItem>
          <DescriptionsItem
            v-if="importState.errorCount > 0"
            label="处理异常"
            :span="2"
          >
            <Tag color="error">{{ importState.errorCount }} 条</Tag>
            <div class="text-xs text-red-500 mt-1 max-h-16 overflow-y-auto">
              {{ importState.errorHosts.join('; ') }}
            </div>
          </DescriptionsItem>
        </Descriptions>

        <!-- 跳过的域名明细展示 -->
        <div
          v-if="importState.skippedHosts.length > 0"
          class="text-xs text-muted-foreground"
        >
          <div class="mb-1 font-medium">跳过已存在的域名列表：</div>
          <div
            class="max-h-20 overflow-y-auto flex flex-wrap gap-1 p-2 bg-muted/20 border rounded"
          >
            <Tag v-for="h in importState.skippedHosts" :key="h" color="orange">
              {{ h }}
            </Tag>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部按钮自定义提示 -->
    <template #footer>
      <div class="flex items-center justify-between w-full px-2">
        <div class="text-xs text-muted-foreground">
          <span v-if="!importState.isFinished">
            * 导入完成后系统将自动刷新 Redis 缓存，规则秒级生效
          </span>
        </div>
        <div class="flex items-center gap-2">
          <Button :disabled="importState.isImporting" @click="modalApi.close()">
            {{ importState.isFinished ? '完成关闭' : '取消' }}
          </Button>
          <Button
            v-if="!importState.isFinished"
            type="primary"
            :disabled="!canSubmit"
            :loading="importState.isImporting"
            @click="executeBatchImport"
          >
            确认开始导入 ({{ parseResult.validHosts.length }})
          </Button>
        </div>
      </div>
    </template>
  </Modal>
</template>
