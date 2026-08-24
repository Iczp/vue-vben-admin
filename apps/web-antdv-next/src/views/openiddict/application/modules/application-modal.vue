<script lang="ts" setup>
import type { ApplicationDto } from '#/api/openiddict';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Col,
  Input,
  message,
  Row,
  Select,
  Tabs,
} from 'antdv-next';

import {
  createApplicationApi,
  generateClientSecretApi,
  updateApplicationApi,
} from '#/api/openiddict';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const appModel = ref<ApplicationDto | null>(null);
const activeTab = ref('basic');

const clientId = ref('');
const displayName = ref('');
const clientType = ref('confidential');
const consentType = ref('explicit');
const clientSecret = ref('');
const redirectUrisText = ref('');
const postLogoutRedirectUrisText = ref('');

const isEdit = computed(() => Boolean(appModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑客户端')} - ${appModel.value?.clientId}`
    : $t('common.create', '新建客户端应用'),
);

function resetState() {
  clientId.value = '';
  displayName.value = '';
  clientType.value = 'confidential';
  consentType.value = 'explicit';
  clientSecret.value = '';
  redirectUrisText.value = '';
  postLogoutRedirectUrisText.value = '';
  activeTab.value = 'basic';
}

async function onGenerateSecret() {
  try {
    const secret = await generateClientSecretApi();
    clientSecret.value = secret;
    message.success($t('page.openiddict.generateSecretSuccess', '密钥已生成'));
  } catch {
    // 降级生成随机安全字符串
    const randomSecret = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
    clientSecret.value = randomSecret;
  }
}

const [Modal, modalApi] = useVbenModal<ApplicationDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!clientId.value.trim()) {
      message.error($t('page.openiddict.clientIdRequired', '请输入客户端 ID'));
      activeTab.value = 'basic';
      return;
    }

    const redirectUris = redirectUrisText.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
    const postLogoutRedirectUris = postLogoutRedirectUrisText.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      modalApi.lock();
      if (isEdit.value && appModel.value?.id) {
        await updateApplicationApi(appModel.value.id, {
          clientId: clientId.value,
          clientType: clientType.value,
          consentType: consentType.value,
          displayName: displayName.value,
          permissions: appModel.value.permissions || [],
          postLogoutRedirectUris,
          redirectUris,
        });
      } else {
        await createApplicationApi({
          clientId: clientId.value,
          clientSecret: clientSecret.value || undefined,
          clientType: clientType.value,
          consentType: consentType.value,
          displayName: displayName.value,
          permissions: [],
          postLogoutRedirectUris,
          redirectUris,
        });
      }

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      appModel.value = modalApi.getData() || null;
      if (appModel.value?.id) {
        clientId.value = appModel.value.clientId || '';
        displayName.value = appModel.value.displayName || '';
        clientType.value = appModel.value.clientType || 'confidential';
        consentType.value = appModel.value.consentType || 'explicit';
        redirectUrisText.value = (appModel.value.redirectUris || []).join('\n');
        postLogoutRedirectUrisText.value = (
          appModel.value.postLogoutRedirectUris || []
        ).join('\n');
      }
    } else {
      appModel.value = null;
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[650px]">
    <div class="p-3">
      <Tabs v-model:active-key="activeTab">
        <Tabs.TabPane key="basic" :tab="$t('page.openiddict.tabBasic', '基础配置')">
          <div class="space-y-4 pt-2">
            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">
                  <span class="text-red-500">*</span>
                  {{ $t('page.openiddict.clientId', '客户端 ID') }}
                </div>
                <Input
                  v-model:value="clientId"
                  placeholder="例如: App_Web"
                />
              </Col>
              <Col :span="12">
                <div class="mb-1 font-medium">
                  {{ $t('page.openiddict.displayName', '应用显示名称') }}
                </div>
                <Input
                  v-model:value="displayName"
                  placeholder="例如: Web 门户管理端"
                />
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">
                  {{ $t('page.openiddict.clientType', '客户端类型') }}
                </div>
                <Select
                  v-model:value="clientType"
                  class="w-full"
                  :options="[
                    { label: '机密客户端 (Confidential)', value: 'confidential' },
                    { label: '公共客户端 (Public)', value: 'public' },
                  ]"
                />
              </Col>
              <Col :span="12">
                <div class="mb-1 font-medium">
                  {{ $t('page.openiddict.consentType', '授权许可类型') }}
                </div>
                <Select
                  v-model:value="consentType"
                  class="w-full"
                  :options="[
                    { label: '明确同意 (Explicit)', value: 'explicit' },
                    { label: '隐式同意 (Implicit)', value: 'implicit' },
                    { label: '系统默认 (Systematic)', value: 'systematic' },
                  ]"
                />
              </Col>
            </Row>

            <div v-if="!isEdit && clientType === 'confidential'">
              <div class="mb-1 font-medium">
                {{ $t('page.openiddict.clientSecret', '客户端密钥 (Client Secret)') }}
              </div>
              <div class="flex gap-2">
                <Input
                  v-model:value="clientSecret"
                  placeholder="输入密钥或点击右侧自动生成"
                />
                <Button @click="onGenerateSecret">
                  {{ $t('page.openiddict.generateSecret', '生成密钥') }}
                </Button>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <Tabs.TabPane key="uris" :tab="$t('page.openiddict.tabUris', '回调与重定向')">
          <div class="space-y-4 pt-2">
            <div>
              <div class="mb-1 font-medium">
                {{ $t('page.openiddict.redirectUris', '登录回调地址 (每行一个)') }}
              </div>
              <Input.TextArea
                v-model:value="redirectUrisText"
                :rows="4"
                placeholder="https://localhost:5001/signin-oidc&#10;https://myadmin.com/signin-oidc"
              />
            </div>

            <div>
              <div class="mb-1 font-medium">
                {{ $t('page.openiddict.postLogoutUris', '登出重定向地址 (每行一个)') }}
              </div>
              <Input.TextArea
                v-model:value="postLogoutRedirectUrisText"
                :rows="3"
                placeholder="https://localhost:5001/signout-callback-oidc"
              />
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Modal>
</template>
