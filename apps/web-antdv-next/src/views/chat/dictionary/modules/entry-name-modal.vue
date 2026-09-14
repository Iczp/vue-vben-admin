<script lang="ts" setup>
import type { EntryNameDto } from '#/api/chat';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, InputNumber, message, Select, Switch } from 'antdv-next';

import {
  createEntryNameApi,
  EntryInputTypeEnums,
  updateEntryNameApi,
} from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<EntryNameDto | null>(null);
const parentItem = ref<EntryNameDto | null>(null);

const name = ref('');
const code = ref('');
const inputType = ref<EntryInputTypeEnums>(EntryInputTypeEnums.Choice);
const isChoice = ref(true);
const isRequired = ref(false);
const defaultValue = ref('');
const regex = ref('');
const help = ref('');
const description = ref('');
const sorting = ref<number | undefined>(0);

const isEdit = computed(() => !!currentRecord.value?.id);
const modalTitle = computed(() => {
  if (isEdit.value) {
    return `编辑字典键 - ${currentRecord.value?.name}`;
  }
  if (parentItem.value) {
    return `在【${parentItem.value.name}】下新建子字典键`;
  }
  return '新建顶层字典键';
});

function resetState() {
  currentRecord.value = null;
  parentItem.value = null;
  name.value = '';
  code.value = '';
  inputType.value = EntryInputTypeEnums.Choice;
  isChoice.value = true;
  isRequired.value = false;
  defaultValue.value = '';
  regex.value = '';
  help.value = '';
  description.value = '';
  sorting.value = 0;
}

const [Modal, modalApi] = useVbenModal<{
  parent?: EntryNameDto | null;
  record?: EntryNameDto | null;
}>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入字典键名称');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateEntryNameApi(currentRecord.value.id, {
          code: code.value.trim() || undefined,
          defaultValue: defaultValue.value.trim() || undefined,
          description: description.value.trim() || undefined,
          help: help.value.trim() || undefined,
          inputType: inputType.value,
          isChoice: isChoice.value,
          isRequired: isRequired.value,
          name: name.value.trim(),
          parentId: currentRecord.value.parentId,
          regex: regex.value.trim() || undefined,
          sorting: sorting.value,
        });
        message.success('字典键更新成功');
      } else {
        await createEntryNameApi({
          code: code.value.trim() || undefined,
          defaultValue: defaultValue.value.trim() || undefined,
          description: description.value.trim() || undefined,
          help: help.value.trim() || undefined,
          inputType: inputType.value,
          isChoice: isChoice.value,
          isRequired: isRequired.value,
          name: name.value.trim(),
          parentId: parentItem.value?.id || null,
          regex: regex.value.trim() || undefined,
          sorting: sorting.value,
        });
        message.success('字典键创建成功');
      }
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const data = modalApi.getData();
      if (data?.record) {
        currentRecord.value = data.record;
        name.value = data.record.name || '';
        code.value = data.record.code || '';
        inputType.value = data.record.inputType ?? EntryInputTypeEnums.Choice;
        isChoice.value = data.record.isChoice ?? true;
        isRequired.value = data.record.isRequired ?? false;
        defaultValue.value = data.record.defaultValue || '';
        regex.value = data.record.regex || '';
        help.value = data.record.help || '';
        description.value = data.record.description || '';
        sorting.value = data.record.sorting ?? 0;
      } else if (data?.parent) {
        parentItem.value = data.parent;
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="modalTitle" class="w-[520px]">
    <div class="space-y-3 p-4">
      <div v-if="parentItem" class="rounded bg-muted/50 p-2 text-xs text-muted-foreground">
        上级键：<strong>{{ parentItem.name }}</strong>
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">字典键名称 <span class="text-red-500">*</span></div>
        <Input v-model:value="name" placeholder="如：行业分类、客户等级、群标签" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">编码 (Code)</div>
        <Input v-model:value="code" placeholder="如：IndustryType, CustomerLevel" />
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 font-medium text-sm">录入模式 (InputType)</div>
          <Select
            v-model:value="inputType"
            class="w-full"
            :options="[
              { label: '下拉选项 (Choice)', value: EntryInputTypeEnums.Choice },
              { label: '单行文本 (Text)', value: EntryInputTypeEnums.Text },
              { label: '数值 (Number)', value: EntryInputTypeEnums.Number },
              { label: '日期 (Date)', value: EntryInputTypeEnums.Date },
              { label: '日期时间 (DateTime)', value: EntryInputTypeEnums.DateTime },
              { label: '布尔值 (Boolean)', value: EntryInputTypeEnums.Boolean },
            ]"
          />
        </div>
        <div>
          <div class="mb-1 font-medium text-sm">排序号</div>
          <InputNumber v-model:value="sorting" class="w-full" :min="0" :max="9999" />
        </div>
      </div>

      <div class="flex items-center justify-between py-1">
        <div>
          <div class="font-medium text-sm">是否为选项字典 (isChoice)</div>
          <div class="text-xs text-muted-foreground">为 true 时可在右侧配置下拉可选项 (EntryValue)</div>
        </div>
        <Switch v-model:checked="isChoice" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">字段帮助提示 (Help)</div>
        <Input v-model:value="help" placeholder="表单输入框下方的辅助提示信息" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">描述说明</div>
        <Input.TextArea v-model:value="description" :rows="2" placeholder="可选填字典说明" />
      </div>
    </div>
  </Modal>
</template>
