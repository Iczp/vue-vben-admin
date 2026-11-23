<script setup lang="ts">
import type { TemplateField } from './template-draft';

import type { ArticleSenderSession } from '#/api/chat/article-message';
import type { ChatObjectDto } from '#/api/chat/chat-object';
import type {
  MessageTemplateDefinitionDto,
  MessageTemplateDetailDto,
  MessageTemplateRevisionDto,
} from '#/api/chat/message-template';

import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Drawer,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
} from 'antdv-next';

import { getArticleSenderSessionsApi } from '#/api/chat/article-message';
import {
  createMessageTemplateApi,
  getMessageTemplateApi,
  getMessageTemplateListApi,
  getMessageTemplateRevisionApi,
  getMessageTemplateRevisionsApi,
  getTemplateSenderAccountsApi,
  previewMessageTemplateApi,
  publishMessageTemplateApi,
  sendTemplateContentMessageApi,
  setMessageTemplateEnabledApi,
  templatePermission,
  updateMessageTemplateApi,
} from '#/api/chat/message-template';
import { getRequestErrorMessage } from '#/utils/request-error';

import {
  exampleData,
  fieldsFromDefinition,
  newDefinition,
  parseDataObject,
  TemplateSendAttempt,
  validateFieldData,
} from './template-draft';
import TemplatePreview from './template-preview.vue';

const { hasAccessByCodes } = useAccess();
const can = (action: string) =>
  hasAccessByCodes([`${templatePermission}.${action}`]);
