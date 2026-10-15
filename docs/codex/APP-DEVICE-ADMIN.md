# AppDevice 后台接入

本次只为独立 IczpNet.AppDevice 模块增加管理入口。原 `/system/devices` 登录设备管理、Chat/统计设备 API 和现有客户端保持原状；没有修改后端源码、数据库或设备服务部署权限。

## 页面与能力

- `/app-device/devices`：按 AppId、关键词、平台、启用状态、用户 ID、分组查询；详情、资料修改、启停、软删除、绑定只读查看、单设备加入/移出分组。
- `/app-device/groups`：分组新建、编辑、删除及成员管理。
- 通用设备选择器：固定高度，单选/多选、跨页保留、最大数量、底部确认和已选数量。作用域改变或重新打开时清空选择。
- 200 台以内成员调整直接调用成员接口；201..1000 台使用后台持久任务，保留同次提交的 RequestKey，展示进度/失败与重试时间。隐藏进度窗口停止轮询，重新打开按任务 ID 查询；后台任务不受窗口关闭影响。当前页面保留上次任务入口，不提供服务端任务历史列表。

## 服务配置

开发环境位于 `apps/web-antdv-next/.env.development`：

```dotenv
VITE_APP_DEVICE_API_BASE_URL=http://127.0.0.1:51631
VITE_APP_DEVICE_APP_IDS=GotoIM
```

API 地址只在 Vite 代理端使用。AppId 备选值以逗号分隔，必须与设备服务 `AppsByClient` 白名单一致；备选值不是授权。当前租户由签名身份确定，页面不把任意租户 Header 当作跨租户授权。

浏览器统一请求 `/api/app-device/...`。其中 `/api/app-device/abp/application-configuration` 代理重写为设备 Host 的 `/api/abp/application-configuration`，其他路径保持原样。

生产静态站点需要同源代理，不能依赖开发 Vite。`scripts/deploy/app-device.locations.conf.template` 提供位置配置：由部署环境设置 `APP_DEVICE_API_UPSTREAM`（不带末尾 `/`），通过 `envsubst '$APP_DEVICE_API_UPSTREAM'` 渲染，再放入现有 Nginx 的 `server` 块。必须限制 envsubst 变量列表以保留 `$is_args`、`$args` 等 Nginx 变量。上游须从代理所在进程/容器可达；没有自动扩大设备 Host 的监听范围，也没有自动修改现有生产代理。

## 权限与防伪

登录和路由初始化时加载设备服务的 ABP configuration。仅合并 `AppDevice.*` 权限，主服务 currentUser/currentTenant/setting/localization 保持其原来源；设备服务不可用时清除设备权限并提示，其他模块仍可登录。退出/新登录会使旧配置响应失效。

设备路由先按真实服务权限筛选，避免现有管理员通配规则把无授权设备菜单显示出来。按钮同样使用 ABP 的实际策略：

| 操作                   | 策略                                        |
| ---------------------- | ------------------------------------------- |
| 设备列表/详情/成员查询 | AppDevice.Devices.Read                      |
| 资料编辑               | AppDevice.Devices.Update                    |
| 启用 / 禁用 / 删除     | AppDevice.Devices.Enable / Disable / Delete |
| 绑定记录               | AppDevice.Bindings.Read                     |
| 分组列表               | AppDevice.Groups.Read                       |
| 分组增改删             | AppDevice.Groups.Manage                     |
| 成员调整与任务         | AppDevice.GroupMembers.Manage               |

所有权限最终由设备 API 校验。后台绑定、解绑和在线查询没有借用受信 Integration 接口。

写请求复用统一拦截器，初始化设备服务自己的 Cookie 配对，读取 `AppDevice.XSRF-TOKEN`，发送 `RequestVerificationToken`；不关闭防伪，也不复用 Chat/IM 的令牌。

## API 与数据约束

统一 API 层：`src/api/modules/app-device/`。后台前缀 `/api/app-device/admin`，对应运行中的 admin Swagger 和 C# Contract：

- GET devices、devices/{id}、devices/{id}/bindings。
- PATCH devices/{id}；POST devices/{id}/{enable|disable|delete}。
- GET/POST groups；PATCH groups/{id}；POST groups/{id}/delete。
- GET/POST groups/{id}/members，添加/移除由 add 参数决定。
- POST operations；GET operations/{id}。

游标分页使用 afterId/take、items/nextId，最多 200 条/页，不生成 totalCount、Offset 或任意跳页。设备绑定列表只有数组，因此满页时允许再向后读取一页确认结束。

资料、状态和分组更新携带 ConcurrencyStamp。409 提示并刷新权威记录，避免无提示覆盖。设备编辑白名单为 Name/Platform/DeviceType/Brand/Model/OsVersion/AppVersion。

最近活跃是延迟持久化时间，不标为实时在线。首版没有后台登记、回收站、完整任务历史、任务取消、分组总成员数；分组软删除后名称保留。这些能力需要相应后台契约后再开放。

## 验证入口

```powershell
pnpm --filter @vben/web-antdv-next typecheck
pnpm lint
pnpm --filter @vben/web-antdv-next build
pnpm exec vitest run --config apps/web-antdv-next/vitest.cms.config.ts apps/web-antdv-next/src/views/app-device apps/web-antdv-next/src/router/app-device-access.test.ts apps/web-antdv-next/src/api/abp/antiforgery.test.ts
```

测试覆盖游标进退/失败重试/旧请求隔离、权限源合并/通配隔离、各服务防伪、跨页选择/上限/单选，以及批量任务幂等键复用/完成反馈/隐藏停止轮询。

## 2026-10-15 验证记录

- 16 项相关测试通过。
- 生产构建成功，生成 dist 和 dist.zip；产物未纳入提交。
- AppDevice 页面、API、权限、防伪及直接依赖范围的严格 TypeScript 检查通过，沿用原 tsconfig 的编译选项；没有放宽类型规则。
- 本次文件的 ESLint、类型感知 Oxlint、Vue Stylelint、Oxfmt 检查通过。
- 全项目 typecheck 未通过：现有 CMS 素材页面及弹窗有 27 处类型错误。本次新增测试中发现的 RouteMeta 类型问题已修正，没有修改这些 CMS 文件。
- 全仓库 pnpm lint 未通过：Oxfmt 报告 225 个既有文件的格式问题；本次文件已另行检查通过，没有批量格式化其他模块。
- 通过当前 Vite 代理、现有认证中心和真实设备服务，验证配置/Cookie、配对防伪 POST、公共客户端后台 403、错误防伪 JSON 400，共 4 项通过。测试只在新设备库登记唯一前缀的测试设备，没有修改旧模块设备。
- 浏览器会话当前未取得 AppDevice 管理权限，已验证新页面不会因旧管理员通配规则或静态路由而直接暴露。已授权管理员的真实浏览器增删改操作尚未验收，需要管理员重新登录后继续；没有绕过滑块、伪造管理员令牌或扩大服务权限。
- 生产反向代理提供配置模板，未修改或发布现有生产站点。Node 版本存在项目 engines 提示，但构建与上述检查可执行，未升级全局工具。
