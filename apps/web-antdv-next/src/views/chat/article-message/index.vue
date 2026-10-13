<script setup lang="ts">
import type {
  ArticleChatMessage,
  ArticleMessageItem,
  ArticleSchedule,
  ArticleSenderSession,
} from '#/api/chat/article-message';
import type { ChatObjectDto } from '#/api/chat/chat-object';
import type { AdminArticleListItemDto } from '#/api/cms/types';

import { computed, onMounted, ref, watch } from 'vue';

import { useAccess } from '@vben/access';
import { Page } from '@vben/common-ui';

import {
  Alert,
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Tabs,
  Tag,
} from 'antdv-next';

import {
  articleManagementPermission,
  changeArticleScheduleApi,
  createArticleScheduleApi,
  getArticleChatHistoryApi,
  getArticleSchedulesApi,
  getArticleSenderSessionsApi,
  rollbackArticleMessageApi,
  sendArticleMessageApi,
} from '#/api/chat/article-message';
import { ChatObjectTypeEnums, getChatObjectsApi } from '#/api/chat/chat-object';
import { getArticlesApi, getArticleWebUrl } from '#/api/cms/articles';
import { ArticleStatus } from '#/api/cms/types';

import {
  articleItems,
  emptyArticle,
  validateArticles,
  webUrl,
} from './article-draft';
import ArticlePreview from './article-preview.vue';

const { hasAccessByCodes } = useAccess();
const canManage = computed(() =>
  hasAccessByCodes([articleManagementPermission]),
);
const busy = ref(false);
const error = ref('');
const tab = ref('editor');
const accountType = ref(ChatObjectTypeEnums.Subscription);
const accounts = ref<ChatObjectDto[]>([]);
const accountId = ref<string>();
const accountKeyword = ref('');
const accountsTotal = ref(0);
const sessions = ref<ArticleSenderSession[]>([]);
const sessionId = ref<string>();
const sessionsTotal = ref(0);
const sessionKeyword = ref('');
const items = ref<ArticleMessageItem[]>([emptyArticle()]);
const selectedIndex = ref(0);
const selected = computed(() => items.value[selectedIndex.value]);
const history = ref<ArticleChatMessage[]>([]);
const historyCursor = ref<number | string>();
const historyMore = ref(false);
const schedules = ref<ArticleSchedule[]>([]);
const schedulePage = ref(1);
const schedulesTotal = ref(0);
const scheduleAt = ref('');
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
const cmsOpen = ref(false);
const cmsKeyword = ref('');
const cmsRows = ref<AdminArticleListItemDto[]>([]);
const cmsPage = ref(1);
const cmsTotal = ref(0);
const previewItems = ref<ArticleMessageItem[]>([]);
const previewOpen = ref(false);
const changeTask = ref<ArticleSchedule>();
const changeAt = ref('');
let generation = 0;
let submitKey = '';
let submitId = '';

async function run(action: () => Promise<void>) {
  if (busy.value) return;
  busy.value = true;
  error.value = '';
  try {
    await action();
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : '操作失败，请检查服务端返回信息。';
  } finally {
    busy.value = false;
  }
}
function dateText(value?: string) {
  return value ? new Date(value).toLocaleString() : '—';
}
function localDate(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
function futureTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now())
    throw new Error('请选择晚于当前时间的发送时间。');
  return date.toISOString();
}
function addArticle(item = emptyArticle()) {
  if (items.value.length >= 8) {
    message.warning('每组最多 8 篇文章。');
    return;
  }
  items.value.push(item);
  selectedIndex.value = items.value.length - 1;
}
function removeArticle(index: number) {
  items.value.splice(index, 1);
  selectedIndex.value = Math.max(
    0,
    Math.min(selectedIndex.value, items.value.length - 1),
  );
}
function moveArticle(index: number, direction: number) {
  const destination = index + direction;
  if (destination < 0 || destination >= items.value.length) return;
  const [item] = items.value.splice(index, 1);
  if (item) items.value.splice(destination, 0, item);
  selectedIndex.value = destination;
}
function copyDraft(content: unknown) {
  items.value = articleItems(content).map((item) => ({ ...item }));
  selectedIndex.value = 0;
  tab.value = 'editor';
  submitKey = '';
  submitId = '';
}
function showPreview(content: unknown) {
  previewItems.value = articleItems(content);
  previewOpen.value = true;
}

