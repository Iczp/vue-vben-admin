<script lang="ts" setup>
import type { ApplicationDetailDto, ApplicationDto } from '#/api/openiddict';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Col,
  Input,
  InputNumber,
  message,
  Row,
  Select,
  Tabs,
} from 'antdv-next';

import {
  createApplicationApi,
  generateClientSecretApi,
  getApplicationApi,
  getScopesApi,
  updateApplicationApi,
} from '#/api/openiddict';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const appModel = ref<ApplicationDetailDto | null>(null);
const activeTab = ref('basic');

const clientId = ref('');
const displayName = ref('');
const clientType = ref('confidential');
const consentType = ref('explicit');
const applicationType = ref('web');
const clientSecret = ref('');
const clientUri = ref('');
const logoUri = ref('');
const selectedGrantTypes = ref<string[]>([
  'authorization_code',
  'refresh_token',
]);
const selectedScopes = ref<string[]>(['openid', 'profile', 'email']);
const redirectUrisText = ref('');
const postLogoutRedirectUrisText = ref('');

const accessTokenLifetime = ref<number | undefined>(undefined);
const identityTokenLifetime = ref<number | undefined>(undefined);
const refreshTokenLifetime = ref<number | undefined>(undefined);
const authorizationCodeLifetime = ref<number | undefined>(undefined);
const deviceCodeLifetime = ref<number | undefined>(undefined);
const allowedCorsOriginsText = ref('');

const availableScopes = ref<Array<{ label: string; value: string }>>([
  { label: 'openid (OpenID 身份验证)', value: 'openid' },
  { label: 'profile (个人档案)', value: 'profile' },
  { label: 'email (电子邮箱)', value: 'email' },
  { label: 'phone (电话号码)', value: 'phone' },
  { label: 'address (地址信息)', value: 'address' },
  { label: 'roles (用户角色列表)', value: 'roles' },
]);

const grantTypeOptions = [
  { label: '授权码模式 (authorization_code)', value: 'authorization_code' },
  { label: '客户端凭据 (client_credentials)', value: 'client_credentials' },
  { label: '刷新令牌 (refresh_token)', value: 'refresh_token' },
  { label: '密码模式 (password)', value: 'password' },
  { label: '隐式模式 (implicit)', value: 'implicit' },
  {
    label: '设备码授权 (device_code)',
    value: 'urn:ietf:params:oauth:grant-type:device_code',
  },
];