const busy = ref(false);
const error = ref('');
const notice = ref('');
const items = ref<MessageTemplateDefinitionDto[]>([]);
const total = ref(0);
const page = ref(1);
const keyword = ref('');
const scope = ref<'owned' | 'usable'>('owned');
const accounts = ref<ChatObjectDto[]>([]);
const accountTotal = ref(0);
const accountKeyword = ref('');
const accountOptions = computed(() =>
  accounts.value.map((a) => ({
    label: `${a.displayName || a.name} (${a.id})`,
    value: String(a.id),
  })),
);
async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  notice.value = '';
  try {
    await action();
  } catch (err) {
    error.value = getRequestErrorMessage(err).message;
  } finally {
    busy.value = false;
  }
}
async function loadList() {
  const result = await getMessageTemplateListApi({
    keyword: keyword.value,
    scope: scope.value,
    skipCount: (page.value - 1) * 10,
    maxResultCount: 10,
  });
  items.value = result.items;
  total.value = result.totalCount;
}
async function loadAccounts(append = false) {
  const result = await getTemplateSenderAccountsApi({
    isEnabled: true,
    keyword: accountKeyword.value,
    maxResultCount: 50,
    skipCount: append ? accounts.value.length : 0,
  });
  accounts.value = append ? [...accounts.value, ...result.items] : result.items;
  accountTotal.value = result.totalCount;
}
const columns = [
  { title: '模板名称', dataIndex: 'name' },
  { title: '所属账号', dataIndex: 'ownerId' },
  { title: '状态', key: 'status' },
  { title: '可见范围', key: 'visibility' },
  { title: '发布版本', dataIndex: 'publishedVersion' },
  { title: '操作', key: 'action' },
];
const editorOpen = ref(false);
const current = ref<MessageTemplateDetailDto>();
const form = reactive({
  ownerId: '',
  name: '',
  description: '',
  visibility: 0 as 0 | 1,
  definition: newDefinition(),
});
const sampleData = ref('{}');
const fields = computed(() => fieldsFromDefinition(form.definition));
const previewSnapshot = computed(() => {
  try {
    return {
      ...JSON.parse(form.definition),
      data: parseDataObject(sampleData.value),
      templateId: current.value?.id || '00000000-0000-0000-0000-000000000000',
      templateVersion: 1,
      templateName: form.name,
      fallbackText: '[模板预览]',
    };
  } catch {
    return null;
  }
});
function openCreate() {
  current.value = undefined;
  Object.assign(form, {
    ownerId: '',
    name: '',
    description: '',
    visibility: 0,
    definition: newDefinition(),
  });
  sampleData.value = '{"title":"示例通知"}';
  editorOpen.value = true;
}
function openEdit(record: MessageTemplateDefinitionDto) {
  void run(async () => {
    const detail = await getMessageTemplateApi(record.id);
    current.value = detail;
    Object.assign(form, {
      ownerId: String(detail.ownerId),
      name: detail.name,
      description: detail.description || '',
      visibility: detail.visibility,
      definition: detail.draftJson,
    });
    sampleData.value = '{}';
    editorOpen.value = true;
  });
}
function save() {
  void run(async () => {
    if (!form.ownerId || !form.name.trim())
      throw new Error('请选择所属账号并填写模板名称。');
    const definition = JSON.stringify({
      ...JSON.parse(form.definition),
      name: form.name.trim(),
    });
    const input = {
      name: form.name.trim(),
      description: form.description,
      visibility: form.visibility,
      definition,
    };
    const detail = current.value
      ? await updateMessageTemplateApi(current.value.id, {
          ...input,
          concurrencyStamp: current.value.concurrencyStamp,
        })
      : await createMessageTemplateApi({ ...input, ownerId: form.ownerId });
    current.value = detail;
    form.definition = detail.draftJson;
    notice.value = '草稿已保存；并发冲突时保留本地内容，请对比后重新打开。';
    await loadList();
  });
}
function validatePreview() {
  void run(async () => {
    if (!current.value) throw new Error('请先保存草稿再正式校验。');
    const result = await previewMessageTemplateApi({
      templateId: current.value.id,
      definition: form.definition,
      data: parseDataObject(sampleData.value),
    });
    if (!result.isValid) throw new Error(result.errorMessage || '模板校验失败');
    notice.value = '服务端正式校验通过。';
  });
}
function publish(record: MessageTemplateDefinitionDto) {
  void run(async () => {
    const detail = await getMessageTemplateApi(record.id);
    const validation = await previewMessageTemplateApi({
      templateId: record.id,
      definition: detail.draftJson,
      data: exampleData(fieldsFromDefinition(detail.draftJson)),
    });
    if (!validation.isValid)
      throw new Error(
        validation.errorMessage ||
          '发布前正式校验失败，请在编辑器检查示例数据。',
      );
    await publishMessageTemplateApi(record.id, {
      concurrencyStamp: record.concurrencyStamp,
    });
    await loadList();
    notice.value = '模板已发布。';
  });
}
function toggle(record: MessageTemplateDefinitionDto) {
  void run(async () => {
    await setMessageTemplateEnabledApi(record.id, {
      concurrencyStamp: record.concurrencyStamp,
      isEnabled: !record.isEnabled,
    });
    await loadList();
  });
}
const componentType = ref('text');
const binding = ref('');
const fieldName = ref('');
const fieldType = ref<TemplateField['type']>('string');
const fieldRequired = ref('true');
const fieldFormat = ref('text');
function addField() {
  try {
    if (
      !/^[A-Za-z_]\w{0,63}$/.test(fieldName.value) ||
      ['__proto__', 'constructor', 'prototype'].includes(fieldName.value)
    )
      throw new Error('字段名须为1至64位安全标识符。');
    const definition = JSON.parse(form.definition);
    definition.fields ||= [];
    if (
      definition.fields.length >= 30 ||
      definition.fields.some((f: TemplateField) => f.name === fieldName.value)
    )
      throw new Error('字段名重复或已达30个字段。');
    definition.fields.push({
      name: fieldName.value,
      type: fieldType.value,
      required: fieldRequired.value === 'true',
      ...(fieldType.value === 'string'
        ? {
            maxLength: fieldFormat.value === 'url' ? 500 : 2000,
            format: fieldFormat.value,
          }
        : {}),
    });
    form.definition = JSON.stringify(definition, null, 2);
  } catch (err) {
    error.value = getRequestErrorMessage(err).message;
  }
}
function changeNode(index: number, attribute: string, value: string) {
  try {
    const definition = JSON.parse(form.definition);
    definition.layout.children[index][attribute] = value;
    form.definition = JSON.stringify(definition, null, 2);
  } catch {
    error.value = '请先修正草稿JSON。';
  }
}
function editLayout(action: 'add' | 'down' | 'remove' | 'up', index = 0) {
  try {
    const definition = JSON.parse(form.definition);
    const children: Record<string, unknown>[] =
      definition.layout.children || [];
    if (action === 'add') {
      const type = componentType.value;
      children.push(
        type === 'divider'
          ? { type }
          : ['column', 'row'].includes(type)
            ? { type, children: [] }
            : type === 'button'
              ? { type, label: '操作', actionId: binding.value }
              : {
                  type,
                  bind: binding.value,
                  ...(type === 'field' ? { label: '字段' } : {}),
                },
      );
    } else if (action === 'remove') children.splice(index, 1);
    else {
      const target = index + (action === 'up' ? -1 : 1);
      if (target >= 0 && target < children.length)
        [children[index], children[target]] = [
          children[target]!,
          children[index]!,
        ];
    }
    definition.layout.children = children;
    form.definition = JSON.stringify(definition, null, 2);
  } catch {
    error.value = '请先修正草稿JSON。';
  }
}
const rootNodes = computed(() => {
  try {
    return JSON.parse(form.definition).layout.children as Record<
      string,
      unknown
    >[];
  } catch {
    return [];
  }
});
const historyOpen = ref(false);
const historyTemplate = ref('');
const history = ref<MessageTemplateRevisionDto[]>([]);
const historyTotal = ref(0);
const revisionJson = ref('');
function viewHistory(record: MessageTemplateDefinitionDto) {
  void run(async () => {
    historyTemplate.value = record.id;
    const result = await getMessageTemplateRevisionsApi(record.id);
    history.value = result.items;
    historyTotal.value = result.totalCount;
    revisionJson.value = '';
    historyOpen.value = true;
  });
}
function moreHistory() {
  void run(async () => {
    const result = await getMessageTemplateRevisionsApi(
      historyTemplate.value,
      history.value.length,
    );
    history.value.push(...result.items);
    historyTotal.value = result.totalCount;
  });
}
function readRevision(version: number) {
  void run(async () => {
    revisionJson.value = (
      await getMessageTemplateRevisionApi(historyTemplate.value, version)
    ).definitionJson;
  });
}
const sendOpen = ref(false);
const sendTemplate = ref<MessageTemplateDefinitionDto>();
const sendOwner = ref('');
const sendSession = ref('');
const sessions = ref<ArticleSenderSession[]>([]);
const sessionsTotal = ref(0);
const sessionKeyword = ref('');
const sendDefinition = ref('');
const sendData = reactive<Record<string, unknown>>({});
const sendFields = computed(() => fieldsFromDefinition(sendDefinition.value));
const attempt = new TemplateSendAttempt();
const sessionOptions = computed(() =>
  sessions.value.map((s) => ({
    value: s.id,
    label: `${s.destination?.displayName || s.destination?.name || s.sessionId} (${s.id})`,
  })),
);
async function loadSessions(append = false) {
  if (!sendOwner.value) return;
  const result = await getArticleSenderSessionsApi(
    sendOwner.value,
    append ? sessions.value.length : 0,
    sessionKeyword.value,
  );
  sessions.value = append ? [...sessions.value, ...result.items] : result.items;
  sessionsTotal.value = result.totalCount;
}
watch(sendOwner, () => {
  sendSession.value = '';
  sessions.value = [];
  if (!busy.value) void run(() => loadSessions());
});
function openSend(record: MessageTemplateDefinitionDto) {
  void run(async () => {
    if (!record.publishedVersion) throw new Error('请先发布模板。');
    sendDefinition.value = (
      await getMessageTemplateRevisionApi(record.id, record.publishedVersion)
    ).definitionJson;
    sendTemplate.value = record;
    for (const key of Object.keys(sendData)) delete sendData[key];
    sendOwner.value = String(record.ownerId);
    sendSession.value = '';
    await loadSessions();
    sendOpen.value = true;
    attempt.reset();
  });
}
function setField(field: TemplateField, value: string) {
  if (value === '' && !field.required) delete sendData[field.name];
  else
    sendData[field.name] =
      field.type === 'number' || field.type === 'integer'
        ? Number(value)
        : value;
}
function send() {
  void run(async () => {
    const record = sendTemplate.value;
    if (!record?.publishedVersion || !sendSession.value)
      throw new Error('请选择实际发送账号与会话。');
    const selected = sessions.value.find((s) => s.id === sendSession.value);
    if (!selected || String(selected.ownerId) !== sendOwner.value)
      throw new Error('发送会话与账号不一致，请重新选择。');
    validateFieldData(sendFields.value, sendData);
    await sendTemplateContentMessageApi(
      sendSession.value,
      attempt.prepare(
        sendSession.value,
        record.id,
        record.publishedVersion,
        sendData,
      ),
    );
    sendOpen.value = false;
    attempt.reset();
    notice.value = '模板消息已发送。';
  });
}
onMounted(() => {
  void run(async () => {
    await loadList();
    await loadAccounts();
  });
});
</script>

