<script lang="ts" setup>
import { computed } from 'vue';

import { Col, Input, Row, Select } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    actorId?: string;
    actorName?: string;
    actorType?: string;
    disabled?: boolean;
  }>(),
  {
    actorId: '',
    actorName: '',
    actorType: 'User',
    disabled: false,
  },
);

const emit = defineEmits<{
  'update:actorId': [value: string];
  'update:actorName': [value: string];
  'update:actorType': [value: string];
}>();

const currentActorType = computed({
  get: () => props.actorType,
  set: (val) => emit('update:actorType', val),
});

const currentActorId = computed({
  get: () => props.actorId,
  set: (val) => emit('update:actorId', val),
});

const currentActorName = computed({
  get: () => props.actorName,
  set: (val) => emit('update:actorName', val),
});

const actorTypeOptions = [
  { label: '系统用户 (User)', value: 'User' },
  { label: '官方公众号 (OfficialAccount)', value: 'OfficialAccount' },
  { label: '企事业单位 (Organization)', value: 'Organization' },
  { label: '智能机器人 (Robot)', value: 'Robot' },
  { label: 'AI 内容创作助手 (AiAssistant)', value: 'AiAssistant' },
  { label: '平台系统 (System)', value: 'System' },
];
</script>

<template>
  <Row :gutter="8">
    <Col :span="8">
      <Select
        v-model:value="currentActorType"
        :disabled="disabled"
        :options="actorTypeOptions"
        placeholder="主体类型"
      />
    </Col>
    <Col :span="8">
      <Input
        v-model:value="currentActorId"
        :disabled="disabled"
        placeholder="主体唯一标识 ID (如 Guid)"
      />
    </Col>
    <Col :span="8">
      <Input
        v-model:value="currentActorName"
        :disabled="disabled"
        placeholder="展示署名名称快照"
      />
    </Col>
  </Row>
</template>
