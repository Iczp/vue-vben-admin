<script lang="ts" setup>
import type {
  EmailSettingsDto,
  NameValueDto,
} from '#/api/setting-management';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Checkbox,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Spin,
  Tabs,
} from 'antdv-next';

import {
  getEmailSettingsApi,
  getTimezoneApi,
  getTimezonesApi,
  sendTestEmailApi,
  setTimezoneApi,
  updateEmailSettingsApi,
} from '#/api/setting-management';
import { $t } from '#/locales';

const activeTab = ref('email');
const loading = ref(false);
const savingEmail = ref(false);
const savingTimezone = ref(false);

// 邮件表单数据
const emailForm = ref<EmailSettingsDto>({
  defaultFromAddress: '',
  defaultFromDisplayName: '',
  enableSsl: true,
  smtpDomain: '',
  smtpHost: '',
  smtpPassword: '',
  smtpPort: 587,
  smtpUseDefaultCredentials: false,
  smtpUserName: '',
});

// 时区表单数据
const currentTimezone = ref<string>('');
const timezoneOptions = ref<Array<{ label: string; value: string }>>([]);

// 测试邮件弹窗
const testEmailVisible = ref(false);
const testEmailTarget = ref('');
const sendingTestEmail = ref(false);

async function loadData() {
  loading.value = true;
  try {
    const [emailRes, tzRes, tzListRes] = await Promise.all([
      getEmailSettingsApi().catch(() => ({} as any)),
      getTimezoneApi().catch(() => ''),
      getTimezonesApi().catch(() => []),
    ]);

    const resObj = (emailRes || {}) as any;
    emailForm.value = {
      defaultFromAddress: resObj.defaultFromAddress || '',
      defaultFromDisplayName: resObj.defaultFromDisplayName || '',
      enableSsl: resObj.enableSsl ?? true,
      smtpDomain: resObj.smtpDomain || '',
      smtpHost: resObj.smtpHost || '',
      smtpPassword: resObj.smtpPassword || '',
      smtpPort: resObj.smtpPort ?? 587,
      smtpUseDefaultCredentials: Boolean(resObj.smtpUseDefaultCredentials),
      smtpUserName: resObj.smtpUserName || '',
    };

    currentTimezone.value = tzRes || 'Asia/Shanghai';
    timezoneOptions.value = (tzListRes || []).map((t: NameValueDto) => ({
      label: t.name || String(t.value),
      value: String(t.value),
    }));
  } finally {
    loading.value = false;
  }
}

async function onSaveEmail() {
  savingEmail.value = true;
  try {
    await updateEmailSettingsApi(emailForm.value);
    message.success($t('common.saveSuccess', '邮件配置保存成功'));
  } finally {
    savingEmail.value = false;
  }
}

async function onSaveTimezone() {
  if (!currentTimezone.value) {
    message.warning('请选择时区');
    return;
  }
  savingTimezone.value = true;
  try {
    await setTimezoneApi(currentTimezone.value);
    message.success($t('common.saveSuccess', '时区设置保存成功'));
  } finally {
    savingTimezone.value = false;
  }
}

function openTestEmailModal() {
  testEmailTarget.value = '';
  testEmailVisible.value = true;
}

async function onSendTestEmail() {
  if (!testEmailTarget.value.trim()) {
    message.error('请输入收件人邮箱');
    return;
  }
  sendingTestEmail.value = true;
  try {
    await sendTestEmailApi({
      body: '这是一封来自 ABP 后台管理系统的测试邮件，表示您的 SMTP 邮件发送服务配置正确！',
      subject: 'ABP 系统管理测试邮件',
      targetEmailAddress: testEmailTarget.value.trim(),
    });
    message.success('测试邮件已成功发送，请注意查收！');
    testEmailVisible.value = false;
  } finally {
    sendingTestEmail.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page auto-content-height>
    <Card :bordered="false" class="h-full">
      <Spin :spinning="loading">
        <Tabs v-model:active-key="activeTab">
          <!-- 邮件设置 -->
          <Tabs.TabPane key="email" tab="SMTP 邮件发信配置">
            <div class="max-w-2xl py-4 space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span> 发信人邮箱 (From Address)
                  </div>
                  <Input
                    v-model:value="emailForm.defaultFromAddress"
                    placeholder="如：noreply@example.com"
                  />
                </div>

                <div>
                  <div class="mb-1 font-medium">发信人显示名称 (Display Name)</div>
                  <Input
                    v-model:value="emailForm.defaultFromDisplayName"
                    placeholder="如：系统管理员"
                  />
                </div>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div class="col-span-2">
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span> SMTP 服务器 (Host)
                  </div>
                  <Input
                    v-model:value="emailForm.smtpHost"
                    placeholder="如：smtp.exmail.qq.com"
                  />
                </div>

                <div>
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span> 端口 (Port)
                  </div>
                  <InputNumber
                    v-model:value="emailForm.smtpPort"
                    class="w-full"
                    :min="1"
                    :max="65535"
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="mb-1 font-medium">用户名 / 账号 (UserName)</div>
                  <Input
                    v-model:value="emailForm.smtpUserName"
                    placeholder="请输入发信账号"
                  />
                </div>

                <div>
                  <div class="mb-1 font-medium">密码 / 授权码 (Password)</div>
                  <Input.Password
                    v-model:value="emailForm.smtpPassword"
                    placeholder="请输入 SMTP 授权码"
                  />
                </div>
              </div>

              <div>
                <div class="mb-1 font-medium">域 (Domain)</div>
                <Input
                  v-model:value="emailForm.smtpDomain"
                  placeholder="选填（企业域环境使用）"
                />
              </div>

              <div class="flex items-center gap-6 py-2">
                <Checkbox v-model:checked="emailForm.enableSsl">
                  启用 SSL 安全连接 (Enable SSL)
                </Checkbox>
                <Checkbox v-model:checked="emailForm.smtpUseDefaultCredentials">
                  使用系统默认凭据
                </Checkbox>
              </div>

              <div class="pt-4 flex items-center gap-3">
                <Button
                  type="primary"
                  :loading="savingEmail"
                  @click="onSaveEmail"
                >
                  保存邮件配置
                </Button>
                <Button @click="openTestEmailModal">
                  发送测试邮件
                </Button>
              </div>
            </div>
          </Tabs.TabPane>

          <!-- 时区配置 -->
          <Tabs.TabPane key="timezone" tab="系统默认时区">
            <div class="max-w-xl py-4 space-y-4">
              <div>
                <div class="mb-2 font-medium">系统运行默认时区</div>
                <Select
                  v-model:value="currentTimezone"
                  :options="timezoneOptions"
                  show-search
                  class="w-full"
                  placeholder="请选择时区，如：Asia/Shanghai"
                />
              </div>

              <div class="pt-2">
                <Button
                  type="primary"
                  :loading="savingTimezone"
                  @click="onSaveTimezone"
                >
                  保存时区设置
                </Button>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Spin>
    </Card>

    <!-- 发送测试邮件弹窗 -->
    <Modal
      v-model:open="testEmailVisible"
      title="发送测试邮件"
      :confirm-loading="sendingTestEmail"
      @ok="onSendTestEmail"
    >
      <div class="p-4 space-y-3">
        <div>
          <div class="mb-1 font-medium">
            <span class="text-red-500">*</span> 收件人邮箱地址
          </div>
          <Input
            v-model:value="testEmailTarget"
            placeholder="请输入接收测试邮件的邮箱，如：user@example.com"
          />
        </div>
      </div>
    </Modal>
  </Page>
</template>
