<script setup lang="ts">
import type { SensitiveWordRuleVersionDetailDto } from '#/api/cms';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Alert, Descriptions, DescriptionsItem, Empty, Spin, Tag } from 'antdv-next';

import { getSensitiveWordRuleVersionApi } from '#/api/cms';

import { versionStatusOptions } from '../data';

const loading = ref(false);
const detail = ref<SensitiveWordRuleVersionDetailDto | null>(null);

async function loadDetail(id: string) {
  loading.value = true;
  try {
    detail.value = await getSensitiveWordRuleVersionApi(id);
  } catch (error) {
    console.error('获取版本详情失败', error);
  } finally {
    loading.value = false;
  }
}

const [Modal, modalApi] = useVbenModal({
  onCancel() {
    modalApi.close();
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id: string } | undefined;
      if (data?.id) {
        modalApi.setState({ title: `规则版本详情` });
        loadDetail(data.id);
      }
    } else {
      detail.value = null;
    }
  },
});
</script>

<template>
  <Modal class="w-[720px]">
    <Spin :spinning="loading">
      <div v-if="detail" class="flex flex-col gap-4 py-2">
        <Descriptions bordered size="small" :column="2">
          <DescriptionsItem label="规则版本号">
            <span class="font-bold text-base">v{{ detail.version }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="状态">
            <Tag :color="versionStatusOptions.find(o => o.value === detail?.status)?.color">
              {{ versionStatusOptions.find(o => o.value === detail?.status)?.label || detail.status }}
            </Tag>
            <Tag v-if="detail.isActive" color="success">当前生效</Tag>
          </DescriptionsItem>

          <DescriptionsItem label="敏感词数量">
            {{ detail.wordCount }} 条
          </DescriptionsItem>
          <DescriptionsItem label="白名单数量">
            {{ detail.whitelistCount }} 条
          </DescriptionsItem>

          <DescriptionsItem label="草稿修订号">
            #{{ detail.draftRevision }}
          </DescriptionsItem>
          <DescriptionsItem label="首次发布时间">
            {{ detail.firstPublishedTime || '-' }}
          </DescriptionsItem>

          <DescriptionsItem label="归一化处理器版本">
            {{ detail.normalizerVersion || 'Standard' }}
          </DescriptionsItem>
          <DescriptionsItem label="引擎格式版本">
            {{ detail.engineFormatVersion || 'v1' }}
          </DescriptionsItem>

          <DescriptionsItem label="规则集 Hash" :span="2">
            <span class="font-mono text-xs select-all">{{ detail.contentHash }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="发布说明" :span="2">
            {{ detail.remark || '无' }}
          </DescriptionsItem>
        </Descriptions>

        <div v-if="detail.sourceVersionsJson" class="flex flex-col gap-1 text-xs">
          <span class="font-medium text-foreground">来源词库版本指纹清单:</span>
          <pre class="p-2 rounded bg-muted font-mono text-[11px] overflow-auto max-h-[160px]">{{ detail.sourceVersionsJson }}</pre>
        </div>

        <Alert
          v-if="detail.errorMessage"
          type="error"
          :message="detail.errorMessage"
          show-icon
        />
      </div>
      <Empty v-else-if="!loading" description="无数据" />
    </Spin>
  </Modal>
</template>
