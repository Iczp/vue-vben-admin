<script lang="ts" setup>
import type { AuditLogDto } from '#/api/logmanagement';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Card,
  Tabs,
  Tag,
} from 'antdv-next';

import { getAuditLogApi } from '#/api/logmanagement';
import { $t } from '#/locales';

const auditLog = ref<AuditLogDto | null>(null);
const loading = ref(false);
const activeTab = ref('basic');

const [Modal, modalApi] = useVbenModal<{ id: string } | null>({
  fullscreenButton: true,
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      if (data?.id) {
        loading.value = true;
        try {
          auditLog.value = await getAuditLogApi(data.id);
        } finally {
          loading.value = false;
        }
      }
    } else {
      auditLog.value = null;
      activeTab.value = 'basic';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal
    :title="$t('page.system.log.auditDetail', '审计日志详情')"
    class="w-[850px]"
  >
    <div class="p-4">
      <Tabs v-model:active-key="activeTab">
        <!-- 基础信息 -->
        <Tabs.TabPane key="basic" tab="基本请求信息">
          <div class="grid grid-cols-2 gap-3 mt-2 text-sm">
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">HTTP 状态码:</span>
              <Tag :color="auditLog?.httpStatusCode === 200 ? 'green' : 'red'">
                {{ auditLog?.httpStatusCode }}
              </Tag>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">请求方法:</span>
              <Tag color="blue">{{ auditLog?.httpMethod }}</Tag>
            </div>
            <div class="col-span-2 border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground block mb-1">请求 URL:</span>
              <code class="text-xs break-all bg-gray-100 dark:bg-gray-800 p-1 rounded block">{{ auditLog?.url }}</code>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">执行耗时:</span>
              <span class="font-medium">{{ auditLog?.executionDuration }} ms</span>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">执行时间:</span>
              <span>{{ auditLog?.executionTime }}</span>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">客户端 IP:</span>
              <span class="font-mono">{{ auditLog?.clientIpAddress }}</span>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">操作用户:</span>
              <span>{{ auditLog?.userName || '-' }} (ID: {{ auditLog?.userId || '-' }})</span>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">所属租户:</span>
              <span>{{ auditLog?.tenantName || '宿主 (Host)' }}</span>
            </div>
            <div class="border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground mr-2">应用标识:</span>
              <span>{{ auditLog?.applicationName || '-' }}</span>
            </div>
            <div class="col-span-2 border p-2.5 rounded bg-gray-50/50 dark:bg-gray-900/50">
              <span class="text-muted-foreground block mb-1">客户端/浏览器信息:</span>
              <span class="text-xs text-muted-foreground">{{ auditLog?.browserInfo }}</span>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- 操作行为 (Actions) -->
        <Tabs.TabPane
          key="actions"
          :tab="`调用方法 (${auditLog?.actions?.length || 0})`"
        >
          <div class="space-y-3 mt-2">
            <div
              v-if="!auditLog?.actions || auditLog.actions.length === 0"
              class="text-center py-6 text-muted-foreground"
            >
              无具体方法调用记录
            </div>
            <Card
              v-for="act in auditLog?.actions"
              :key="act.id"
              size="small"
              class="border border-gray-100 dark:border-gray-800"
            >
              <template #title>
                <span class="font-mono text-sm"
                  >{{ act.serviceName }} -> {{ act.methodName }}</span
                >
              </template>
              <template #extra>
                <Tag color="cyan">{{ act.executionDuration }} ms</Tag>
              </template>
              <div v-if="act.parameters" class="mt-1">
                <div class="text-xs font-semibold mb-1">请求参数:</div>
                <pre
                  class="bg-gray-50 dark:bg-gray-900 p-2 rounded text-xs overflow-x-auto max-h-48 font-mono"
                  >{{ act.parameters }}</pre
                >
              </div>
            </Card>
          </div>
        </Tabs.TabPane>

        <!-- 实体变更 (Entity Changes) -->
        <Tabs.TabPane
          key="entities"
          :tab="`实体变更 (${auditLog?.entityChanges?.length || 0})`"
        >
          <div class="space-y-4 mt-2">
            <div
              v-if="!auditLog?.entityChanges || auditLog.entityChanges.length === 0"
              class="text-center py-6 text-muted-foreground"
            >
              无实体变更记录
            </div>
            <Card
              v-for="ec in auditLog?.entityChanges"
              :key="ec.id"
              size="small"
            >
              <template #title>
                <span class="font-mono text-xs">{{ ec.entityTypeFullName }}</span>
              </template>
              <template #extra>
                <Tag color="purple">ID: {{ ec.entityId }}</Tag>
              </template>
              <div
                v-if="ec.propertyChanges && ec.propertyChanges.length > 0"
                class="mt-2"
              >
                <table class="w-full text-xs text-left border">
                  <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th class="p-2 border">属性名称</th>
                      <th class="p-2 border">原始值</th>
                      <th class="p-2 border">变更后新值</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="pc in ec.propertyChanges" :key="pc.id">
                      <td class="p-2 border font-medium">
                        {{ pc.propertyName }}
                      </td>
                      <td class="p-2 border text-red-500 font-mono">
                        {{ pc.originalValue || '(null)' }}
                      </td>
                      <td class="p-2 border text-green-500 font-mono">
                        {{ pc.newValue || '(null)' }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        </Tabs.TabPane>

        <!-- 异常堆栈 (Exceptions) -->
        <Tabs.TabPane
          v-if="auditLog?.exceptions"
          key="exceptions"
          tab="异常堆栈"
        >
          <div class="mt-2">
            <pre
              class="bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 p-3 rounded text-xs font-mono overflow-x-auto max-h-[50vh]"
              >{{ auditLog?.exceptions }}</pre
            >
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Modal>
</template>
