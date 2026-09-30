<script lang="ts" setup>
import type { CommentDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page } from '@vben/common-ui';
import { RotateCw } from '@vben/icons';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  RadioButton,
  RadioGroup,
  Select,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  approveCommentApi,
  CommentStatus,
  deleteCommentApi,
  getCommentsApi,
  hideCommentApi,
  rejectCommentApi,
} from '#/api/cms';

import { useColumns } from './data';

const filters = reactive<{
  entityType?: string;
  keyword: string;
  status?: CommentStatus;
}>({
  entityType: undefined,
  keyword: '',
  status: undefined,
});

async function onApprove(row: CommentDto) {
  try {
    await approveCommentApi(row.id);
    message.success('评论已审核通过');
    refreshGrid();
  } catch (error) {
    console.error('通过失败', error);
  }
}

async function onReject(row: CommentDto) {
  try {
    await rejectCommentApi(row.id);
    message.success('评论已驳回拒绝');
    refreshGrid();
  } catch (error) {
    console.error('驳回失败', error);
  }
}

async function onHide(row: CommentDto) {
  try {
    await hideCommentApi(row.id);
    message.success('评论已隐藏');
    refreshGrid();
  } catch (error) {
    console.error('隐藏失败', error);
  }
}

function onDelete(row: CommentDto) {
  Modal.confirm({
    content: `确定要彻底删除该条评论吗？若存在子回复将一并处理。`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除评论确认',
    async onOk() {
      await deleteCommentApi(row.id);
      message.success('评论删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: CommentDto;
}) {
  switch (code) {
    case 'approve': {
      onApprove(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'hide': {
      onHide(row);
      break;
    }
    case 'reject': {
      onReject(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getCommentsApi({
            entityType: filters.entityType || undefined,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
            status: filters.status,
          });
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 搜索过滤栏 -->
      <Card :bordered="false" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索评论内容..."
              class="w-[260px]"
              allow-clear
              @search="onFilterChange"
            />

            <RadioGroup
              v-model:value="filters.status"
              button-style="solid"
              @change="onFilterChange"
            >
              <RadioButton :value="undefined">全部</RadioButton>
              <RadioButton :value="CommentStatus.PendingReview">待审核</RadioButton>
              <RadioButton :value="CommentStatus.Approved">已通过</RadioButton>
              <RadioButton :value="CommentStatus.Rejected">已驳回</RadioButton>
              <RadioButton :value="CommentStatus.Hidden">已隐藏</RadioButton>
            </RadioGroup>

            <Select
              v-model:value="filters.entityType"
              placeholder="实体类型筛选"
              class="w-[140px]"
              allow-clear
              :options="[
                { label: '文章 (Article)', value: 'Article' },
                { label: '其他实体', value: 'Other' },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 评论数据表格 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>
  </Page>
</template>
