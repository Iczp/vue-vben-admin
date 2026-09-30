<script lang="ts" setup>
import { ref } from 'vue';

import { Page } from '@vben/common-ui';
import { createIconifyIcon } from '@vben/icons';
import { Card, Col, Row, Switch, Tag } from 'antdv-next';

const FileTextIcon = createIconifyIcon('lucide:file-text');
const NewspaperIcon = createIconifyIcon('lucide:newspaper');
const BellIcon = createIconifyIcon('lucide:bell');
const ImageIcon = createIconifyIcon('lucide:image');
const VideoIcon = createIconifyIcon('lucide:video');
const BookOpenIcon = createIconifyIcon('lucide:book-open');
const Share2Icon = createIconifyIcon('lucide:share-2');

interface ContentTypeItem {
  code: string;
  description: string;
  features: string[];
  icon: any;
  isEnabled: boolean;
  name: string;
  recommendedCover: string;
  storageMode: string;
  tagColor: string;
}

const contentTypes = ref<ContentTypeItem[]>([
  {
    code: 'Article',
    description: '标准长图文、深度专栏、新闻深度报道，具备完整富文本、版本追溯与评论能力。',
    features: ['HTML富文本正文', '封面单图/多图', '版本快照历史', 'SEO关键词定制', '多级评论支持'],
    icon: FileTextIcon,
    isEnabled: true,
    name: '标准图文文章',
    recommendedCover: '16:9 宽画幅 (1200x675)',
    storageMode: '大文本对象存储 + 数据库索引',
    tagColor: 'blue',
  },
  {
    code: 'News',
    description: '即时快讯与滚动要闻，侧重短平快的实时发布与大屏/信息流滚动展示。',
    features: ['极速发布流', '简要导语', '外链跳转', '实时时间线渲染'],
    icon: NewspaperIcon,
    isEnabled: true,
    name: '快讯要闻',
    recommendedCover: '可选无封面或方图 (1:1)',
    storageMode: '轻量文本直接入库',
    tagColor: 'cyan',
  },
  {
    code: 'Notice',
    description: '官方系统公告、版本升级提示、停机维护声明与运营通知。',
    features: ['置顶强提醒', '过期自动下线', '弹窗与通知栏透出', '已读未读统计'],
    icon: BellIcon,
    isEnabled: true,
    name: '通知公告',
    recommendedCover: '无封面或横幅海报',
    storageMode: '轻量文本',
    tagColor: 'orange',
  },
  {
    code: 'Gallery',
    description: '高清多图图集、摄影作品、活动摄影纪实，前端以画廊/轮播图形式展示。',
    features: ['多图拖拽排序', '单图描述配文', 'EXIF参数展示', '全屏灯箱预览'],
    icon: ImageIcon,
    isEnabled: true,
    name: '图集画廊',
    recommendedCover: '首图自动提取或精选封面 (4:3 / 16:9)',
    storageMode: '媒体库素材引用关联表',
    tagColor: 'purple',
  },
  {
    code: 'Video',
    description: '点播视频、培训微课、宣讲视频流，支持多码率自适应与播放进度同步。',
    features: ['HLS/MP4直链解析', '自动截取视频封面', '播放时长与完播率统计', '互动弹幕支持'],
    icon: VideoIcon,
    isEnabled: true,
    name: '视频内容',
    recommendedCover: '16:9 视频海报 (1920x1080)',
    storageMode: '视频云存储 + 缩略图',
    tagColor: 'red',
  },
  {
    code: 'Wiki',
    description: '知识库词条、术语库、百科知识图谱，侧重树状层级编目与版本严谨比对。',
    features: ['词条目录树', '专业参考资料引用', '变更差异比对 (Diff)', '贡献者列表'],
    icon: BookOpenIcon,
    isEnabled: true,
    name: '百科词条',
    recommendedCover: '词条概念配图 (1:1 或 4:3)',
    storageMode: '结构化文档 + 关系图谱',
    tagColor: 'green',
  },
  {
    code: 'Wechat',
    description: '外部微信公众号原创文章采集或链接转存，保留微信图文样式与来源出处。',
    features: ['文章一键抓取解析', '图片反盗链转存', '原始出处保留', '外部文章一键发布'],
    icon: Share2Icon,
    isEnabled: true,
    name: '微信图文转存',
    recommendedCover: '微信文章封面自动抓取',
    storageMode: 'HTML清洗转存 + 本地静态化',
    tagColor: 'emerald',
  },
]);
</script>

<template>
  <Page auto-content-height>
    <div class="space-y-4">
      <!-- 页面顶部说明 -->
      <Card variant="borderless" class="shadow-sm">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-base font-semibold">CMS 内容模型与形态 (Content Types)</h2>
            <p class="text-xs text-muted-foreground mt-1">
              定义系统支持的各类多媒体内容形态，各模型具备特定的数据存储结构、前端展示模版与业务审核策略。
            </p>
          </div>
          <Tag color="processing">共 {{ contentTypes.length }} 个系统内置内容模型</Tag>
        </div>
      </Card>

      <!-- 卡片网格列表 -->
      <Row :gutter="[16, 16]">
        <Col v-for="item in contentTypes" :key="item.code" :xs="24" :sm="12" :xl="8">
          <Card variant="borderless" class="h-full shadow-sm hover:shadow transition-shadow flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="p-2.5 rounded-lg bg-primary/10 text-primary">
                    <component :is="item.icon" class="size-5" />
                  </div>
                  <div>
                    <div class="font-medium text-sm flex items-center gap-2">
                      <span>{{ item.name }}</span>
                      <Tag :color="item.tagColor">{{ item.code }}</Tag>
                    </div>
                    <div class="text-xs text-muted-foreground mt-0.5">
                      {{ item.storageMode }}
                    </div>
                  </div>
                </div>

                <Switch v-model:checked="item.isEnabled" size="small" />
              </div>

              <div class="text-xs text-muted-foreground leading-relaxed mt-3 min-h-[40px]">
                {{ item.description }}
              </div>

              <div class="mt-4 pt-3 border-t">
                <div class="text-xs font-medium text-muted-foreground mb-2">模型功能特性：</div>
                <div class="flex flex-wrap gap-1.5">
                  <Tag v-for="feat in item.features" :key="feat" class="text-xs">
                    {{ feat }}
                  </Tag>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-2 text-xs text-muted-foreground bg-muted/20 p-2 rounded">
              <span class="font-medium">推荐封面规范：</span>
              <span>{{ item.recommendedCover }}</span>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  </Page>
</template>
