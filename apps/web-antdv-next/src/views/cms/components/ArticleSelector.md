# CMS 通用文章选择器

`ArticleSelector.vue` 是受控窗口组件。固定正文高度，左侧栏目树与右侧文章列表分别滚动，右侧提供关键词、标签、内容类型、状态、可见性、置顶、推荐和发布时间筛选，以及分页。

每条文章展示封面、标题、摘要、栏目/主栏目、标签、状态和发布时间，并提供原文预览。勾选只更新窗口内的临时选择；跨页和过滤时保留选择，底部确认后才返回文章，取消不会修改外部值。

标题默认“选择文章”。固定状态和可见性条件只用于查询和选择校验，窗口不显示对应提示或重复的文章状态。推荐、置顶使用复选框，勾选时筛选对应文章，未勾选时不限制。左右栏以背景、边框和间距区分，确认按钮显示“确定选择（已选数量）”。

| 属性/事件 | 用途 |
| --- | --- |
| `v-model:open` | 打开、关闭窗口 |
| `v-model:value` | 已选择的完整文章 DTO 数组；单选也使用数组 |
| `multiple` | 默认 `false`；单选采用互斥复选框，可取消勾选 |
| `maxCount` | 多选上限，默认 20；单选最多 1，0 时禁止选择 |
| `status` / `isVisible` | 固定筛选条件，指定后用户不能更改；也用于校验返回的文章 |
| `disabledIds` | 禁止选择的文章 ID 数组 |
| `title` / `height` | 窗口标题及正文高度；默认 620px，受视口最大高度限制 |
| `confirm` | 仅在确认时返回所选 DTO 数组，顺序为勾选顺序 |

Chat 文章推送的多选用法：

```vue
<ArticleSelector
  v-model:open="cmsOpen"
  multiple
  :max-count="8 - items.length"
  :status="ArticleStatus.Published"
  :is-visible="true"
  title="选择文章"
  @confirm="selectCms"
/>
```

单选时省略 `multiple`，通过 `@confirm="rows => selectArticle(rows[0])"` 接收文章。也可用 `v-model:value` 预置和接收选择。

复用现有 `GET /api/cms/admin/articles`、`/categories`、`/tags`，默认每页 20 篇，可切换 10/20/50。栏目最多加载 500 个活动节点，标签最多加载 200 个启用项；请求结果按版本处理，较早的响应不会覆盖新筛选结果。没有新增后端 API。