async function loadAccounts(more = false) {
  const type = accountType.value;
  const keyword = accountKeyword.value;
  const result = await getChatObjectsApi({
    objectType: type,
    isEnabled: true,
    keyword,
    maxResultCount: 50,
    skipCount: more ? accounts.value.length : 0,
  });
  if (type !== accountType.value || keyword !== accountKeyword.value) return;
  accounts.value = more ? [...accounts.value, ...result.items] : result.items;
  accountsTotal.value = result.totalCount;
}
async function loadSessions(more = false) {
  if (!accountId.value) return;
  const version = generation;
  const result = await getArticleSenderSessionsApi(
    accountId.value,
    more ? sessions.value.length : 0,
    sessionKeyword.value,
  );
  if (version !== generation) return;
  sessions.value = more ? [...sessions.value, ...result.items] : result.items;
  sessionsTotal.value = result.totalCount;
  if (
    !sessionId.value &&
    accountType.value === ChatObjectTypeEnums.Subscription
  ) {
    sessionId.value = sessions.value.find(
      (unit) => String(unit.destination?.id) === accountId.value,
    )?.id;
  }
}
async function loadHistory(more = false) {
  if (!sessionId.value) return;
  const version = generation;
  const result = await getArticleChatHistoryApi(
    sessionId.value,
    more ? historyCursor.value : undefined,
  );
  if (version !== generation) return;
  history.value = more
    ? [
        ...history.value,
        ...result.items.filter(
          (row) =>
            !history.value.some((old) => String(old.id) === String(row.id)),
        ),
      ]
    : result.items;
  historyCursor.value = result.extra?.nextCursorId;
  historyMore.value =
    result.extra?.hasMore === true && historyCursor.value !== undefined;
}
async function loadSchedules() {
  if (!sessionId.value) return;
  const version = generation;
  const result = await getArticleSchedulesApi(
    sessionId.value,
    (schedulePage.value - 1) * 20,
  );
  if (version !== generation) return;
  schedules.value = result.items;
  schedulesTotal.value = result.totalCount;
}
async function submit(scheduled: boolean) {
  if (!canManage.value || !sessionId.value)
    throw new Error('请选择发送主体及会话，并确认拥有文章管理权限。');
  const validation = validateArticles(items.value);
  if (validation) throw new Error(validation);
  const plannedTime = scheduled ? futureTime(scheduleAt.value) : '';
  const content = {
    items: items.value.map((item) => ({ ...item, title: item.title.trim() })),
  };
  const signature = JSON.stringify({
    sessionId: sessionId.value,
    content,
    plannedTime,
  });
  if (signature !== submitKey) {
    submitKey = signature;
    submitId = crypto.randomUUID();
  }
  const input = { clientMessageId: `article:${submitId}`, content };
  if (scheduled) {
    await createArticleScheduleApi({
      id: submitId,
      senderSessionUnitId: sessionId.value,
      scheduledAt: plannedTime,
      message: input,
    });
    tab.value = 'schedules';
    schedulePage.value = 1;
    await loadSchedules();
    message.success('定时任务已创建。');
  } else {
    const sent = await sendArticleMessageApi(sessionId.value, input);
    tab.value = 'history';
    await loadHistory();
    message.success(`发送成功，消息 ${sent.id}`);
  }
  submitKey = '';
  submitId = '';
}
function recall(row: ArticleChatMessage) {
  Modal.confirm({
    title: '撤回这条文章消息？',
    content: '撤回时限及权限由服务端校验。',
    onOk: () =>
      run(async () => {
        await rollbackArticleMessageApi(row.id);
        await loadHistory();
      }),
  });
}
function taskAction(task: ArticleSchedule, action: 'cancel' | 'execute-now') {
  Modal.confirm({
    title: action === 'cancel' ? '取消定时任务？' : '立即执行该任务？',
    onOk: () =>
      run(async () => {
        await changeArticleScheduleApi(task.id, action);
        await loadSchedules();
      }),
  });
}
async function changeTime() {
  if (!changeTask.value) return;
  await changeArticleScheduleApi(
    changeTask.value.id,
    'reschedule',
    futureTime(changeAt.value),
  );
  changeTask.value = undefined;
  await loadSchedules();
}
async function loadCms() {
  const result = await getArticlesApi({
    keyword: cmsKeyword.value,
    status: ArticleStatus.Published,
    isVisible: true,
    maxResultCount: 20,
    skipCount: (cmsPage.value - 1) * 20,
  });
  cmsRows.value = result.items;
  cmsTotal.value = result.totalCount;
}
function selectCms(row: AdminArticleListItemDto) {
  if (row.status !== ArticleStatus.Published || !row.isVisible) return;
  const cover = row.coverUrl
    ? new URL(row.coverUrl, window.location.origin).href
    : '';
  addArticle({
    title: row.title,
    description: row.summary ?? '',
    coverImageUrl: cover,
    author: '',
    originalUrl: new URL(getArticleWebUrl(row), window.location.origin).href,
  });
  cmsOpen.value = false;
}
watch(accountType, () => {
  accountId.value = undefined;
  accounts.value = [];
  void run(() => loadAccounts());
});
watch(accountId, () => {
  generation++;
  sessions.value = [];
  sessionId.value = undefined;
  sessionKeyword.value = '';
  history.value = [];
  schedules.value = [];
  if (accountId.value) void run(() => loadSessions());
});
watch(sessionId, () => {
  generation++;
  history.value = [];
  schedules.value = [];
  historyCursor.value = undefined;
  historyMore.value = false;
  schedulePage.value = 1;
});
watch(tab, (value) => {
  if (value === 'history') void run(() => loadHistory());
  if (value === 'schedules') void run(loadSchedules);
});
onMounted(() => {
  void run(() => loadAccounts());
});
</script>