const isEdit = computed(() => Boolean(appModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑客户端')} - ${appModel.value?.clientId}`
    : $t('common.create', '新建客户端应用'),
);

async function loadScopes() {
  try {
    const res = await getScopesApi({ maxResultCount: 100 });
    const dynamicScopes = (res.items || []).map((s) => ({
      label: s.displayName ? `${s.name} (${s.displayName})` : s.name,
      value: s.name,
    }));
    const map = new Map<string, string>();
    [...availableScopes.value, ...dynamicScopes].forEach((item) => {
      map.set(item.value, item.label);
    });
    availableScopes.value = [...map.entries()].map(([value, label]) => ({
      label,
      value,
    }));
  } catch {}
}

function resetState() {
  clientId.value = '';
  displayName.value = '';
  clientType.value = 'confidential';
  consentType.value = 'explicit';
  applicationType.value = 'web';
  clientSecret.value = '';
  clientUri.value = '';
  logoUri.value = '';
  selectedGrantTypes.value = ['authorization_code', 'refresh_token'];
  selectedScopes.value = ['openid', 'profile', 'email'];
  redirectUrisText.value = '';
  postLogoutRedirectUrisText.value = '';
  accessTokenLifetime.value = undefined;
  identityTokenLifetime.value = undefined;
  refreshTokenLifetime.value = undefined;
  authorizationCodeLifetime.value = undefined;
  deviceCodeLifetime.value = undefined;
  allowedCorsOriginsText.value = '';
  activeTab.value = 'basic';
}

async function onGenerateSecret() {
  try {
    const secret = await generateClientSecretApi();
    clientSecret.value = secret;
    message.success($t('page.openiddict.generateSecretSuccess', '密钥已生成'));
  } catch {
    const randomSecret =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-10);
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
    const allowedCorsOrigins = allowedCorsOriginsText.value
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      modalApi.lock();
      if (isEdit.value && appModel.value?.id) {
        await updateApplicationApi(appModel.value.id, {
          accessTokenLifetime: accessTokenLifetime.value,
          allowedCorsOrigins,
          applicationType: applicationType.value,
          authorizationCodeLifetime: authorizationCodeLifetime.value,
          clientId: clientId.value.trim(),
          clientType: clientType.value,
          clientUri: clientUri.value.trim() || undefined,
          consentType: consentType.value,
          deviceCodeLifetime: deviceCodeLifetime.value,
          displayName: displayName.value.trim() || undefined,
          grantTypes: selectedGrantTypes.value,
          identityTokenLifetime: identityTokenLifetime.value,
          logoUri: logoUri.value.trim() || undefined,
          permissions: appModel.value.permissions || [],
          postLogoutRedirectUris,
          redirectUris,
          refreshTokenLifetime: refreshTokenLifetime.value,
          scopes: selectedScopes.value,
        });
      } else {
        await createApplicationApi({
          accessTokenLifetime: accessTokenLifetime.value,
          allowedCorsOrigins,
          applicationType: applicationType.value,
          authorizationCodeLifetime: authorizationCodeLifetime.value,
          clientId: clientId.value.trim(),
          clientSecret: clientSecret.value.trim() || undefined,
          clientType: clientType.value,
          clientUri: clientUri.value.trim() || undefined,
          consentType: consentType.value,
          deviceCodeLifetime: deviceCodeLifetime.value,
          displayName: displayName.value.trim() || undefined,
          grantTypes: selectedGrantTypes.value,
          identityTokenLifetime: identityTokenLifetime.value,
          logoUri: logoUri.value.trim() || undefined,
          permissions: [],
          postLogoutRedirectUris,
          redirectUris,
          refreshTokenLifetime: refreshTokenLifetime.value,
          scopes: selectedScopes.value,
        });
      }

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      loadScopes();
      const raw = modalApi.getData();
      if (raw?.id) {
        try {
          const detail = await getApplicationApi(raw.id);
          appModel.value = detail;
          clientId.value = detail.clientId || '';
          displayName.value = detail.displayName || '';
          clientType.value = detail.clientType || 'confidential';
          consentType.value = detail.consentType || 'explicit';
          applicationType.value = detail.applicationType || 'web';
          clientUri.value = detail.clientUri || '';
          logoUri.value = detail.logoUri || '';
          selectedGrantTypes.value = detail.grantTypes || [
            'authorization_code',
            'refresh_token',
          ];
          selectedScopes.value = detail.scopes || [
            'openid',
            'profile',
            'email',
          ];
          redirectUrisText.value = (detail.redirectUris || []).join('\n');
          postLogoutRedirectUrisText.value = (
            detail.postLogoutRedirectUris || []
          ).join('\n');
          accessTokenLifetime.value = detail.accessTokenLifetime;
          identityTokenLifetime.value = detail.identityTokenLifetime;
          refreshTokenLifetime.value = detail.refreshTokenLifetime;
          authorizationCodeLifetime.value = detail.authorizationCodeLifetime;
          deviceCodeLifetime.value = detail.deviceCodeLifetime;
          allowedCorsOriginsText.value = (
            detail.allowedCorsOrigins || []
          ).join('\n');
        } catch {
          appModel.value = raw as any;
          clientId.value = raw.clientId || '';
          displayName.value = raw.displayName || '';
        }
      }
    } else {
      appModel.value = null;
      resetState();
    }
  },
});

