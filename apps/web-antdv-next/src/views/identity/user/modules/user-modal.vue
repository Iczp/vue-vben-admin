<script lang="ts" setup>
import type { IdentityRoleDto, IdentityUserDto } from '#/api/identity';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Card,
  Checkbox,
  Col,
  Input,
  message,
  Row,
  Spin,
  Switch,
  Tabs,
} from 'antdv-next';

import {
  createUserApi,
  getAssignableRolesApi,
  getUserRolesApi,
  updateUserApi,
} from '#/api/identity';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const activeTab = ref('basic');
const loading = ref(false);
const userModel = ref<null | IdentityUserDto>(null);

// 表单字段
const userName = ref('');
const name = ref('');
const surname = ref('');
const email = ref('');
const phoneNumber = ref('');
const password = ref('');
const isActive = ref(true);
const lockoutEnabled = ref(true);
const selectedRoleNames = ref<string[]>([]);
const assignableRoles = ref<IdentityRoleDto[]>([]);

const isEdit = computed(() => Boolean(userModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑用户')} - ${userModel.value?.userName}`
    : $t('common.create', '新建用户'),
);

function resetState() {
  userName.value = '';
  name.value = '';
  surname.value = '';
  email.value = '';
  phoneNumber.value = '';
  password.value = '';
  isActive.value = true;
  lockoutEnabled.value = true;
  selectedRoleNames.value = [];
  assignableRoles.value = [];
  activeTab.value = 'basic';
}

const [Modal, modalApi] = useVbenModal<IdentityUserDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!userName.value.trim()) {
      message.error($t('page.identity.user.userNameRequired', '请输入用户名'));
      activeTab.value = 'basic';
      return;
    }
    if (!email.value.trim()) {
      message.error($t('page.identity.user.emailRequired', '请输入邮箱地址'));
      activeTab.value = 'basic';
      return;
    }
    if (!isEdit.value && !password.value) {
      message.error($t('page.identity.user.passwordRequired', '请输入登录密码'));
      activeTab.value = 'basic';
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && userModel.value?.id) {
        await updateUserApi(userModel.value.id, {
          concurrencyStamp: userModel.value.concurrencyStamp,
          email: email.value,
          isActive: isActive.value,
          lockoutEnabled: lockoutEnabled.value,
          name: name.value,
          phoneNumber: phoneNumber.value,
          roleNames: selectedRoleNames.value,
          surname: surname.value,
          userName: userName.value,
        });
      } else {
        await createUserApi({
          email: email.value,
          isActive: isActive.value,
          lockoutEnabled: lockoutEnabled.value,
          name: name.value,
          password: password.value,
          phoneNumber: phoneNumber.value,
          roleNames: selectedRoleNames.value,
          surname: surname.value,
          userName: userName.value,
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
      userModel.value = modalApi.getData() || null;

      loading.value = true;
      try {
        // 加载可分配角色
        const rolesRes = await getAssignableRolesApi();
        assignableRoles.value = rolesRes.items || [];

        if (userModel.value?.id) {
          userName.value = userModel.value.userName || '';
          name.value = userModel.value.name || '';
          surname.value = userModel.value.surname || '';
          email.value = userModel.value.email || '';
          phoneNumber.value = userModel.value.phoneNumber || '';
          isActive.value = userModel.value.isActive ?? true;
          lockoutEnabled.value = userModel.value.lockoutEnabled ?? true;

          // 加载用户已有角色
          const userRolesRes = await getUserRolesApi(userModel.value.id);
          selectedRoleNames.value = (userRolesRes.items || []).map((r) => r.name);
        }
      } finally {
        loading.value = false;
      }
    } else {
      userModel.value = null;
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[680px]">
    <Spin :spinning="loading">
      <div class="p-3">
        <Tabs v-model:active-key="activeTab">
          <Tabs.TabPane key="basic" :tab="$t('page.identity.user.tabBasic', '基础信息')">
            <div class="space-y-4 pt-2">
              <Row :gutter="16">
                <Col :span="12">
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span>
                    {{ $t('page.identity.user.userName', '用户名') }}
                  </div>
                  <Input
                    v-model:value="userName"
                    :placeholder="$t('page.identity.user.userName', '用户名')"
                  />
                </Col>
                <Col :span="12">
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span>
                    {{ $t('page.identity.user.email', '邮箱') }}
                  </div>
                  <Input
                    v-model:value="email"
                    :placeholder="$t('page.identity.user.email', '邮箱')"
                  />
                </Col>
              </Row>

              <Row :gutter="16">
                <Col :span="12">
                  <div class="mb-1 font-medium">
                    {{ $t('page.identity.user.name', '名 (Name)') }}
                  </div>
                  <Input
                    v-model:value="name"
                    :placeholder="$t('page.identity.user.name', '名')"
                  />
                </Col>
                <Col :span="12">
                  <div class="mb-1 font-medium">
                    {{ $t('page.identity.user.surname', '姓 (Surname)') }}
                  </div>
                  <Input
                    v-model:value="surname"
                    :placeholder="$t('page.identity.user.surname', '姓')"
                  />
                </Col>
              </Row>

              <Row :gutter="16">
                <Col :span="12">
                  <div class="mb-1 font-medium">
                    {{ $t('page.identity.user.phoneNumber', '手机号') }}
                  </div>
                  <Input
                    v-model:value="phoneNumber"
                    :placeholder="$t('page.identity.user.phoneNumber', '手机号')"
                  />
                </Col>
                <Col v-if="!isEdit" :span="12">
                  <div class="mb-1 font-medium">
                    <span class="text-red-500">*</span>
                    {{ $t('page.identity.user.password', '密码') }}
                  </div>
                  <Input.Password
                    v-model:value="password"
                    :placeholder="$t('page.identity.user.password', '密码')"
                  />
                </Col>
              </Row>

              <Row :gutter="16" class="pt-2">
                <Col :span="12">
                  <div class="flex items-center gap-3">
                    <Switch v-model:checked="isActive" />
                    <span class="font-medium">
                      {{ $t('page.identity.user.status', '启用用户') }}
                    </span>
                  </div>
                </Col>
                <Col :span="12">
                  <div class="flex items-center gap-3">
                    <Switch v-model:checked="lockoutEnabled" />
                    <span class="font-medium">
                      {{ $t('page.identity.user.lockout', '启用登录失败锁定') }}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          </Tabs.TabPane>

          <Tabs.TabPane key="roles" :tab="$t('page.identity.user.tabRoles', '所属角色')">
            <div class="max-h-[320px] overflow-y-auto p-2">
              <Row :gutter="[12, 12]">
                <Col
                  v-for="role in assignableRoles"
                  :key="role.id"
                  :span="12"
                >
                  <Card size="small" class="hover:border-primary">
                    <Checkbox
                      :value="role.name"
                      :checked="selectedRoleNames.includes(role.name)"
                      @update:checked="(val: any) => {
                        if (val) {
                          selectedRoleNames.push(role.name);
                        } else {
                          selectedRoleNames = selectedRoleNames.filter(r => r !== role.name);
                        }
                      }"
                    >
                      <span class="font-medium">{{ role.name }}</span>
                    </Checkbox>
                  </Card>
                </Col>
              </Row>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Spin>
  </Modal>
</template>