<template>
  <Page
    title="文章消息"
    description="以公众号或服务号发送文章组，预览展示效果并管理聊天历史和定时任务。"
  >
    <Alert
      v-if="!canManage"
      class="mb-4"
      type="warning"
      show-icon
      message="需要文章管理权限才能代表公众号或服务号发送及管理消息。"
    />
    <Alert
      v-if="error"
      class="mb-4"
      type="error"
      show-icon
      :message="error"
      closable
      @close="error = ''"
    />
    <Card class="mb-4" title="发送主体与会话">
      <div class="flex flex-wrap items-center gap-3">
        <Select
          v-model:value="accountType"
          :disabled="busy"
          style="width: 130px"
          :options="[
            { label: '公众号／订阅号', value: 4 },
            { label: '服务号', value: 3 },
          ]"
        />
        <Input
          v-model:value="accountKeyword"
          :disabled="busy"
          style="width: 180px"
          placeholder="搜索发送主体"
          @press-enter="run(() => loadAccounts())"
        />
        <Button :disabled="busy" @click="run(() => loadAccounts())">
搜索主体
</Button>
        <Select
          v-model:value="accountId"
          :disabled="busy"
          style="width: 260px"
          placeholder="选择已启用的账号"
          :options="
            accounts.map((account) => ({
              label: account.displayName || account.name,
              value: String(account.id),
            }))
          "
        />
        <Button
          v-if="accounts.length < accountsTotal"
          :disabled="busy"
          @click="run(() => loadAccounts(true))"
          >
更多主体
</Button>
        <Select
          v-model:value="sessionId"
          :disabled="busy || !accountId"
          style="width: 310px"
          placeholder="选择实际发送会话"
          :options="
            sessions.map((unit) => ({
              label: `${unit.destination?.displayName || unit.destination?.name || '会话'} · ${unit.id.slice(0, 8)}`,
              value: unit.id,
              disabled: unit.setting?.isInputEnabled === false,
            }))
          "
        />
        <Input
          v-model:value="sessionKeyword"
          :disabled="busy || !accountId"
          style="width: 150px"
          placeholder="搜索目标会话"
          @press-enter="run(() => loadSessions())"
        />
        <Button
          :disabled="busy || !accountId"
          @click="run(() => loadSessions())"
          >
搜索会话
</Button>
        <Button
          v-if="sessions.length < sessionsTotal"
          :disabled="busy"
          @click="run(() => loadSessions(true))"
          >
更多会话
</Button>
      </div>
      <p class="mt-3 text-muted-foreground">
        订阅号使用对应共享会话；服务号按所选目标会话投递。当前页面一次向一个会话发送。
      </p>
    </Card>
    <Tabs v-model:active-key="tab">
      <Tabs.TabPane key="editor" tab="编辑与预览">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <Card title="文章组 · 首篇为头条">
            <fieldset :disabled="busy">
              <div class="mb-4 flex flex-wrap gap-2">
                <Button
                  :disabled="items.length >= 8 || busy"
                  @click="addArticle()"
                  >
添加外部文章
</Button>
                <Button
                  :disabled="items.length >= 8 || busy"
                  @click="
                    cmsOpen = true;
                    cmsPage = 1;
                    run(loadCms);
                  "
                  >
从 CMS 选择
</Button>
              </div>
              <div
                v-for="(item, index) in items"
                :key="index"
                class="mb-2 flex items-center gap-2 rounded border p-2"
              >
                <Button
                  type="link"
                  class="min-w-0 flex-1 text-left"
                  @click="selectedIndex = index"
                  >
{{ index + 1 }} · {{ item.title || '未填写标题' }}
</Button>
                <Button
                  size="small"
                  :disabled="index === 0 || busy"
                  @click="moveArticle(index, -1)"
                  >