onMounted(() => {
  loadScopes();
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[720px]">
    <div class="p-3">
      <Tabs v-model:active-key="activeTab">
        <!-- 基础配置 -->
        <Tabs.TabPane
          key="basic"
          :tab="$t('page.openiddict.tabBasic', '基础配置')"
        >
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
                  :disabled="isEdit"
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
                    {
                      label: '机密客户端 (Confidential)',
                      value: 'confidential',
                    },
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

            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">应用类型 (Application Type)</div>
                <Select
                  v-model:value="applicationType"
                  class="w-full"
                  :options="[
                    { label: 'Web 应用', value: 'web' },
                    { label: '原生客户端 (Native)', value: 'native' },
                  ]"
                />
              </Col>
              <Col :span="12">
                <div class="mb-1 font-medium">客户端网址 (Client URI)</div>
                <Input
                  v-model:value="clientUri"
                  placeholder="例如: https://myadmin.com"
                />
              </Col>
            </Row>

            <div v-if="!isEdit && clientType === 'confidential'">
              <div class="mb-1 font-medium">
                {{
                  $t(
                    'page.openiddict.clientSecret',
                    '客户端密钥 (Client Secret)',
                  )
                }}
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

        <!-- 授权模式 (Grant Types) -->
        <Tabs.TabPane key="grantTypes" tab="授权模式 (Grant Types)">
          <div class="pt-2 space-y-3">
            <div class="text-xs text-muted-foreground mb-2">
              请勾选允许该应用使用的 OAuth2 / OpenID Connect 授权模式：
            </div>
            <CheckboxGroup
              v-model:value="selectedGrantTypes"
              class="flex flex-col space-y-2.5"
            >
              <Checkbox
                v-for="gt in grantTypeOptions"
                :key="gt.value"
                :value="gt.value"
              >
                {{ gt.label }}
              </Checkbox>
            </CheckboxGroup>
          </div>
        </Tabs.TabPane>

        <!-- 作用域 (Scopes) -->
        <Tabs.TabPane key="scopes" tab="权限作用域 (Scopes)">
          <div class="pt-2 space-y-3">
            <div class="text-xs text-muted-foreground mb-2">
              请选择该应用允许请求的授权作用域 (Scopes)：
            </div>
            <Select
              v-model:value="selectedScopes"
              mode="multiple"
              :options="availableScopes"
              class="w-full"
              placeholder="选择允许的作用域"
            />
          </div>
        </Tabs.TabPane>

        <!-- 回调与重定向 (URIs) -->
        <Tabs.TabPane
          key="uris"
          :tab="$t('page.openiddict.tabUris', '回调与重定向')"
        >
          <div class="space-y-4 pt-2">
            <div>
              <div class="mb-1 font-medium">
                {{
                  $t('page.openiddict.redirectUris', '登录回调地址 (每行一个)')
                }}
              </div>
              <Input.TextArea
                v-model:value="redirectUrisText"
                :rows="4"
                placeholder="https://localhost:5001/signin-oidc&#10;https://myadmin.com/signin-oidc"
              />
            </div>

            <div>
              <div class="mb-1 font-medium">
                {{
                  $t(
                    'page.openiddict.postLogoutUris',
                    '登出重定向地址 (每行一个)',
                  )
                }}
              </div>
              <Input.TextArea
                v-model:value="postLogoutRedirectUrisText"
                :rows="3"
                placeholder="https://localhost:5001/signout-callback-oidc"
              />
            </div>
          </div>
        </Tabs.TabPane>

        <!-- 令牌生命周期与安全 (Lifetimes & CORS) -->
        <Tabs.TabPane
          key="security"
          tab="令牌生命周期与安全"
        >
          <div class="space-y-4 pt-2">
            <div class="rounded bg-muted/40 p-3 text-xs text-muted-foreground leading-relaxed">
              💡 客户端独立的生命周期配置优先于系统全局默认值（留空则继承系统全局默认）。时间单位均为<strong>秒 (Seconds)</strong>。
            </div>

            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">
                  访问令牌生命周期 (Access Token)
                </div>
                <InputNumber
                  v-model:value="accessTokenLifetime"
                  :min="1"
                  :step="60"
                  placeholder="默认 (如 3600 秒 / 1小时)"
                  class="w-full"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  常用：3600(1小时), 7200(2小时), 86400(1天)
                </div>
              </Col>
              <Col :span="12">
                <div class="mb-1 font-medium">
                  刷新令牌生命周期 (Refresh Token)
                </div>
                <InputNumber
                  v-model:value="refreshTokenLifetime"
                  :min="1"
                  :step="3600"
                  placeholder="默认 (如 1209600 秒 / 14天)"
                  class="w-full"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  常用：604800(7天), 1209600(14天), 2592000(30天)
                </div>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">
                  身份令牌生命周期 (Identity Token)
                </div>
                <InputNumber
                  v-model:value="identityTokenLifetime"
                  :min="1"
                  :step="60"
                  placeholder="默认 (如 300 秒 / 5分钟)"
                  class="w-full"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  常用：300(5分钟), 900(15分钟)
                </div>
              </Col>
              <Col :span="12">
                <div class="mb-1 font-medium">
                  授权码生命周期 (Authorization Code)
                </div>
                <InputNumber
                  v-model:value="authorizationCodeLifetime"
                  :min="1"
                  :step="60"
                  placeholder="默认 (如 300 秒 / 5分钟)"
                  class="w-full"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  常用：300(5分钟)
                </div>
              </Col>
            </Row>

            <Row :gutter="16">
              <Col :span="12">
                <div class="mb-1 font-medium">
                  设备代码生命周期 (Device Code)
                </div>
                <InputNumber
                  v-model:value="deviceCodeLifetime"
                  :min="1"
                  :step="60"
                  placeholder="默认 (如 300 秒 / 5分钟)"
                  class="w-full"
                />
                <div class="mt-1 text-xs text-muted-foreground">
                  用于设备流授权，常用：300(5分钟)
                </div>
              </Col>
            </Row>

            <div class="pt-2 border-t border-border">
              <div class="mb-1 font-medium">
                允许的跨域来源 (Allowed CORS Origins)
              </div>
              <div class="text-xs text-muted-foreground mb-2">
                系统已自动从“登录回调地址”解析对应域名并允许跨域。如需额外放行其他前端站点或子域名，请在此填写（每行一个）：
              </div>
              <Input.TextArea
                v-model:value="allowedCorsOriginsText"
                :rows="3"
                placeholder="https://app.example.com&#10;http://localhost:3000"
              />
            </div>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </div>
  </Modal>
</template>
