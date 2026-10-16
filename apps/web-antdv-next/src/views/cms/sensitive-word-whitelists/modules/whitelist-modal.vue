<script lang="ts" setup>
import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Form, FormItem, Input, message, Select, Spin } from 'antdv-next';

import {
  createSensitiveWordWhitelistApi,
  type CreateSensitiveWordWhitelistInput,
  getSensitiveWordWhitelistApi,
  type ModerationScene,
  type SensitiveWordWhitelistDto,
  updateSensitiveWordWhitelistApi,
  type UpdateSensitiveWordWhitelistInput,
} from '#/api/cms';

import { sceneOptions } from '../../sensitive-words/data';

const emit = defineEmits(['success']);

const loading = ref(false);
const recordId = ref<null | string>(null);
const isEdit = computed(() => Boolean(recordId.value));
const modalTitle = computed(() =>
  isEdit.value ? '编辑白名单词条' : '新建白名单词条',
);

const text = ref('');
const scene = ref<ModerationScene | undefined>(undefined);
const remark = ref('');

function resetState() {
  recordId.value = null;
  text.value = '';
  scene.value = undefined;
  remark.value = '';
}

async function initData(record?: SensitiveWordWhitelistDto) {
  resetState();
  if (record) {
    recordId.value = record.id;
    loading.value = true;
    try {
      const detail = await getSensitiveWordWhitelistApi(record.id);
      text.value = detail.text;
      scene.value = detail.scene;
      remark.value = detail.remark || '';
    } finally {
      loading.value = false;
    }
  }
}

const [Modal, modalApi] = useVbenModal<SensitiveWordWhitelistDto | undefined>({
  destroyOnClose: true,
  fullscreenButton: false,
  async onConfirm() {
    if (!text.value.trim()) {
      message.error('请输入白名单文本');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && recordId.value) {
        const updateData: UpdateSensitiveWordWhitelistInput = {
          remark: remark.value || undefined,
          scene: scene.value,
        };
        await updateSensitiveWordWhitelistApi(recordId.value, updateData);
        message.success('白名单词条更新成功');
      } else {
        const createData: CreateSensitiveWordWhitelistInput = {
          remark: remark.value || undefined,
          scene: scene.value,
          text: text.value.trim(),
        };
        await createSensitiveWordWhitelistApi(createData);
        message.success('白名单词条创建成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('保存白名单词条失败', error);
    } finally {
      modalApi.unlock();
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as SensitiveWordWhitelistDto | undefined;
      initData(data);
    }
  },
});
</script>

<template>
  <Modal :title="modalTitle" class="w-[500px]">
    <Spin :spinning="loading">
      <Form layout="vertical" class="mt-2">
        <FormItem label="白名单文本 / 术语" required>
          <Input
            v-model:value="text"
            :disabled="isEdit"
            placeholder="例如：反赌博宣传 / 人体艺术绘画"
            :maxlength="128"
          />
        </FormItem>

        <FormItem label="生效业务场景">
          <Select
            v-model:value="scene"
            :options="sceneOptions"
            allow-clear
            placeholder="全局通用 (默认)"
          />
        </FormItem>

        <FormItem label="加白原因与说明">
          <Input.TextArea
            v-model:value="remark"
            placeholder="请输入该词条加白的原因或审核规则豁免说明..."
            :rows="3"
            :maxlength="512"
          />
        </FormItem>
      </Form>
    </Spin>
  </Modal>
</template>
