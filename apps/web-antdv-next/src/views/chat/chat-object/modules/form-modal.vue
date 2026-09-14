<script lang="ts" setup>
import type { ChatObjectDto } from '#/api/chat';

import { computed, onMounted, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Input,
  message,
  Radio,
  RadioGroup,
  Select,
  Switch,
  TreeSelect,
} from 'antdv-next';

import {
  ChatObjectTypeEnums,
  createChatObjectApi,
  getCategoryTreeApi,
  getChatObjectTypesApi,
  updateChatObjectApi,
  VerificationMethodEnums,
} from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<ChatObjectDto | null>(null);

const name = ref('');
const displayName = ref('');
const code = ref('');
const objectType = ref<ChatObjectTypeEnums>(ChatObjectTypeEnums.Personal);
const chatObjectTypeId = ref('Personal');
const verificationMethod = ref<VerificationMethodEnums>(
  VerificationMethodEnums.Free,
);
const categoryIds = ref<string[]>([]);
const isEnabled = ref(true);
const isPublic = ref(true);
const description = ref('');
const password = ref('');

const categoryTree = ref<any[]>([]);
const typeOptions = ref<{ label: string; value: string }[]>([]);

const isEdit = computed(() => !!currentRecord.value?.id);
const modalTitle = computed(() =>
  isEdit.value
    ? `编辑聊天对象 - ${currentRecord.value?.name}`
    : '新建聊天对象',
);

async function loadOptions() {
  try {
    const [cats, types] = await Promise.all([
      getCategoryTreeApi().catch(() => []),
      getChatObjectTypesApi({ maxResultCount: 100 }).catch(() => ({
        items: [],
        totalCount: 0,
      })),
    ]);
    categoryTree.value = cats;
    typeOptions.value = (types.items || []).map((t) => ({
      label: `${t.name} (${t.id})`,
      value: t.id,
    }));
  } catch (err) {
    console.error(err);
  }
}

function resetState() {
  currentRecord.value = null;
  name.value = '';
  displayName.value = '';
  code.value = '';
  objectType.value = ChatObjectTypeEnums.Personal;
  chatObjectTypeId.value = typeOptions.value[0]?.value || 'Personal';
  verificationMethod.value = VerificationMethodEnums.Free;
  categoryIds.value = [];
  isEnabled.value = true;
  isPublic.value = true;
  description.value = '';
  password.value = '';
}

const [Modal, modalApi] = useVbenModal<ChatObjectDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入名称/账号');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateChatObjectApi(currentRecord.value.id, {
          categoryIds: categoryIds.value,
          code: code.value.trim() || undefined,
          description: description.value.trim() || undefined,
          displayName: displayName.value.trim() || undefined,
          isEnabled: isEnabled.value,
          isPublic: isPublic.value,
          name: name.value.trim(),
        });
        message.success('聊天对象更新成功');
      } else {
        await createChatObjectApi({
          categoryIds: categoryIds.value,
          chatObjectTypeId: chatObjectTypeId.value,
          code: code.value.trim() || undefined,
          description: description.value.trim() || undefined,
          displayName: displayName.value.trim() || undefined,
          isEnabled: isEnabled.value,
          isPublic: isPublic.value,
          name: name.value.trim(),
          objectType: objectType.value,
          password: password.value || undefined,
          verificationMethod: verificationMethod.value,
        });
        message.success('聊天对象创建成功');
      }
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      loadOptions();
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        currentRecord.value = payload;
        name.value = payload.name || '';
        displayName.value = payload.displayName || '';
        code.value = payload.code || '';
        objectType.value = payload.objectType ?? ChatObjectTypeEnums.Personal;
        chatObjectTypeId.value = payload.chatObjectTypeId || 'Personal';
        verificationMethod.value =
          payload.verificationMethod ?? VerificationMethodEnums.Free;
        categoryIds.value = payload.categoryIds || [];
        isEnabled.value = payload.isEnabled ?? true;
        isPublic.value = payload.isPublic ?? true;
        description.value = payload.description || '';
      }
    } else {
      resetState();
    }
  },
});

onMounted(() => {
  loadOptions();
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="modalTitle" class="w-[560px]">
    <div class="space-y-3 p-4">
      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 font-medium text-sm">
            名称 / 账号 <span class="text-red-500">*</span>
          </div>
          <Input v-model:value="name" placeholder="唯一账号或群名" />
        </div>
        <div>
          <div class="mb-1 font-medium text-sm">显示昵称 (DisplayName)</div>
          <Input v-model:value="displayName" placeholder="对外展示昵称" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <div class="mb-1 font-medium text-sm">对象类型</div>
          <Select
            v-model:value="objectType"
            :disabled="isEdit"
            class="w-full"
            :options="[
              { label: '个人号 (Personal)', value: ChatObjectTypeEnums.Personal },
              { label: '群聊/房间 (Room)', value: ChatObjectTypeEnums.Room },
              { label: '官方服务号 (Official)', value: ChatObjectTypeEnums.Official },
              { label: '订阅号 (Subscription)', value: ChatObjectTypeEnums.Subscription },
              { label: '智能机器人 (Robot)', value: ChatObjectTypeEnums.Robot },
              { label: '商户店长 (ShopKeeper)', value: ChatObjectTypeEnums.ShopKeeper },
              { label: '商户店员 (ShopWaiter)', value: ChatObjectTypeEnums.ShopWaiter },
              { label: '客户 (Customer)', value: ChatObjectTypeEnums.Customer },
            ]"
          />
        </div>
        <div>
          <div class="mb-1 font-medium text-sm">类型定义 (TypeID)</div>
          <Select
            v-model:value="chatObjectTypeId"
            :disabled="isEdit"
            class="w-full"
            :options="typeOptions"
          />
        </div>
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">所属分类</div>
        <TreeSelect
          v-model:value="categoryIds"
          multiple
          class="w-full"
          :tree-data="categoryTree"
          :field-names="{ children: 'children', label: 'name', value: 'id' }"
          placeholder="可多选分类"
          tree-default-expand-all
        />
      </div>

      <div v-if="!isEdit" class="space-y-3">
        <div>
          <div class="mb-1 font-medium text-sm">加群/加好友验证方式</div>
          <RadioGroup v-model:value="verificationMethod">
            <Radio :value="VerificationMethodEnums.Free">自由加入</Radio>
            <Radio :value="VerificationMethodEnums.Password">需要密码</Radio>
            <Radio :value="VerificationMethodEnums.Verify">需要验证</Radio>
          </RadioGroup>
        </div>

        <div v-if="verificationMethod === VerificationMethodEnums.Password">
          <div class="mb-1 font-medium text-sm">进群/好友验证密码</div>
          <Input.Password v-model:value="password" placeholder="请输入验证密码" />
        </div>
      </div>

      <div class="flex items-center justify-between py-1">
        <div>
          <div class="font-medium text-sm">公开可被搜索 (isPublic)</div>
          <div class="text-xs text-muted-foreground">开启后其他用户可通过搜索发现</div>
        </div>
        <Switch v-model:checked="isPublic" />
      </div>

      <div class="flex items-center justify-between py-1">
        <div>
          <div class="font-medium text-sm">正常启用状态 (isEnabled)</div>
          <div class="text-xs text-muted-foreground">禁用后该对象将被冻结封禁</div>
        </div>
        <Switch v-model:checked="isEnabled" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">个性签名 / 说明</div>
        <Input.TextArea v-model:value="description" :rows="2" placeholder="可选填对象签名或群简介" />
      </div>
    </div>
  </Modal>
</template>