上移
</Button>
                <Button
                  size="small"
                  :disabled="index === items.length - 1 || busy"
                  @click="moveArticle(index, 1)"
                  >
下移
</Button>
                <Button
                  size="small"
                  danger
                  :disabled="busy"
                  @click="removeArticle(index)"
                  >
移除
</Button>
              </div>
              <div v-if="selected" class="mt-4 grid gap-3">
                <label>标题<Input
                    v-model:value="selected.title"
                    :maxlength="256"
                    :disabled="busy"
                    placeholder="文章标题"
                /></label>
                <label>阅读地址<Input
                    v-model:value="selected.originalUrl"
                    :maxlength="500"
                    :disabled="busy"
                    placeholder="https://…"
                /></label>
                <label>摘要<Input.TextArea
                    v-model:value="selected.description"
                    :maxlength="256"
                    :disabled="busy"
                    :rows="3"
                /></label>
                <label>封面地址<Input
                    v-model:value="selected.coverImageUrl"
                    :maxlength="500"
                    :disabled="busy"
                    placeholder="公开可访问的 HTTP/HTTPS 图片地址"
                /></label>
                <label>作者<Input
                    v-model:value="selected.author"
                    :maxlength="50"
                    :disabled="busy"
                /></label>
                <a
                  v-if="webUrl(selected.originalUrl)"
                  :href="webUrl(selected.originalUrl)"
                  target="_blank"
                  rel="noopener noreferrer"
                  >打开原文预览</a>
              </div>
              <div class="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  type="primary"
                  :loading="busy"
                  :disabled="!sessionId || !canManage"
                  @click="run(() => submit(false))"
                  >
立即发送
</Button>
                <label>计划时间（{{ timezone }}）<input
                    v-model="scheduleAt"
                    class="rounded border p-2"
                    type="datetime-local"
                    :disabled="busy"
                /></label>
                <Button
                  :disabled="!sessionId || !canManage || busy"
                  @click="run(() => submit(true))"
                  >
定时发送
</Button>
              </div>
            </fieldset>
          </Card>
          <Card title="实时预览">
<ArticlePreview :items="items" />
            <p class="mt-4 text-muted-foreground">
              修改标题、摘要、封面或顺序会立即更新。点击各篇可预览原文。
            </p>
</Card>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane key="history" tab="聊天消息历史">
        <Card>
          <Button
            :loading="busy"
            :disabled="!sessionId"
            @click="run(() => loadHistory())"
            >
刷新历史
</Button>
          <p v-if="!sessionId" class="py-6">请先选择发送主体和会话。</p>
          <p v-else-if="history.length === 0" class="py-6">暂无消息。</p>
          <div
            v-for="row in history"
            :key="row.id"
            class="my-4 flex flex-wrap gap-6 border-b pb-4"
          >
            <ArticlePreview
              v-if="row.messageType === 11 && !row.isRollbacked"
              :items="articleItems(row.content)"
            />
            <p v-else>
              {{
                row.isRollbacked
                  ? '消息已撤回'
                  : `[${row.messageTypeDescription || '消息'}]`
              }}
            </p>
            <div>
              <p>{{ row.senderName }} · {{ dateText(row.creationTime) }}</p>
              <p>消息 {{ row.id }}</p>
              <Tag v-if="row.isRollbacked">已撤回</Tag>
              <div v-if="row.messageType === 11" class="mt-3 flex gap-2">
                <Button size="small" @click="showPreview(row.content)">
查看文章组
</Button>
                <Button
                  size="small"
                  :disabled="busy"
                  @click="copyDraft(row.content)"
                  >
复制为新草稿
</Button>
                <Button
                  v-if="!row.isRollbacked && String(row.senderId) === accountId"
                  size="small"
                  danger
                  :disabled="!canManage || busy"
                  @click="recall(row)"
                  >
撤回
</Button>
              </div>
            </div>
          </div>
          <Button
            v-if="historyMore"
            :loading="busy"
            @click="run(() => loadHistory(true))"
            >
加载更早消息
</Button>
        </Card>
      </Tabs.TabPane>
      <Tabs.TabPane key="schedules" tab="定时任务">
        <Card>
          <Button
            :loading="busy"
            :disabled="!sessionId"
            @click="run(loadSchedules)"
            >
