# ABP vNext CRUD 开发指南与最佳实践

本文档专为在 `apps/web-antdv-next` 中开发 **ABP vNext** 业务管理模块提供标准化规范、常用方法与完整使用示例。

---

## 目录

1. [架构分层与设计规范](#一架构分层与设计规范)
2. [通用组合式函数 `useAbpCrud`](#二通用组合式函数-useabpcrud)
3. [纯 JSON 表格列配置与内置 Formatters](#三纯-json-表格列配置与内置-formatters)
4. [声明式单元格组件 (CellRenderers)](#四声明式单元格组件-cellrenderers)
5. [Template 具名插槽（Slot）自定义渲染](#五template-具名插槽slot自定义渲染)
6. [完整端到端开发示例 (End-to-End)](#六完整端到端开发示例-end-to-end)

---

## 一、架构分层与设计规范

每个业务 CRUD 功能模块推荐按以下结构组织：

```text
src/
├── api/
│   └── [module]/                 # API 与 DTO 强类型定义
│       ├── types.ts              # DTO 接口定义 (继承 PagedAndSortedResultRequestDto 等)
│       └── [entity].ts           # RESTful 接口调用 (get, create, update, delete, list)
└── views/
    └── [module]/
        └── [entity]/             # 业务视图目录
            ├── data.ts           # 纯 JSON 表格列定义 (VxeTableGridColumns)
            ├── index.vue         # 列表检索与工具栏组装页 (使用 useAbpCrud)
            └── modules/
                └── [entity]-modal.vue  # 新增 / 编辑表单弹窗 (使用 useVbenModal)
```

---

## 二、通用组合式函数 `useAbpCrud`

`useAbpCrud`（位于 `#/composables/use-abp-crud`）专为对接 ABP 后端开发，自动解决以下通用逻辑：
- **分页转换**：前端页码 `currentPage + pageSize` $\rightarrow$ ABP 的 `skipCount + maxResultCount`；
- **排序转换**：表格多列/单列排序 $\rightarrow$ ABP 的 `sorting: "FieldName asc|desc"`；
- **双击交互**：统一行双击（`cellDblclick`）行为：**有详情进入详情，无详情进入编辑**；
- **删除确认**：自动弹出危险操作确认框（二次确认），成功后自动刷新表格；
- **弹窗联动**：自动管理新增、编辑、详情、权限分配弹窗的开关与数据传递；
- **数据响应**：自动对接 ABP `PagedResultDto<T>` 返回格式（`items` 和 `totalCount`）。

### 1. 参数选项 `UseAbpCrudOptions<TEntity, TQuery>`

| 属性 | 类型 | 必填 | 说明 |
| :--- | :--- | :---: | :--- |
| `service` | `object` | **是** | 包含 `list`, `delete`, `create`, `update`, `get` 等 API 集合 |
| `columns` | `(helpers) => VxeTableGridColumns` | **是** | 表格列定义函数，入参注入 `onAction`, `onEdit`, `onDelete`, `onPermission` |
| `formComponent` | `Component` | 否 | 新增/编辑的弹窗组件（由 `useVbenModal` 包装） |
| `permissionComponent` | `Component` | 否 | 权限管理弹窗组件（如 `PermissionModal`） |
| `getEntityTitle` | `(row: TEntity) => string` | 否 | 自定义删除确认框中显示的实体名称 |
| `pageSize` | `number` | 否 | 默认每页条数，默认 `10` |
| `defaultQueryParams` | `TQuery` | 否 | 初始搜索过滤参数 |

### 2. 返回值对象

| 属性 / 方法 | 类型 | 说明 |
| :--- | :--- | :--- |
| `Grid` | `Component` | 渲染好的 VXE 表格组件 |
| `gridApi` | `VxeGridApi` | 表格控制实例（`gridApi.query()`, `gridApi.reload()` 等） |
| `FormModal` | `Component` | 渲染好的新增/编辑弹窗组件 |
| `PermModal` | `Component` | 渲染好的权限弹窗组件 |
| `queryParams` | `Ref<TQuery>` | 当前响应式查询参数对象（双向绑定搜索栏） |
| `refresh` | `() => void` | 重新刷新表格数据 |
| `search` | `(params) => void` | 设置搜索参数并立即检索刷新 |
| `resetSearch` | `() => void` | 重置搜索参数并刷新 |
| `onCreate` | `() => void` | 快捷打开创建弹窗 |
| `onEdit` | `(row) => void` | 快捷打开编辑弹窗并传入当前行数据 |
| `onDelete` | `(row) => void` | 触发删除二次确认流程 |
| `onPermission` | `(row, providerName?) => void` | 快捷打开当前实体的权限配置弹窗 |

---

## 三、纯 JSON 表格列配置与内置 Formatters

表格列推荐在 `data.ts` 中以纯 JSON 形式配置，无需书写任何 HTML 标签。

### 1. 全局内置 Formatters

已在全局注册，可直接在 `formatter: 'xxx'` 中指定：

| Formatter 名称 | 说明 | 配置示例 | 输出样例 |
| :--- | :--- | :--- | :--- |
| `formatDateTime` | 日期时间格式化 | `formatter: 'formatDateTime'` | `2026-08-24 17:30:00` |
| `formatDate` | 纯日期格式化 | `formatter: 'formatDate'` | `2026-08-24` |
| `formatTime` | 纯时间格式化 | `formatter: 'formatTime'` | `17:30:00` |
| `formatBool` | 布尔值转换 | `formatter: 'formatBool'` | `是` / `否` |
| `formatAmount` | 金额千分位 | `formatter: 'formatAmount'` | `￥12,345.67` |
| `formatPercent` | 百分比格式化 | `formatter: 'formatPercent'` | `85.60%` |
| `formatEmpty` | 空值兜底（null/undefined） | `formatter: 'formatEmpty'` | `-` |

### 2. 自定义函数式 Formatter

如需根据多字段计算或字典映射，支持直接使用函数：

```ts
// 拼接全名
{
  field: 'fullName',
  title: '用户全名',
  formatter: ({ row }) => `${row.surname || ''} ${row.name || ''}`.trim() || '-',
}

// 字典映射
const GENDER_MAP: Record<number, string> = { 1: '男', 2: '女', 0: '保密' };
{
  field: 'gender',
  title: '性别',
  formatter: ({ cellValue }) => GENDER_MAP[cellValue] || '未知',
}
```

---

## 四、声明式单元格组件 (CellRenderers)

通过纯 JSON 的 `cellRender` 属性，可以直接挂载丰富的组件：

### 1. 状态与枚举标签 `CellTag`
```ts
{
  field: 'isActive',
  title: '用户状态',
  width: 100,
  cellRender: {
    name: 'CellTag',
    options: [
      { value: true, label: '启用', color: 'success' },
      { value: false, label: '禁用', color: 'error' },
    ],
  },
}
```

### 2. 一键复制 `CellCopyable`
鼠标悬浮显示复制按钮，点击自动写入系统剪贴板：
```ts
{
  field: 'clientIpAddress',
  title: 'IP 地址',
  minWidth: 140,
  cellRender: { name: 'CellCopyable' },
}
```

### 3. 在线状态徽标 `CellBadge`
```ts
{
  field: 'isOnline',
  title: '状态',
  width: 100,
  cellRender: {
    name: 'CellBadge',
    options: [
      { value: true, text: '在线', status: 'success' },
      { value: false, text: '离线', status: 'default' },
    ],
  },
}
```

### 4. 异步状态开关 `CellSwitch`
可在表格内直接操作开关，支持异步接口校验：
```ts
{
  field: 'isActive',
  title: '快速切换状态',
  width: 120,
  cellRender: {
    name: 'CellSwitch',
    attrs: {
      beforeChange: async (newVal, row) => {
        await updateUserStatusApi(row.id, newVal);
        return true; // 返回 true 允许切换，返回 false 阻止切换
      },
    },
  },
}
```

### 5. 操作列按钮组 `CellOperation`
自动生成编辑、权限、删除按钮，支持防误触删除确认：
```ts
{
  field: 'operation',
  fixed: 'right',
  title: '操作',
  width: 180,
  cellRender: {
    name: 'CellOperation',
    options: ['edit', 'permission', 'delete'],
    attrs: {
      nameField: 'name', // 提示框中展示的实体字段名称
      onClick: onActionClick,
    },
  },
}
```

---

## 五、Template 具名插槽（Slot）自定义渲染

类似 DevExpress 的 Custom Column Template，当纯 JSON 配置无法满足极度复杂的交互场景时，可以通过 `slots: { default: 'slotName' }` 自定义模板。

### 1. 列配置中声明 Slot 名称
```ts
{
  field: 'userProfile',
  title: '用户概览',
  minWidth: 220,
  slots: { default: 'userProfileSlot' },
}
```

### 2. 页面中书写自定义 UI
```vue
<template>
  <Page auto-content-height>
    <Grid>
      <template #userProfileSlot="{ row }">
        <div class="flex items-center gap-3">
          <Avatar :src="row.avatar" size="small" />
          <div>
            <div class="font-medium text-primary">{{ row.userName }}</div>
            <div class="text-xs text-gray-400">{{ row.email }}</div>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
```

---

## 六、完整端到端开发示例 (End-to-End)

以开发一个 **角色管理 (Role Management)** 为例：

### 1. API 接口定义 (`src/api/identity/role.ts`)
```ts
import type { ListResultDto, PagedResultDto } from '#/api/abp/types';
import type {
  GetIdentityRolesInput,
  IdentityRoleCreateDto,
  IdentityRoleDto,
  IdentityRoleUpdateDto,
} from './types';
import { requestClient } from '#/api/request';

export function getRolesApi(params?: GetIdentityRolesInput) {
  return requestClient.get<PagedResultDto<IdentityRoleDto>>('/identity/roles', { params });
}

export function createRoleApi(data: IdentityRoleCreateDto) {
  return requestClient.post<IdentityRoleDto>('/identity/roles', data);
}

export function updateRoleApi(id: string, data: IdentityRoleUpdateDto) {
  return requestClient.put<IdentityRoleDto>(`/identity/roles/${id}`, data);
}

export function deleteRoleApi(id: string) {
  return requestClient.delete<void>(`/identity/roles/${id}`);
}
```

### 2. 表格列配置 (`src/views/identity/role/data.ts`)
```ts
import type { OnActionClickFn, VxeTableGridColumns } from '#/adapter/vxe-table';
import type { IdentityRoleDto } from '#/api/identity';
import { $t } from '#/locales';

export function useColumns(
  onActionClick: OnActionClickFn<IdentityRoleDto>,
): VxeTableGridColumns<IdentityRoleDto> {
  return [
    { title: '#', type: 'seq', width: 50 },
    { field: 'name', minWidth: 150, title: '角色名称' },
    {
      field: 'isDefault',
      title: '默认角色',
      width: 110,
      cellRender: {
        name: 'CellTag',
        options: [
          { value: true, label: '是', color: 'success' },
          { value: false, label: '否', color: 'default' },
        ],
      },
    },
    {
      field: 'isStatic',
      title: '类型',
      width: 110,
      cellRender: {
        name: 'CellTag',
        options: [
          { value: true, label: '系统静态', color: 'warning' },
          { value: false, label: '自定义', color: 'cyan' },
        ],
      },
    },
    {
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 180,
      cellRender: {
        name: 'CellOperation',
        options: ['edit', 'permission', 'delete'],
        attrs: {
          nameField: 'name',
          onClick: onActionClick,
        },
      },
    },
  ];
}
```

### 3. 表单弹窗 (`src/views/identity/role/modules/role-modal.vue`)
```vue
<script lang="ts" setup>
import type { IdentityRoleDto } from '#/api/identity';
import { computed, ref } from 'vue';
import { useVbenModal } from '@vben/common-ui';
import { Checkbox, Form, Input, message } from 'antdv-next';
import { createRoleApi, updateRoleApi } from '#/api/identity';

const emit = defineEmits(['success']);
const roleModel = ref<IdentityRoleDto | null>(null);
const name = ref('');
const isDefault = ref(false);
const isPublic = ref(false);

const isEdit = computed(() => Boolean(roleModel.value?.id));
const getTitle = computed(() => isEdit.value ? `编辑角色 - ${roleModel.value?.name}` : '新建角色');

const [Modal, modalApi] = useVbenModal<IdentityRoleDto | null>({
  async onConfirm() {
    if (!name.value.trim()) {
      message.error('请输入角色名称');
      return;
    }
    try {
      modalApi.lock();
      if (isEdit.value && roleModel.value?.id) {
        await updateRoleApi(roleModel.value.id, {
          name: name.value,
          isDefault: isDefault.value,
          isPublic: isPublic.value,
          concurrencyStamp: roleModel.value.concurrencyStamp,
        });
      } else {
        await createRoleApi({
          name: name.value,
          isDefault: isDefault.value,
          isPublic: isPublic.value,
        });
      }
      message.success('保存成功');
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      roleModel.value = modalApi.getData() || null;
      if (roleModel.value?.id) {
        name.value = roleModel.value.name || '';
        isDefault.value = roleModel.value.isDefault ?? false;
        isPublic.value = roleModel.value.isPublic ?? false;
      }
    } else {
      roleModel.value = null;
      name.value = '';
      isDefault.value = false;
      isPublic.value = false;
    }
  },
});
</script>

<template>
  <Modal :title="getTitle">
    <Form layout="vertical" class="p-4 space-y-3">
      <Form.Item label="角色名称" required>
        <Input v-model:value="name" placeholder="请输入角色名称" />
      </Form.Item>
      <div class="flex gap-4">
        <Checkbox v-model:checked="isDefault">默认角色</Checkbox>
        <Checkbox v-model:checked="isPublic">公共角色</Checkbox>
      </div>
    </Form>
  </Modal>
</template>
```

### 4. 列表装配主页面 (`src/views/identity/role/index.vue`)
```vue
<script lang="ts" setup>
import type { IdentityRoleDto } from '#/api/identity';
import { Page } from '@vben/common-ui';
import { Plus } from '@vben/icons';
import { Button, Input } from 'antdv-next';
import { deleteRoleApi, getRolesApi } from '#/api/identity';
import { useAbpCrud } from '#/composables';
import PermissionModal from '#/views/permission/permission-modal.vue';
import { useColumns } from './data';
import RoleModal from './modules/role-modal.vue';

const {
  Grid,
  FormModal,
  PermModal,
  onCreate,
  refresh,
  queryParams,
} = useAbpCrud<IdentityRoleDto>({
  columns: ({ onAction }) => useColumns(onAction),
  formComponent: RoleModal,
  permissionComponent: PermissionModal,
  getEntityTitle: (row) => row.name,
  service: {
    list: getRolesApi,
    delete: deleteRoleApi,
  },
});
</script>

<template>
  <Page auto-content-height>
    <!-- 自动挂载弹窗 -->
    <FormModal @success="refresh" />
    <PermModal />

    <!-- 自动渲染数据网格 -->
    <Grid>
      <!-- 第一行左侧：面包屑与标题；第一行右侧自动由 VXE Grid 工具栏呈现（刷新、全屏、列个性化设置） -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">系统管理</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">角色列表</span>
        </div>
      </template>

      <!-- 第二行：左侧搜索表单，右侧操作按钮 -->
      <template #top>
        <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="queryParams.filter"
              placeholder="按角色名检索..."
              allow-clear
              class="w-64"
              @search="refresh"
            />
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="primary"
              v-access="['AbpIdentity.Roles.Create']"
              @click="onCreate"
            >
              <Plus class="size-4 mr-1" />
              新建角色
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
```
