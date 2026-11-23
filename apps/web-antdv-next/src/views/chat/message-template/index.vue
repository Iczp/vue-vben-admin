<script setup lang="ts">
import type {
  MessageTemplateDefinitionDto,
  MessageTemplateGetListInput,
  MessageTemplateRevisionDto,
} from '#/api/chat/message-template';

import { computed, onMounted, reactive, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  FormItem,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  SelectOption,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import {
  createMessageTemplateApi,
  deleteMessageTemplateApi,
  disableMessageTemplateApi,
  enableMessageTemplateApi,
  getMessageTemplateApi,
  getMessageTemplateListApi,
  publishMessageTemplateApi,
  sendTemplateContentMessageApi,
  updateMessageTemplateApi,
} from '#/api/chat/message-template';

import TemplatePreview from './template-preview.vue';

// 列表查询条件
const queryParams = reactive<MessageTemplateGetListInput>({
  keyword: '',
  status: undefined,
  visibility: undefined,
  maxResultCount: 10,
  skipCount: 0,
});

const loading = ref(false);
const total = ref(0);
const templateList = ref<MessageTemplateDefinitionDto[]>([]);

// 表格列定义
const columns = [
  { title: '模板名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '分类', dataIndex: 'category', key: 'category', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '可见范围', dataIndex: 'visibility', key: 'visibility', width: 100 },
  { title: '当前版本', dataIndex: 'currentVersion', key: 'currentVersion', width: 90 },
  {
    title: '发布版本',
    dataIndex: 'latestPublishedVersion',
    key: 'latestPublishedVersion',
    width: 90,
  },
  { title: '创建时间', dataIndex: 'creationTime', key: 'creationTime', width: 170 },
  { title: '操作', key: 'action', width: 260, fixed: 'right' as const },
];

// 加载数据
async function loadData() {
  loading.value = true;
  try {
    const res = await getMessageTemplateListApi(queryParams);
    templateList.value = res.items || [];
    total.value = res.totalCount || 0;
  } catch (err: any) {
    message.error(err?.message || '加载模板列表失败');
  } finally {
    loading.value = false;
  }
}

function handleSearch() {
  queryParams.skipCount = 0;
  loadData();
}

function handleReset() {
  queryParams.keyword = '';
  queryParams.status = undefined;
  queryParams.visibility = undefined;
  queryParams.skipCount = 0;
  loadData();
}

function handleTableChange(pag: any) {
  queryParams.skipCount = ((pag.current || 1) - 1) * (pag.pageSize || 10);
  queryParams.maxResultCount = pag.pageSize || 10;
  loadData();
}

// 示例 JSON
const sampleMinimalCard = JSON.stringify(
  {
    fields: [{ name: 'title', type: 'string', required: true }],
    layout: {
      type: 'card',
      children: [{ type: 'text', bind: 'title', style: 'heading' }],
    },
    actions: [],
  },
  null,
  2,
);

const sampleFullCard = JSON.stringify(
  {
    fields: [
      { name: 'title', type: 'string', required: true },
      { name: 'orderNo', type: 'string', required: true },
      { name: 'status', type: 'string', required: true },
      { name: 'detailUrl', type: 'string', format: 'url', required: true },
    ],
    layout: {
      type: 'card',
      children: [
        { type: 'text', bind: 'title', style: 'heading' },
        { type: 'field', label: '工单编号', bind: 'orderNo' },
        { type: 'badge', bind: 'status', tone: 'neutral' },
        { type: 'divider' },
        { type: 'button', label: '查看详情', actionId: 'viewDetail' },
      ],
    },
    actions: [{ id: 'viewDetail', type: 'openUrl', bind: 'detailUrl' }],
  },
  null,
  2,
);

// 编辑/新建抽屉状态
const drawerVisible = ref(false);
const isEditing = ref(false);
const currentEditId = ref('');
const saving = ref(false);

const formData = reactive({
  name: '',
  category: '',
  description: '',
  visibility: 0,
  draftJson: sampleMinimalCard,
});

// 解析预览用的实时计算属性
const previewLayout = computed(() => {
  try {
    const parsed = JSON.parse(formData.draftJson);
    return parsed.layout || { type: 'card', children: [] };
  } catch {
    return { type: 'card', children: [] };
  }
});

const previewActions = computed(() => {
  try {
    const parsed = JSON.parse(formData.draftJson);
    return parsed.actions || [];
  } catch {
    return [];
  }
});

const mockData = computed(() => {
  try {
    const parsed = JSON.parse(formData.draftJson);
    const mock: Record<string, any> = {};
    if (Array.isArray(parsed.fields)) {
      for (const f of parsed.fields) {
        if (f.format === 'url') {
          mock[f.name] = 'https://example.com/tickets/1001';
        } else {
          mock[f.name] = `示例${f.name}`;
        }
      }
    }
    return mock;
  } catch {
    return {};
  }
});

function handleOpenCreate() {
  isEditing.value = false;
  currentEditId.value = '';
  formData.name = '';
  formData.category = '业务通知';
  formData.description = '';
  formData.visibility = 0;
  formData.draftJson = sampleFullCard;
  drawerVisible.value = true;
}

async function handleOpenEdit(record: MessageTemplateDefinitionDto) {
  isEditing.value = true;
  currentEditId.value = record.id;
  formData.name = record.name;
  formData.category = record.category || '';
  formData.description = record.description || '';
  formData.visibility = record.visibility;
  formData.draftJson = record.draftJson || '{}';
  drawerVisible.value = true;
}

function handleFormatJson() {
  try {
    const parsed = JSON.parse(formData.draftJson);
    formData.draftJson = JSON.stringify(parsed, null, 2);
    message.success('JSON 格式化成功');
  } catch (err: any) {
    message.error(`JSON 语法错误: ${err?.message}`);
  }
}

async function handleSave() {
  if (!formData.name.trim()) {
    message.warning('请输入模板名称');
    return;
  }
  try {
    JSON.parse(formData.draftJson);
  } catch (err: any) {
    message.error(`草稿 JSON 格式不合法: ${err?.message}`);
    return;
  }

  saving.value = true;
  try {
    if (isEditing.value) {
      await updateMessageTemplateApi(currentEditId.value, {
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined,
        visibility: formData.visibility,
        draftJson: formData.draftJson,
      });
      message.success('模板草稿更新成功');
    } else {
      await createMessageTemplateApi({
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        description: formData.description.trim() || undefined,
        visibility: formData.visibility,
        draftJson: formData.draftJson,
      });
      message.success('模板创建成功');
    }
    drawerVisible.value = false;
    loadData();
  } catch (err: any) {
    message.error(err?.message || '保存失败');
  } finally {
    saving.value = false;
  }
}

// 发布对话框
const publishModalVisible = ref(false);
const publishId = ref('');
const publishDesc = ref('');
const publishing = ref(false);

function handleOpenPublish(record: MessageTemplateDefinitionDto) {
  publishId.value = record.id;
  publishDesc.value = `发布 v${record.currentVersion} 版本`;
  publishModalVisible.value = true;
}

async function handleConfirmPublish() {
  publishing.value = true;
  try {
    await publishMessageTemplateApi(publishId.value, {
      description: publishDesc.value.trim() || undefined,
    });
    message.success('模板发布成功');
    publishModalVisible.value = false;
    loadData();
  } catch (err: any) {
    message.error(err?.message || '发布失败');
  } finally {
    publishing.value = false;
  }
}

// 启用 / 停用 / 删除
async function handleToggleStatus(record: MessageTemplateDefinitionDto) {
  try {
    if (record.status === 2) {
      await enableMessageTemplateApi(record.id);
      message.success('模板已启用');
    } else {
      await disableMessageTemplateApi(record.id);
      message.success('模板已停用');
    }
    loadData();
  } catch (err: any) {
    message.error(err?.message || '操作失败');
  }
}

async function handleDelete(record: MessageTemplateDefinitionDto) {
  try {
    await deleteMessageTemplateApi(record.id);
    message.success('模板已删除');
    loadData();
  } catch (err: any) {
    message.error(err?.message || '删除失败');
  }
}

// 历史版本对话框
const historyModalVisible = ref(false);
const historyRevisions = ref<MessageTemplateRevisionDto[]>([]);
const historyTemplateName = ref('');

async function handleViewHistory(record: MessageTemplateDefinitionDto) {
  try {
    const detail = await getMessageTemplateApi(record.id);
    historyTemplateName.value = detail.name;
    historyRevisions.value = detail.revisions || [];
    historyModalVisible.value = true;
  } catch (err: any) {
    message.error(err?.message || '获取历史版本失败');
  }
}

// 测试发送对话框
const testSendModalVisible = ref(false);
const sendSessionUnitId = ref('');
const sendTemplateId = ref('');
const sendTemplateVersion = ref(1);
const sendDataJson = ref('{}');
const sending = ref(false);

function handleOpenTestSend(record: MessageTemplateDefinitionDto) {
  sendTemplateId.value = record.id;
  sendTemplateVersion.value = record.latestPublishedVersion || 1;
  sendSessionUnitId.value = '';

  try {
    const parsed = JSON.parse(record.draftJson);
    const mock: Record<string, any> = {};
    if (Array.isArray(parsed.fields)) {
      for (const f of parsed.fields) {
        if (f.format === 'url') {
          mock[f.name] = 'https://workorder.example.com/tickets/WX001';
        } else {
          mock[f.name] = `测试${f.name}`;
        }
      }
    }
    sendDataJson.value = JSON.stringify(mock, null, 2);
  } catch {
    sendDataJson.value = '{}';
  }

  testSendModalVisible.value = true;
}

async function handleConfirmSend() {
  if (!sendSessionUnitId.value.trim()) {
    message.warning('请输入目标 SessionUnitId');
    return;
  }
  let payloadData: Record<string, any> = {};
  try {
    payloadData = JSON.parse(sendDataJson.value);
  } catch (err: any) {
    message.error(`数据 JSON 语法错误: ${err?.message}`);
    return;
  }

  sending.value = true;
  try {
    const clientMessageId = `cmsg_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    await sendTemplateContentMessageApi(sendSessionUnitId.value.trim(), {
      clientMessageId,
      templateId: sendTemplateId.value,
      templateVersion: sendTemplateVersion.value,
      data: payloadData,
      ignoreVersion: false,
    });
    message.success('测试模板消息发送成功');
    testSendModalVisible.value = false;
  } catch (err: any) {
    message.error(err?.message || '发送失败');
  } finally {
    sending.value = false;
  }
}

onMounted(() => {
  loadData();
});
</script>

<template>
  <Page title="自定义模板消息管理">
    <Card :bordered="false" class="mb-4">
      <Space wrap>
        <Input
          v-model:value="queryParams.keyword"
          placeholder="搜索模板名称/分类"
          allow-clear
          style="width: 200px"
          @press-enter="handleSearch"
        />
        <Select
          v-model:value="queryParams.status"
          placeholder="模板状态"
          allow-clear
          style="width: 130px"
        >
          <SelectOption :value="0">草稿 (Draft)</SelectOption>
          <SelectOption :value="1">已发布 (Published)</SelectOption>
          <SelectOption :value="2">已停用 (Disabled)</SelectOption>
          <SelectOption :value="3">已废弃 (Deprecated)</SelectOption>
        </Select>
        <Select
          v-model:value="queryParams.visibility"
          placeholder="可见范围"
          allow-clear
          style="width: 130px"
        >
          <SelectOption :value="0">私有 (Private)</SelectOption>
          <SelectOption :value="1">共享 (Shared)</SelectOption>
          <SelectOption :value="2">系统 (System)</SelectOption>
        </Select>
        <Button type="primary" @click="handleSearch">查询</Button>
        <Button @click="handleReset">重置</Button>
        <Button type="primary" style="background-color: #52c41a" @click="handleOpenCreate">
          + 新建模板
        </Button>
      </Space>
    </Card>

    <Card :bordered="false">
      <Table
        :columns="columns"
        :data-source="templateList"
        :loading="loading"
        :pagination="{
          total,
          current: Math.floor(queryParams.skipCount! / queryParams.maxResultCount!) + 1,
          pageSize: queryParams.maxResultCount,
          showSizeChanger: true,
        }"
        row-key="id"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <!-- 状态 -->
          <template v-if="column.key === 'status'">
            <Tag v-if="record.status === 0" color="default">草稿</Tag>
            <Tag v-else-if="record.status === 1" color="success">已发布</Tag>
            <Tag v-else-if="record.status === 2" color="error">已停用</Tag>
            <Tag v-else-if="record.status === 3" color="warning">已废弃</Tag>
          </template>

          <!-- 可见范围 -->
          <template v-else-if="column.key === 'visibility'">
            <Tag v-if="record.visibility === 0" color="default">私有</Tag>
            <Tag v-else-if="record.visibility === 1" color="blue">共享</Tag>
            <Tag v-else-if="record.visibility === 2" color="purple">系统</Tag>
          </template>

          <!-- 操作栏 -->
          <template v-else-if="column.key === 'action'">
            <Space size="small">
              <Button type="link" size="small" @click="handleOpenEdit(record)">编辑</Button>
              <Button type="link" size="small" @click="handleOpenPublish(record)">发布</Button>
              <Button
                type="link"
                size="small"
                :style="{ color: record.status === 2 ? '#52c41a' : '#faad14' }"
                @click="handleToggleStatus(record)"
              >
                {{ record.status === 2 ? '启用' : '停用' }}
              </Button>
              <Button
                v-if="record.latestPublishedVersion > 0"
                type="link"
                size="small"
                @click="handleOpenTestSend(record)"
              >
                测试发送
              </Button>
              <Button type="link" size="small" @click="handleViewHistory(record)">版本</Button>
              <Popconfirm title="确定删除该模板吗？" @confirm="handleDelete(record)">
                <Button type="link" danger size="small">删除</Button>
              </Popconfirm>
            </Space>
          </template>
        </template>
      </Table>
    </Card>

    <!-- 编辑/创建抽屉 -->
    <Drawer
      v-model:open="drawerVisible"
      :title="isEditing ? '编辑模板草稿' : '新建模板'"
      width="780"
      placement="right"
    >
      <Form layout="vertical">
        <Row :gutter="16">
          <Col :span="12">
            <FormItem label="模板名称" required>
              <Input v-model:value="formData.name" placeholder="例如：报修工单通知" />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="业务分类">
              <Input v-model:value="formData.category" placeholder="例如：运维告警" />
            </FormItem>
          </Col>
          <Col :span="6">
            <FormItem label="可见范围">
              <Select v-model:value="formData.visibility">
                <SelectOption :value="0">私有 (Private)</SelectOption>
                <SelectOption :value="1">共享 (Shared)</SelectOption>
                <SelectOption :value="2">系统 (System)</SelectOption>
              </Select>
            </FormItem>
          </Col>
        </Row>

        <FormItem label="模板描述">
          <Input v-model:value="formData.description" placeholder="描述该模板的用途" />
        </FormItem>

        <Row :gutter="16">
          <!-- 左侧：草稿 JSON 编辑器 -->
          <Col :span="14">
            <div class="flex items-center justify-between mb-2">
              <span class="font-medium">草稿定义 JSON (fields, layout, actions)</span>
              <Space size="small">
                <Button size="small" @click="formData.draftJson = sampleMinimalCard">最小卡片</Button>
                <Button size="small" @click="formData.draftJson = sampleFullCard">完整工单</Button>
                <Button size="small" type="dashed" @click="handleFormatJson">格式化</Button>
              </Space>
            </div>
            <Input.TextArea
              v-model:value="formData.draftJson"
              :rows="18"
              style="font-family: monospace; font-size: 12px"
              placeholder="请输入包含 fields, layout, actions 的 JSON 定义"
            />
          </Col>

          <!-- 右侧：实时渲染卡片预览 -->
          <Col :span="10">
            <div class="mb-2 font-medium">受控卡片实时预览 (Live Preview)</div>
            <div class="p-3 bg-gray-50 rounded border border-gray-200 min-h-[300px] flex items-center justify-center">
              <TemplatePreview
                :layout="previewLayout"
                :data="mockData"
                :actions="previewActions"
                :template-name="formData.name || '模板预览'"
              />
            </div>
          </Col>
        </Row>
      </Form>

      <template #footer>
        <Space class="float-right">
          <Button @click="drawerVisible = false">取消</Button>
          <Button type="primary" :loading="saving" @click="handleSave">保存草稿</Button>
        </Space>
      </template>
    </Drawer>

    <!-- 发布新版本弹窗 -->
    <Modal
      v-model:open="publishModalVisible"
      title="发布模板版本"
      :confirm-loading="publishing"
      @ok="handleConfirmPublish"
    >
      <Form layout="vertical">
        <FormItem label="版本说明 / 变更日志">
          <Input v-model:value="publishDesc" placeholder="简要说明本次版本的改动内容" />
        </FormItem>
        <p class="text-xs text-gray-500">
          发布后将对草稿定义进行不可篡改归档（生成只读快照和 SHA-256 签名），版本号自动自增。
        </p>
      </Form>
    </Modal>

    <!-- 历史版本弹窗 -->
    <Modal
      v-model:open="historyModalVisible"
      :title="`[${historyTemplateName}] 历史版本列表`"
      :footer="null"
      width="680"
    >
      <Table
        :data-source="historyRevisions"
        :columns="[
          { title: '版本号', dataIndex: 'version', key: 'version', width: 90 },
          { title: '版本摘要/说明', dataIndex: 'description', key: 'description' },
          { title: '哈希摘要 (SHA-256)', dataIndex: 'definitionHash', key: 'definitionHash', width: 140 },
          { title: '发布时间', dataIndex: 'creationTime', key: 'creationTime', width: 170 },
        ]"
        row-key="id"
        :pagination="false"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'version'">
            <Tag color="blue">v{{ record.version }}</Tag>
          </template>
          <template v-else-if="column.key === 'definitionHash'">
            <span class="text-xs font-mono text-gray-500" :title="record.definitionHash">
              {{ record.definitionHash?.slice(0, 12) }}...
            </span>
          </template>
        </template>
      </Table>
    </Modal>

    <!-- 测试发送弹窗 -->
    <Modal
      v-model:open="testSendModalVisible"
      title="发送测试模板消息"
      :confirm-loading="sending"
      @ok="handleConfirmSend"
    >
      <Form layout="vertical">
        <FormItem label="目标会话单元 ID (SessionUnitId)" required>
          <Input v-model:value="sendSessionUnitId" placeholder="输入要发送到的 SessionUnitId (Guid)" />
        </FormItem>
        <FormItem label="填入数据 JSON (Data Payload)" required>
          <Input.TextArea
            v-model:value="sendDataJson"
            :rows="8"
            style="font-family: monospace; font-size: 12px"
          />
        </FormItem>
      </Form>
    </Modal>
  </Page>
</template>
