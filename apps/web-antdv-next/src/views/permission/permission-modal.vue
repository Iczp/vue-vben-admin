<script lang="ts" setup>
import type {
  PermissionGrantInfoDto,
  PermissionGroupDto,
} from '#/api/permission-management';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Card,
  Checkbox,
  Col,
  Divider,
  message,
  Row,
  Spin,
  Tabs,
} from 'antdv-next';

import {
  getPermissionsApi,
  updatePermissionsApi,
} from '#/api/permission-management';
import { $t } from '#/locales';

export interface PermissionModalData {
  displayName?: string;
  providerKey: string;
  providerName: 'C' | 'R' | 'T' | 'U' | string;
}

const emit = defineEmits(['success']);

const activeTab = ref('');
const loading = ref(false);
const permissionGroups = ref<PermissionGroupDto[]>([]);
const permissionStates = ref<Record<string, boolean>>({});
const modalData = ref<null | PermissionModalData>(null);

const getTitle = computed(() => {
  const name = modalData.value?.displayName || modalData.value?.providerKey || '';
  return `${$t('page.permission.modalTitle', '权限管理')} - ${name}`;
});

/**
 * 递归获取某权限的所有子权限名称
 */
function getChildPermissionNames(
  parentName: string,
  allPermissions: PermissionGrantInfoDto[],
): string[] {
  const children = allPermissions.filter((p) => p.parentName === parentName);
  const result: string[] = [];
  for (const child of children) {
    result.push(child.name);
    result.push(...getChildPermissionNames(child.name, allPermissions));
  }
  return result;
}

/**
 * 获取某权限的所有祖先权限名称
 */
function getParentPermissionNames(
  permissionName: string,
  allPermissions: PermissionGrantInfoDto[],
): string[] {
  const current = allPermissions.find((p) => p.name === permissionName);
  if (!current?.parentName) return [];
  return [
    current.parentName,
    ...getParentPermissionNames(current.parentName, allPermissions),
  ];
}

/**
 * 处理单项权限选择变化
 */
function onPermissionChange(
  permission: PermissionGrantInfoDto,
  group: PermissionGroupDto,
) {
  const isChecked = permissionStates.value[permission.name];
  const allPermissions = group.permissions || [];

  if (isChecked) {
    // 勾选子权限时，自动勾选其所有父权限
    const parentNames = getParentPermissionNames(
      permission.name,
      allPermissions,
    );
    for (const pName of parentNames) {
      permissionStates.value[pName] = true;
    }
  } else {
    // 取消父权限时，自动取消其所有子权限
    const childNames = getChildPermissionNames(
      permission.name,
      allPermissions,
    );
    for (const cName of childNames) {
      permissionStates.value[cName] = false;
    }
  }
}

/**
 * 判断当前组是否已全部勾选
 */
function isGroupAllChecked(group: PermissionGroupDto) {
  const perms = group.permissions || [];
  if (perms.length === 0) return false;
  return perms.every((p) => permissionStates.value[p.name]);
}

/**
 * 判断当前组是否部分勾选 (indeterminate)
 */
function isGroupIndeterminate(group: PermissionGroupDto) {
  const perms = group.permissions || [];
  const checkedCount = perms.filter((p) => permissionStates.value[p.name]).length;
  return checkedCount > 0 && checkedCount < perms.length;
}

/**
 * 全选/全不选当前分组权限
 */
function onGroupCheckAllChange(group: PermissionGroupDto, checked: boolean) {
  const perms = group.permissions || [];
  for (const p of perms) {
    permissionStates.value[p.name] = checked;
  }
}

/**
 * 是否属于顶级权限
 */
function isRootPermission(permission: PermissionGrantInfoDto) {
  return !permission.parentName;
}

const [Modal, modalApi] = useVbenModal<PermissionModalData>({
  fullscreenButton: true,
  async onConfirm() {
    if (!modalData.value) return;
    try {
      modalApi.lock();
      const permissions = Object.keys(permissionStates.value).map((name) => ({
        isGranted: Boolean(permissionStates.value[name]),
        name,
      }));

      await updatePermissionsApi(
        {
          providerKey: modalData.value.providerKey,
          providerName: modalData.value.providerName,
        },
        { permissions },
      );

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      modalData.value = modalApi.getData() || null;
      if (modalData.value) {
        loading.value = true;
        try {
          const res = await getPermissionsApi({
            providerKey: modalData.value.providerKey,
            providerName: modalData.value.providerName,
          });

          permissionGroups.value = res.groups || [];
          if (permissionGroups.value.length > 0 && !activeTab.value) {
            activeTab.value = permissionGroups.value[0]?.name || '';
          }

          const states: Record<string, boolean> = {};
          for (const group of permissionGroups.value) {
            for (const p of group.permissions || []) {
              states[p.name] = Boolean(p.isGranted);
            }
          }
          permissionStates.value = states;
        } finally {
          loading.value = false;
        }
      }
    } else {
      modalData.value = null;
      permissionGroups.value = [];
      permissionStates.value = {};
      activeTab.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[880px]">
    <Spin :spinning="loading">
      <div class="min-h-[380px] p-2">
        <Tabs v-model:active-key="activeTab" tab-position="left">
          <Tabs.TabPane
            v-for="group in permissionGroups"
            :key="group.name"
            :tab="group.displayName || group.name"
          >
            <div class="px-3">
              <div class="mb-3 flex items-center justify-between">
                <span class="text-base font-semibold">
                  {{ group.displayName || group.name }}
                </span>
                <Checkbox
                  :checked="isGroupAllChecked(group)"
                  :indeterminate="isGroupIndeterminate(group)"
                  @update:checked="(val: any) => onGroupCheckAllChange(group, Boolean(val))"
                >
                  {{ $t('page.permission.selectAll', '全选本组') }}
                </Checkbox>
              </div>
              <Divider class="my-2" />

              <div class="max-h-[480px] overflow-y-auto pr-2">
                <Row :gutter="[12, 12]">
                  <Col
                    v-for="perm in group.permissions"
                    :key="perm.name"
                    :span="24"
                    :class="{ 'pl-6': !isRootPermission(perm) }"
                  >
                    <Card size="small" class="hover:border-primary">
                      <Checkbox
                        v-model:checked="permissionStates[perm.name]"
                        @change="() => onPermissionChange(perm, group)"
                      >
                        <span :class="{ 'font-medium': isRootPermission(perm) }">
                          {{ perm.displayName || perm.name }}
                        </span>
                        <span class="ml-2 text-xs text-gray-400">
                          ({{ perm.name }})
                        </span>
                      </Checkbox>
                    </Card>
                  </Col>
                </Row>
              </div>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </Spin>
  </Modal>
</template>