<template>
  <Page title="自定义模板消息">
    <Alert v-if="error" :message="error" type="error" class="mb-3" />
    <Alert v-if="notice" :message="notice" type="success" class="mb-3" />
    <Card>
      <Space wrap>
        <Input
          v-model:value="keyword"
          placeholder="搜索名称或说明"
          @press-enter="
            page = 1;
            run(loadList);
          "
        /><Select
          v-model:value="scope"
          :options="[
            { label: '管理范围', value: 'owned' },
            { label: '可使用', value: 'usable' },
          ]"
        /><Button
          :loading="busy"
          @click="
            page = 1;
            run(loadList);
          "
        >
          查询
</Button><Button v-if="can('Create')" @click="openCreate"> 新建模板 </Button>
      </Space>
      <Table
        :columns="columns"
        :data-source="items"
        :loading="busy"
        :pagination="false"
        row-key="id"
      >
        <template #bodyCell="{ column, record }">
          <Tag v-if="column.key === 'status'">
            {{
              !record.isEnabled
                ? '已停用'
                : record.publishedVersion
                  ? '已发布'
                  : '草稿'
            }}
          </Tag>
          <span v-else-if="column.key === 'visibility'">{{
            record.visibility === 1 ? '租户共享' : '私有'
          }}</span>
          <Space v-else-if="column.key === 'action'" wrap>
            <Button
              v-if="can('Update')"
              :disabled="busy"
              @click="openEdit(record)"
            >
              编辑
