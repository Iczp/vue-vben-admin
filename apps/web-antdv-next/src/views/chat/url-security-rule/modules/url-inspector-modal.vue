<script lang="ts" setup>
import type { UrlCheckOutput } from '#/api/chat/security';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Button, Card, Descriptions, DescriptionsItem, Input, message } from 'antdv-next';

import {
  checkUrlSecurityApi,
  UrlRiskCategory,
  UrlSecurityLevel,
} from '#/api/chat/security';

const testUrl = ref('https://');
const loading = ref(false);
const checkResult = ref<null | UrlCheckOutput>(null);

function getLevelBadge(level: UrlSecurityLevel) {
  switch (level) {
    case UrlSecurityLevel.Safe: {
      return { text: '安全 (白名单)', type: 'success' as const };
    }
    case UrlSecurityLevel.Warning: {
      return { text: '警告 (提示中转)', type: 'warning' as const };
    }
    case UrlSecurityLevel.Blocked: {
      return { text: '阻断 (黑名单拦截)', type: 'error' as const };
    }
    default: {
      return { text: '未知', type: 'info' as const };
    }
  }
}

function getCategoryName(category: UrlRiskCategory) {
  switch (category) {
    case UrlRiskCategory.OfficialOrWhitelisted: {
      return '平台官方/白名单';
    }
    case UrlRiskCategory.UnknownThirdParty: {
      return '未认证第三方';
    }
    case UrlRiskCategory.Fraud: {
      return '电信诈骗';
    }
    case UrlRiskCategory.Phishing: {
      return '仿冒钓鱼';
    }
    case UrlRiskCategory.Porn: {
      return '色情低俗';
    }
    case UrlRiskCategory.IllegalGambling: {
      return '非法赌博';
    }
    case UrlRiskCategory.Malware: {
      return '病毒木马';
    }
    default: {
      return '其它违规';
    }
  }
}

async function onCheck() {
  const url = testUrl.value.trim();
  if (!url || url === 'https://' || url === 'http://') {
    message.warning('请输入待检测的完整 URL');
    return;
  }

  try {
    loading.value = true;
    checkResult.value = await checkUrlSecurityApi({ url });
    message.success('检测完成');
  } finally {
    loading.value = false;
  }
}

function reset() {
  testUrl.value = 'https://';
  checkResult.value = null;
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  onOpenChange(isOpen) {
    if (!isOpen) {
      reset();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="URL 实时安全检测测试台" class="w-[600px]">
    <div class="space-y-4 p-4">
      <div class="flex gap-2">
        <Input
          v-model:value="testUrl"
          placeholder="请输入完整链接，如 https://www.example.com/test?id=1"
          allow-clear
          @press-enter="onCheck"
        />
        <Button type="primary" :loading="loading" @click="onCheck">
          立即检测
        </Button>
      </div>

      <div v-if="checkResult" class="space-y-3 pt-2">
        <Alert
          :message="`安全评估结论：${getLevelBadge(checkResult.level).text}`"
          :description="checkResult.message || checkResult.interceptReason || '该链接允许正常访问'"
          :type="getLevelBadge(checkResult.level).type"
          show-icon
        />

        <Card size="small" title="详细判定指标" class="mt-2">
          <Descriptions :column="2" size="small" bordered>
            <DescriptionsItem label="解析主域名">
              <span class="font-mono">{{ checkResult.domain }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="判定来源">
              <span class="font-mono text-xs">{{ checkResult.source }}</span>
            </DescriptionsItem>
            <DescriptionsItem label="风险分类">
              {{ getCategoryName(checkResult.category) }}
            </DescriptionsItem>
            <DescriptionsItem label="风控级别">
              {{ getLevelBadge(checkResult.level).text }}
            </DescriptionsItem>
            <DescriptionsItem label="拦截原因" :span="2">
              {{ checkResult.interceptReason || '无' }}
            </DescriptionsItem>
          </Descriptions>
        </Card>
      </div>
    </div>
  </Modal>
</template>