刷新任务
</Button>
          <p class="mt-2 text-muted-foreground">
            定时发送需服务端启用；取消作用于未发送任务，已发送消息请在聊天历史撤回。
          </p>
          <p v-if="schedules.length === 0" class="py-6">暂无任务。</p>
          <div
            v-for="task in schedules"
            :key="task.id"
            class="my-4 flex flex-wrap gap-6 border-b pb-4"
          >
            <ArticlePreview :items="task.content.items" />
            <div>
              <Tag>
{{
                ['待发送', '执行中', '已发送', '失败', '已取消'][task.status]
              }}
</Tag>
              <p>计划：{{ dateText(task.scheduledAt) }}</p>
              <p>
                实际：{{ dateText(task.sentAt) }} · 尝试 {{ task.attempts }} 次
              </p>
              <p v-if="task.messageId">消息 {{ task.messageId }}</p>
              <p v-if="task.lastError" class="text-red-500">
                {{ task.lastError }}
              </p>
              <div class="mt-3 flex flex-wrap gap-2">
                <Button size="small" @click="showPreview(task.content)">
预览
</Button><Button
                  size="small"
                  :disabled="busy"
                  @click="copyDraft(task.content)"
                  >
复制为新草稿
</Button>
                <template v-if="task.status === 0 || task.status === 3">
<Button
                    size="small"
                    :disabled="busy || !canManage"
                    @click="
                      changeTask = task;
                      changeAt = localDate(task.scheduledAt);
                    "
                    >
修改时间
</Button><Button
                    size="small"
                    :disabled="busy || !canManage"
                    @click="taskAction(task, 'execute-now')"
                    >
{{ task.status === 3 ? '重试' : '立即执行' }}
</Button><Button
                    size="small"
                    danger
                    :disabled="busy || !canManage"
                    @click="taskAction(task, 'cancel')"
                    >
取消
</Button>
</template>
                <Button
                  v-if="task.messageId"
                  size="small"
                  @click="tab = 'history'"
                  >
查看聊天历史
</Button>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <Button
              :disabled="busy || schedulePage <= 1"
              @click="
                schedulePage--;
                run(loadSchedules);
              "
              >
上一页
</Button><span>第 {{ schedulePage }} 页 · 共 {{ schedulesTotal }} 条</span><Button
              :disabled="busy || schedulePage * 20 >= schedulesTotal"
              @click="
                schedulePage++;
                run(loadSchedules);
              "
              >
下一页
</Button>
          </div>
        </Card>
      </Tabs.TabPane>
    </Tabs>
    <Modal
      v-model:open="cmsOpen"
      title="选择已发布且可见的 CMS 文章"
      :footer="null"
      width="720px"
    >
      <div class="mb-4 flex gap-2">
        <Input
          v-model:value="cmsKeyword"
          placeholder="搜索文章"
          @press-enter="
            cmsPage = 1;
            run(loadCms);
          "
        /><Button
          :loading="busy"
          @click="
            cmsPage = 1;
            run(loadCms);
          "
          >
搜索
</Button>
      </div>
      <div
        v-for="row in cmsRows"
        :key="row.id"
        class="flex items-center justify-between gap-3 border-b py-3"
      >
        <div>
          <strong>{{ row.title }}</strong>
          <p class="text-muted-foreground">{{ row.summary }}</p>
        </div>
        <Button
          :disabled="
            busy || !row.isVisible || row.status !== ArticleStatus.Published
          "
          @click="selectCms(row)"
          >
选择
</Button>
      </div>
      <p v-if="cmsRows.length === 0" class="py-4">暂无可选的已发布文章。</p>
      <div class="mt-4 flex items-center gap-3">
        <Button
          :disabled="busy || cmsPage <= 1"
          @click="
            cmsPage--;
            run(loadCms);
          "
          >
上一页
</Button><span>{{ cmsPage }} · 共 {{ cmsTotal }} 篇</span><Button
          :disabled="busy || cmsPage * 20 >= cmsTotal"
          @click="
            cmsPage++;
            run(loadCms);
          "
          >
下一页
</Button>
      </div>
    </Modal>
    <Modal v-model:open="previewOpen" title="文章组预览" :footer="null">
<ArticlePreview :items="previewItems" />
</Modal>
    <Modal
      :open="!!changeTask"
      title="修改计划时间"
      :confirm-loading="busy"
      @cancel="changeTask = undefined"
      @ok="run(changeTime)"
      >
<label>发送时间（{{ timezone }}）<input
          v-model="changeAt"
          class="ml-2 rounded border p-2"
          type="datetime-local"
/></label>
</Modal>
  </Page>
</template>