</Button><Button
              v-if="can('Publish')"
              :disabled="busy"
              @click="publish(record)"
            >
              发布
</Button><Button
              v-if="can('Update')"
              :disabled="busy"
              @click="toggle(record)"
            >
              {{ record.isEnabled ? '停用' : '启用' }}
</Button><Button
              v-if="can('Use') && record.isEnabled && record.publishedVersion"
              :disabled="busy"
              @click="openSend(record)"
            >
              填写并发送
</Button><Button :disabled="busy" @click="viewHistory(record)">版本</Button>
          </Space>
        </template>
      </Table>
      <Space>
        <Button
          :disabled="busy || page <= 1"
          @click="
            page--;
            run(loadList);
          "
        >
          上一页
</Button><span>第 {{ page }} 页，共 {{ total }} 项</span><Button
          :disabled="busy || page * 10 >= total"
          @click="
            page++;
            run(loadList);
          "
        >
          下一页
        </Button>
      </Space>
    </Card>
    <Drawer
      v-model:open="editorOpen"
      title="模板草稿"
      width="min(960px, 100vw)"
    >
      <Alert v-if="error" :message="error" type="error" /><Alert
        v-if="notice"
        :message="notice"
        type="success"
      />
      <Space wrap class="mb-3">
        <Input v-model:value="accountKeyword" placeholder="搜索账号" /><Button
          @click="run(() => loadAccounts())"
        >
          查询账号
</Button><Select
          v-model:value="form.ownerId"
          :disabled="!!current"
          :options="accountOptions"
          placeholder="所属账号"
          style="min-width: 240px"
        /><Button
          v-if="accounts.length < accountTotal"
          @click="run(() => loadAccounts(true))"
        >
          更多账号
        </Button>
      </Space>
      <label class="block">模板名称<Input v-model:value="form.name" :maxlength="80" /></label><label class="block">说明<Input v-model:value="form.description" :maxlength="256" /></label>
      <Select
        v-model:value="form.visibility"
        :options="[
          { label: '私有', value: 0 },
          ...(can('Share') ? [{ label: '租户共享', value: 1 }] : []),
        ]"
      />
      <p class="my-3">
        添加组件后可排序；字段、属性、动作及嵌套布局在下方定义中编辑。
      </p>
      <Space wrap class="my-3">
        <Input v-model:value="fieldName" placeholder="新字段名" />
        <Select
          v-model:value="fieldType"
          :options="
            ['string', 'integer', 'number', 'boolean'].map((value) => ({
              label: value,
              value,
            }))
          "
        />
        <Select
          v-model:value="fieldRequired"
          :options="[
            { label: '必填', value: 'true' },
            { label: '可选', value: 'false' },
          ]"
        />
        <Select
          v-if="fieldType === 'string'"
          v-model:value="fieldFormat"
          :options="[
            { label: '文本', value: 'text' },
            { label: 'HTTP链接', value: 'url' },
          ]"
        />
        <Button @click="addField">添加字段</Button>
      </Space>
      <Space wrap>
        <Select
          v-model:value="componentType"
          :options="
            [
              'text',
              'field',
              'badge',
              'image',
              'divider',
              'row',
              'column',
              'button',
            ].map((value) => ({ label: value, value }))
          "
        /><Input
          v-model:value="binding"
          placeholder="绑定字段名或动作ID"
        /><Button @click="editLayout('add')">添加组件</Button>
      </Space>
      <div v-for="(node, index) in rootNodes" :key="index" class="my-2">
        <Space>
          <span>{{ node.type }}</span><Button @click="editLayout('up', index)">上移</Button><Button @click="editLayout('down', index)">下移</Button><Button @click="editLayout('remove', index)">移除</Button>
        </Space>
        <Space
          v-if="!['divider', 'row', 'column'].includes(String(node.type))"
          wrap
        >
          <Input
            v-if="node.type !== 'button'"
            :value="String(node.bind ?? '')"
            placeholder="绑定字段"
            @update:value="(value) => changeNode(index, 'bind', value)"
          />
          <Input
            v-if="node.type === 'field' || node.type === 'button'"
            :value="String(node.label ?? '')"
            placeholder="标签"
            @update:value="(value) => changeNode(index, 'label', value)"
          />
          <Input
            v-if="node.type === 'button'"
            :value="String(node.actionId ?? '')"
            placeholder="动作ID"
            @update:value="(value) => changeNode(index, 'actionId', value)"
          />
          <Select
            v-if="node.type === 'text'"
            :value="String(node.style ?? 'body')"
            :options="
              ['heading', 'body', 'secondary'].map((value) => ({
                label: value,
                value,
              }))
            "
            @change="(value) => changeNode(index, 'style', String(value))"
          />
          <Select
            v-if="node.type === 'badge'"
            :value="String(node.tone ?? 'neutral')"
            :options="
              ['neutral', 'success', 'warning', 'danger'].map((value) => ({
                label: value,
                value,
              }))
            "
            @change="(value) => changeNode(index, 'tone', String(value))"
          />
        </Space>
      </div>
      <label class="block">模板定义<Input.TextArea v-model:value="form.definition" :rows="16" /></label>
      <p>
        字段：{{
          fields.map((f) => `${f.name} (${f.type})`).join('，') ||
          '暂无合法字段'
        }}
      </p>
      <label class="block">示例数据<Input.TextArea v-model:value="sampleData" :rows="4" /></label><TemplatePreview :snapshot="previewSnapshot" />
      <Space class="mt-3">
        <Button :loading="busy" @click="save">保存草稿</Button><Button :disabled="!current || busy" @click="validatePreview">
          服务端正式校验
        </Button>
      </Space>
    </Drawer>
    <Modal v-model:open="historyOpen" title="已发布版本" :footer="null">
      <Alert v-if="error" :message="error" type="error" />
      <div v-for="revision in history" :key="revision.id">
        <Button @click="readRevision(revision.version)">
          版本 {{ revision.version }}
