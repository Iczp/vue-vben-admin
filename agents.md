# AGENTS.md

## 项目说明

本项目后台管理系统采用：

- 后端：ASP.NET Core + ABP Framework
- 认证：OpenIddict
- 前端：Vben Admin
- Vue 3
- TypeScript
- Vite
- pnpm

前端后台管理项目位于：

F:\Dev\abpvnext\abp-admin-vben\vue-vben-admin

ABP 后端位于：

F:\Dev\abpvnext\Rctea.IM

---

## 基本原则

1. 修改代码前必须先阅读相关现有实现。
2. 不允许根据经验猜测后端 API。
3. 后端 API、DTO、枚举、分页结构以 Swagger/OpenAPI 和后端 C# Contract 为准。
4. 如果 Swagger 和代码不一致，停止该部分实现并说明。
5. 除非任务明确要求，否则不要修改 ABP 后端。
6. 优先复用 Vben Admin 现有组件和基础设施。
7. 不重复封装 Vben 已经提供的功能。
8. TypeScript 禁止无必要地使用 any。
9. 不允许在页面组件中直接调用 axios。
10. 所有 HTTP 请求必须通过统一 API 层。

---

## API 规范

API 地址必须来自环境变量：

VITE_GLOB_API_URL

禁止硬编码服务器地址。

请求统一通过：

src/api/request.ts

业务 API 放置于：

src/api/modules/

自动生成的 API/DTO 放置于：

src/api/generated/

页面组件不得直接依赖 OpenAPI Generator 生成的复杂实现，
需要通过 modules 层进行适当封装。

---

## ABP 分页

ABP 常规分页参数：

- skipCount
- maxResultCount
- sorting

分页返回：

{
  items: T[],
  totalCount: number
}

不要转换成另一套后端分页协议。

前端可以在 API adapter 中转换成 Vben DataGrid 所需格式。

---

## ABP 权限

权限来源：

GET /api/abp/application-configuration

使用：

auth.grantedPolicies

禁止自行维护一套与 ABP 无关的角色权限系统。

权限名称必须使用后端 PermissionDefinitionProvider 定义的权限名称。

例如：

AbpIdentity.Users
AbpIdentity.Users.Create
AbpIdentity.Users.Update
AbpIdentity.Users.Delete

实现统一：

hasPermission(permission)

路由、菜单、按钮均复用同一套权限数据。

---

## ABP Application Configuration

登录成功以后加载：

/api/abp/application-configuration

并保存以下信息：

- currentUser
- currentTenant
- auth.grantedPolicies
- setting
- localization

权限或用户状态发生变化后允许重新加载 configuration。

---

## Authentication

认证方式必须与现有 ABP OpenIddict 配置保持一致。

修改认证功能前先检查：

- AuthServer
- OpenIddict application
- ClientId
- Scopes
- RedirectUris
- GrantTypes

禁止自行改变认证协议。

浏览器后台管理系统优先使用：

Authorization Code + PKCE

如果现有项目已有 Token/RefreshToken 实现，则优先兼容现有实现。

---

## HTTP 错误

统一处理：

400
401
403
404
409
500

识别 ABP RemoteServiceErrorResponse。

不要在每一个页面重复：

try/catch + message.error

公共错误处理应该位于 request interceptor。

业务级错误可在页面单独处理。

---

## CRUD 页面规范

标准 CRUD 页面使用：

- Vben Page
- Vben DataGrid
- Vben Form
- Modal / Drawer

目录：

views/{module}/{entity}/

建议结构：

index.vue
data.ts
modules/form.vue

其中：

index.vue

负责：

- 查询
- DataGrid
- 页面动作

data.ts

负责：

- columns
- schema
- search form

form.vue

负责：

- Create
- Update

---

## 权限按钮

例如：

Create:
AbpIdentity.Users.Create

Update:
AbpIdentity.Users.Update

Delete:
AbpIdentity.Users.Delete

没有权限时按钮不显示。

但是：

前端权限仅用于 UI。

真正安全控制必须由 ABP 后端 Authorize/Permission 完成。

---

## 代码修改要求

完成任务后必须：

1. pnpm typecheck
2. pnpm lint

如果项目支持测试：

3. pnpm test

检查：

- TypeScript 错误
- eslint
- 未使用 import
- 格式化
- 编译

不要为了通过检查删除已有业务逻辑。

---

## Codex 工作方式

执行任务时按照：

分析
→ 查找相关后端 Contract
→ 查找 Swagger
→ 查找已有 Vben 实现
→ 设计
→ 实现
→ typecheck
→ lint
→ 汇报

不要直接从写代码开始。

完成后说明：

- 修改了哪些文件
- 使用了哪些后端 API
- 使用了哪些 ABP permissions
- 是否修改后端
- typecheck 是否通过
- lint 是否通过
- 尚未解决的问题