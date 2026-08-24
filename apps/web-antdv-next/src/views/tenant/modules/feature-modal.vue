<script lang="ts" setup>
import type { FeatureDto, FeatureGroupDto } from '#/api/feature-management';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Card,
  Input,
  message,
  Select,
  Spin,
  Switch,
} from 'antdv-next';

import { getFeaturesApi, updateFeaturesApi } from '#/api/feature-management';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const loading = ref(false);
const featureGroups = ref<FeatureGroupDto[]>([]);
const formValues = ref<Record<string, any>>({});
const providerName = ref('T');
const providerKey = ref<string | undefined>(undefined);
const modalTitle = ref('');

function isBooleanFeature(feature: FeatureDto) {
  const typeName = feature.valueType?.name?.toLowerCase() || '';
  const validatorName =
    feature.valueType?.validator?.name?.toLowerCase() || '';
  return (
    typeName.includes('bool') ||
    typeName.includes('toggle') ||
    validatorName.includes('bool') ||
    feature.value === 'true' ||
    feature.value === 'false'
  );
}

function getFeatureOptions(feature: FeatureDto) {
  const items = feature.valueType?.itemSource?.items || [];
  return items.map((i) => ({
    label: i.displayText?.value || i.value,
    value: i.value,
  }));
}

const [Modal, modalApi] = useVbenModal<{
  providerKey?: string;
  providerName?: string;
  title?: string;
} | null>({
  fullscreenButton: false,
  async onConfirm() {
    try {
      modalApi.lock();
      const features = Object.keys(formValues.value).map((name) => ({
        name,
        value: String(formValues.value[name] ?? ''),
      }));

      await updateFeaturesApi(
        {
          providerKey: providerKey.value,
          providerName: providerName.value,
        },
        { features },
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
      const data = modalApi.getData();
      providerName.value = data?.providerName || 'T';
      providerKey.value = data?.providerKey;
      modalTitle.value =
        data?.title || $t('page.tenant.features', '管理租户功能特性');

      loading.value = true;
      try {
        const res = await getFeaturesApi({
          providerKey: providerKey.value,
          providerName: providerName.value,
        });
        featureGroups.value = res.groups || [];

        const initialMap: Record<string, any> = {};
        (res.groups || []).forEach((group) => {
          (group.features || []).forEach((feat) => {
            if (isBooleanFeature(feat)) {
              initialMap[feat.name] = feat.value === 'true';
            } else {
              initialMap[feat.name] = feat.value ?? '';
            }
          });
        });
        formValues.value = initialMap;
      } finally {
        loading.value = false;
      }
    } else {
      featureGroups.value = [];
      formValues.value = {};
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="modalTitle" class="w-[680px]">
    <Spin :spinning="loading">
      <div class="max-h-[65vh] overflow-y-auto p-4 space-y-4">
        <Card
          v-for="group in featureGroups"
          :key="group.name"
          :title="group.displayName || group.name"
          size="small"
          class="border border-gray-100 dark:border-gray-800"
        >
          <div class="space-y-3 py-1">
            <div
              v-for="feat in group.features"
              :key="feat.name"
              class="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0"
            >
              <div class="flex-1 pr-4">
                <div class="font-medium text-sm">
                  {{ feat.displayName || feat.name }}
                </div>
                <div
                  v-if="feat.description"
                  class="text-xs text-muted-foreground mt-0.5"
                >
                  {{ feat.description }}
                </div>
              </div>

              <div class="w-48 flex justify-end">
                <!-- Boolean Switch -->
                <Switch
                  v-if="isBooleanFeature(feat)"
                  v-model:checked="formValues[feat.name]"
                />

                <!-- Select -->
                <Select
                  v-else-if="getFeatureOptions(feat).length > 0"
                  v-model:value="formValues[feat.name]"
                  :options="getFeatureOptions(feat)"
                  class="w-full"
                />

                <!-- Text / Number Input -->
                <Input
                  v-else
                  v-model:value="formValues[feat.name]"
                  placeholder="请输入特性值"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Spin>
  </Modal>
</template>