</Button><span>{{ revision.creationTime }}</span>
      </div>
      <Button
        v-if="history.length < historyTotal"
        :disabled="busy"
        @click="moreHistory"
      >
        更多版本
      </Button>
      <pre class="max-h-96 overflow-auto whitespace-pre-wrap">{{
        revisionJson
      }}</pre>
    </Modal>
    <Modal
      v-model:open="sendOpen"
      title="发送模板消息"
      :confirm-loading="busy"
      @ok="send"
    >
      <Alert v-if="error" :message="error" type="error" />
      <p>
        {{ sendTemplate?.name }} · 固定版本 {{ sendTemplate?.publishedVersion }}
      </p>
      <label>发送账号<Select
          v-model:value="sendOwner"
          :options="accountOptions"
          style="width: 100%"
/></label><Space>
        <Input v-model:value="sessionKeyword" placeholder="搜索会话" /><Button
          @click="run(() => loadSessions())"
        >
          查询
        </Button>
</Space><Select
        v-model:value="sendSession"
        :options="sessionOptions"
        placeholder="请选择实际发送会话"
        style="width: 100%"
      /><Button
        v-if="sessions.length < sessionsTotal"
        @click="run(() => loadSessions(true))"
      >
        更多会话
      </Button>
      <label v-for="field in sendFields" :key="field.name" class="my-2 block">{{ field.name }}{{ field.required ? ' *' : '' }}
        <Select
          v-if="field.enum"
          :value="sendData[field.name]"
          :options="field.enum.map((value) => ({ label: value, value }))"
          style="width: 100%"
          @change="(value) => (sendData[field.name] = value)"
        />
        <Select
          v-else-if="field.type === 'boolean'"
          :value="
            sendData[field.name] === undefined
              ? undefined
              : String(sendData[field.name])
          "
          :options="[
            { label: '是', value: 'true' },
            { label: '否', value: 'false' },
          ]"
          style="width: 100%"
          @change="(value) => (sendData[field.name] = value === 'true')"
        />
        <Input
          v-else
          :value="String(sendData[field.name] ?? '')"
          :maxlength="field.maxLength || 2000"
          @update:value="(value) => setField(field, value)"
        />
      </label>
      <p class="text-muted-foreground">
        提交失败后再次发送将复用原标识；修改数据、账号或会话后视为新消息。
      </p>
    </Modal>
  </Page>
</template>
