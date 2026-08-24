<script lang="ts" setup>
import type { OrganizationUnitDto } from '#/api/identity';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Input,
  message,
  TreeSelect,
} from 'antdv-next';

import {
  createOrganizationUnitApi,
  getAllOrganizationUnitsApi,
  updateOrganizationUnitApi,
} from '#/api/identity';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const ouModel = ref<OrganizationUnitDto | null>(null);
const parentOU = ref<OrganizationUnitDto | null>(null);
const treeData = ref<any[]>([]);

const displayName = ref('');
const parentId = ref<null | string>(null);

const isEdit = computed(() => Boolean(ouModel.value?.id));
const getTitle = computed(() => {
  if (isEdit.value) {
    return `${$t('common.edit', '编辑部门')} - ${ouModel.value?.displayName}`;
  }
  if (parentOU.value) {
    return `${$t('page.identity.dept.addChild', '添加子部门')} (上级: ${parentOU.value.displayName})`;
  }
  return $t('page.identity.dept.create', '新建根部门');
});

function resetState() {
  ouModel.value = null;
  parentOU.value = null;
  displayName.value = '';
  parentId.value = null;
}

async function loadTreeOptions() {
  try {
    const res = await getAllOrganizationUnitsApi();
    const list = res?.items || (res as any) || [];
    // 构造树选择项
    const map = new Map<string, any>();
    const roots: any[] = [];
    (list || []).forEach((item: OrganizationUnitDto) => {
      map.set(item.id, {
        children: [],
        key: item.id,
        title: item.displayName,
        value: item.id,
      });
    });
    (list || []).forEach((item: OrganizationUnitDto) => {
      const node = map.get(item.id);
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });
    treeData.value = [
      {
        children: roots,
        key: 'root',
        title: $t('page.identity.dept.root', '顶级根部门 (无上级)'),
        value: null,
      },
    ];
  } catch {
    treeData.value = [];
  }
}

const [Modal, modalApi] = useVbenModal<{
  dept?: OrganizationUnitDto | null;
  isAddChild?: boolean;
  parent?: OrganizationUnitDto | null;
} | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!displayName.value.trim()) {
      message.error($t('page.identity.dept.nameRequired', '请输入部门名称'));
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && ouModel.value?.id) {
        await updateOrganizationUnitApi(ouModel.value.id, {
          concurrencyStamp: ouModel.value.concurrencyStamp,
          displayName: displayName.value.trim(),
        });
      } else {
        await createOrganizationUnitApi({
          displayName: displayName.value.trim(),
          parentId: parentId.value || undefined,
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
      const payload = modalApi.getData();
      await loadTreeOptions();

      if (payload?.isAddChild && payload.parent) {
        parentOU.value = payload.parent;
        parentId.value = payload.parent.id;
      } else if (payload?.dept) {
        ouModel.value = payload.dept;
        displayName.value = payload.dept.displayName || '';
        parentId.value = payload.dept.parentId ?? null;
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[540px]">
    <div class="space-y-4 p-4">
      <div v-if="!isEdit">
        <div class="mb-1 font-medium">
          {{ $t('page.identity.dept.parent', '上级部门 / 机构') }}
        </div>
        <TreeSelect
          v-model:value="parentId"
          :tree-data="treeData"
          allow-clear
          class="w-full"
          placeholder="请选择上级部门（留空为顶级部门）"
          tree-default-expand-all
        />
      </div>

      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span>
          {{ $t('page.identity.dept.name', '部门 / 机构名称') }}
        </div>
        <Input
          v-model:value="displayName"
          :placeholder="$t('page.identity.dept.namePlaceholder', '请输入部门名称，如：技术研发中心')"
        />
      </div>
    </div>
  </Modal>
</template>
