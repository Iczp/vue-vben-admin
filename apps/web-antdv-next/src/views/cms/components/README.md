# 通用媒体选择器

单选沿用 `v-model:value`（string）。多选用 `v-model:values`（string[]），`multiple` 开启，`max-count` 控制上限（默认 20，单选固定 1）。`select` 返回已加载的 AssetDto[]，可保存资源 ID 和更多信息。外部自定义 URL 无资源 DTO。

```vue
<MediaSelector v-model:value="coverUrl" :asset-types="[AssetType.Image]" />
<MediaSelector
  v-model:values="mediaUrls"
  multiple
  :max-count="9"
  @select="onSelected"
/>
```

默认允许图片、视频、音频、文件；`asset-types` 限制类型。选择跨搜索、分页和类型筛选保留，已选项可移除；取消不提交草稿。上传加入草稿，确认后更新 v-model；达到上限仍可移除已选项。

MediaPreview 共用于选择器及媒体库列表：图片、视频、音频可预览/播放，其他文件显示信息及访问链接，不直接嵌入执行文档。详情包含名称、类型、格式/MIME、字节数、上传时间、上传者、资源 ID、访问地址、哈希（若存在）；图片/视频显示宽高，视频/音频显示时长，已有缩略图可放大查看。

上传 API 在浏览器支持的编码下读取图片宽高、视频宽高/时长/首帧 JPEG 封面、音频时长。封面最大边 640px，提取最长等待 8 秒；不支持或提取失败仍允许上传。后端保存现有 Width/Height/Duration，视频封面保存现有 AssetVariant 的 thumbnail，未新增数据库字段，无需迁移。metadata 是客户端提供的展示信息，不用于安全/计费判断。

旧资源缺失元信息显示“未采集”；预览媒体成功加载时从浏览器读取时长/分辨率用于当前详情展示，不修改旧记录。不强制引入 FFmpeg，不承诺浏览器不支持的媒体编码能播放或生成缩略图。

验证：CMS Host 编译、后端 AssetUploadTests 4 项、前端选择/预览测试 7 项、vue-tsc 类型检查、ESLint 与生产构建通过。后端镜像已更新并确认 Swagger 上传表单包含文件、宽高、时长和缩略图字段。
