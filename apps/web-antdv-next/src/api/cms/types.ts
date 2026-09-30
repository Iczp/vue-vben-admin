import type { PagedAndSortedResultRequestDto } from '#/api/abp/types';

// ==================== Permissions ====================
export const CmsPermissions = {
  GroupName: 'Cms',
  Articles: {
    Default: 'Cms.Articles',
    Create: 'Cms.Articles.Create',
    Update: 'Cms.Articles.Update',
    Delete: 'Cms.Articles.Delete',
    Publish: 'Cms.Articles.Publish',
    Review: 'Cms.Articles.Review',
  },
  Categories: {
    Default: 'Cms.Categories',
    Create: 'Cms.Categories.Create',
    Update: 'Cms.Categories.Update',
    Delete: 'Cms.Categories.Delete',
  },
  Tags: {
    Default: 'Cms.Tags',
    Create: 'Cms.Tags.Create',
    Update: 'Cms.Tags.Update',
    Delete: 'Cms.Tags.Delete',
  },
  Assets: {
    Default: 'Cms.Assets',
    Upload: 'Cms.Assets.Upload',
    Delete: 'Cms.Assets.Delete',
  },
  Comments: {
    Default: 'Cms.Comments',
    Review: 'Cms.Comments.Review',
    Delete: 'Cms.Comments.Delete',
    Select: 'Cms.Comments.Select',
    Pin: 'Cms.Comments.Pin',
  },
  Moderations: {
    Default: 'Cms.Moderations',
    Review: 'Cms.Moderations.Review',
  },
  Recommendations: {
    Default: 'Cms.Recommendations',
    Manage: 'Cms.Recommendations.Manage',
  },
  Promotions: {
    Default: 'Cms.Promotions',
    Manage: 'Cms.Promotions.Manage',
  },
  Redirects: {
    Default: 'Cms.Redirects',
    Manage: 'Cms.Redirects.Manage',
  },
  Statistics: {
    Default: 'Cms.Statistics',
  },
} as const;

// ==================== Enums ====================
export enum ArticleStatus {
  Draft = 0,
  PendingReview = 1,
  Approved = 2,
  Scheduled = 3,
  Published = 4,
  Offline = 5,
  Archived = 6,
}

export enum SourceType {
  Manual = 1,
  Import = 2,
  Wechat = 3,
  OldCms = 4,
  Markdown = 5,
  Crawler = 6,
  ExternalApi = 7,
  AI = 8,
}

export enum AssetType {
  Image = 1,
  Video = 2,
  Audio = 3,
  File = 4,
}

export enum AssetStatus {
  Normal = 0,
  Processing = 1,
  Failed = 2,
  Disabled = 3,
}

export enum CommentStatus {
  PendingReview = 0,
  Approved = 1,
  Rejected = 2,
  Hidden = 3,
  Deleted = 4,
}

export enum ContentModerationStatus {
  Pending = 0,
  Processing = 1,
  Approved = 2,
  Rejected = 3,
  NeedManualReview = 4,
}

export enum ContentRiskLevel {
  Pass = 0,
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum ModerationDecision {
  Approve = 1,
  Reject = 2,
  ManualReview = 3,
}

export enum ModerationItemDecision {
  Pass = 1,
  Block = 2,
  Review = 3,
}

export enum ReviewStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

// ==================== Articles ====================
export interface ArticleListItemBaseDto {
  code: string;
  title: string;
  subTitle?: string;
  summary?: string;
  coverUrl?: string;
  publishTime?: string;
}

export interface AdminArticleListItemDto extends ArticleListItemBaseDto {
  id: string;
  status: ArticleStatus;
  currentRevisionId?: string;
  activeSnapshotId?: string;
  viewCount: number;
  actualViewCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  sorting: number;
  isTop: boolean;
  topExpireTime?: string;
  isRecommend: boolean;
  allowComment: boolean;
  isVisible: boolean;
  creationTime: string;
  creatorId?: string;
  scheduledPublishTime?: string;
  offlineTime?: string;
  auditOpinion?: string;
}

export interface ArticleRevisionDto {
  id: string;
  articleId: string;
  version: number;
  title: string;
  subTitle?: string;
  summary?: string;
  coverUrl?: string;
  content: string;
  markdownContent?: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  editorUserId?: string;
  changeLog?: string;
  creationTime: string;
}

export interface AdminArticleDetailDto extends AdminArticleListItemDto {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  slug?: string;
  content?: string;
  markdownContent?: string;
  revisionCount: number;
  categories: CategoryDto[];
  mainCategoryId?: string;
  tags: TagDto[];
  currentRevision?: ArticleRevisionDto;
}

export interface AdminArticleListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  categoryId?: string;
  tagId?: string;
  publisherActorId?: string;
  publisherActorType?: string;
  publishTimeFrom?: string;
  publishTimeTo?: string;
  status?: ArticleStatus;
  ownerUserId?: string;
  ownerActorId?: string;
  ownerActorType?: string;
  isTop?: boolean;
  isRecommend?: boolean;
  isVisible?: boolean;
}

export interface AdminArticleCreateInput {
  title: string;
  subTitle?: string;
  summary?: string;
  slug?: string;
  coverUrl?: string;
  content: string;
  markdownContent?: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  categoryIds?: string[];
  mainCategoryId?: string;
  tagNames?: string[];
  actorType?: string;
  actorId?: string;
  actorName?: string;
  allowComment?: boolean;
  isVisible?: boolean;
  isTop?: boolean;
  topExpireTime?: string;
  isRecommend?: boolean;
  sorting?: number;
  password?: string;
}

export interface AdminArticleUpdateInput {
  title: string;
  subTitle?: string;
  summary?: string;
  slug?: string;
  coverUrl?: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  categoryIds?: string[];
  mainCategoryId?: string;
  tagNames?: string[];
  allowComment?: boolean;
  isVisible?: boolean;
  isTop?: boolean;
  topExpireTime?: string;
  isRecommend?: boolean;
  sorting?: number;
  password?: string;
}

export interface AdminArticleScheduleInput {
  scheduledPublishTime: string;
}

export interface AdminArticleRejectInput {
  opinion: string;
}

export interface AdminArticleRevisionCreateInput {
  title: string;
  subTitle?: string;
  summary?: string;
  content: string;
  markdownContent?: string;
  coverUrl?: string;
  changeLog?: string;
}

// ==================== Categories ====================
export interface CategoryDto {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  sorting: number;
  isActive: boolean;
  articleCount: number;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
  creationTime?: string;
  children?: CategoryDto[];
}

export interface CategoryCreateDto {
  parentId?: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  sorting?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export interface CategoryUpdateDto {
  parentId?: string;
  name: string;
  code: string;
  slug?: string;
  description?: string;
  coverUrl?: string;
  sorting?: number;
  isActive?: boolean;
  seoTitle?: string;
  seoKeywords?: string;
  seoDescription?: string;
}

export interface CategoryGetListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  parentId?: string;
  isActive?: boolean;
}

// ==================== Tags ====================
export interface TagDto {
  id: string;
  name: string;
  code: string;
  description?: string;
  sorting: number;
  isEnabled: boolean;
  creationTime?: string;
}

export interface TagCreateDto {
  name: string;
  code: string;
  description?: string;
  sorting?: number;
  isEnabled?: boolean;
}

export interface TagUpdateDto {
  name: string;
  description?: string;
  sorting?: number;
  isEnabled?: boolean;
}

export interface TagGetListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  isEnabled?: boolean;
}

// ==================== Assets ====================
export interface AssetVariantDto {
  id: string;
  assetId: string;
  variantType: string;
  blobName: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface AssetDto {
  id: string;
  fileName: string;
  type: AssetType;
  status: AssetStatus;
  containerName: string;
  blobName: string;
  mimeType: string;
  extension?: string;
  fileSize: number;
  hash?: string;
  width?: number;
  height?: number;
  duration?: number;
  sourceUrl?: string;
  actorType?: string;
  actorId?: string;
  actorName?: string;
  variants: AssetVariantDto[];
  creationTime: string;
}

export interface AssetCreateDto {
  fileName: string;
  type: AssetType;
  containerName: string;
  blobName: string;
  mimeType: string;
  extension?: string;
  fileSize: number;
  hash?: string;
  width?: number;
  height?: number;
  duration?: number;
  sourceUrl?: string;
  actorType?: string;
  actorId?: string;
}

export interface AssetGetListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  type?: AssetType;
  status?: AssetStatus;
}

// ==================== Comments ====================
export interface CommentDto {
  id: string;
  entityType: string;
  entityId: string;
  parentId?: string;
  rootId?: string;
  actorType: string;
  actorId: string;
  actorName?: string;
  content: string;
  status: CommentStatus;
  likeCount: number;
  dislikeCount: number;
  replyCount: number;
  creationTime: string;
}

export interface AdminCommentListInput extends PagedAndSortedResultRequestDto {
  entityType?: string;
  entityId?: string;
  status?: CommentStatus;
  keyword?: string;
}

// ==================== Moderations ====================
export interface ContentModerationItemDto {
  id: string;
  moderationId: string;
  itemKey: string;
  riskLabel: string;
  riskScore: number;
  matchedContext?: string;
  decision: ModerationItemDecision;
}

export interface ContentModerationDto {
  id: string;
  entityType: string;
  entityId: string;
  provider: string;
  status: ContentModerationStatus;
  riskLevel: ContentRiskLevel;
  decision: ModerationDecision;
  suggestion?: string;
  rawResponse?: string;
  completedTime?: string;
  items: ContentModerationItemDto[];
  creationTime: string;
}

export interface AdminModerationListInput extends PagedAndSortedResultRequestDto {
  entityType?: string;
  status?: ContentModerationStatus;
  riskLevel?: ContentRiskLevel;
  decision?: ModerationDecision;
}

export interface ReviewDecisionInput {
  isApproved: boolean;
  opinion?: string;
}

// ==================== Recommendation Rules ====================
export interface RecommendationRuleDto {
  id: string;
  name: string;
  scene: string;
  isEnabled: boolean;
  freshnessWeight: number;
  similarityWeight: number;
  interestWeight: number;
  popularityWeight: number;
  manualWeight: number;
  readPenalty: number;
  exposurePenalty: number;
  candidateCount: number;
  resultCount: number;
  maxSamePublisherCount: number;
  algorithmVersion?: string;
  extraConfigJson?: string;
  creationTime?: string;
}

export interface RecommendationRuleCreateDto {
  name: string;
  scene: string;
  isEnabled?: boolean;
  freshnessWeight?: number;
  similarityWeight?: number;
  interestWeight?: number;
  popularityWeight?: number;
  manualWeight?: number;
  readPenalty?: number;
  exposurePenalty?: number;
  candidateCount?: number;
  resultCount?: number;
  maxSamePublisherCount?: number;
  algorithmVersion?: string;
  extraConfigJson?: string;
}

export interface RecommendationRuleUpdateDto {
  name: string;
  scene: string;
  isEnabled?: boolean;
  freshnessWeight?: number;
  similarityWeight?: number;
  interestWeight?: number;
  popularityWeight?: number;
  manualWeight?: number;
  readPenalty?: number;
  exposurePenalty?: number;
  candidateCount?: number;
  resultCount?: number;
  maxSamePublisherCount?: number;
  algorithmVersion?: string;
  extraConfigJson?: string;
}

// ==================== Promotions ====================
export interface ContentPromotionDto {
  id: string;
  entityType: string;
  entityId: string;
  scene: string;
  weight: number;
  startTime?: string;
  endTime?: string;
  isEnabled: boolean;
  reason?: string;
  operatorUserId?: string;
  operatorActorName?: string;
  creationTime: string;
}

export interface ContentPromotionCreateDto {
  entityType: string;
  entityId: string;
  scene: string;
  weight: number;
  startTime?: string;
  endTime?: string;
  isEnabled?: boolean;
  reason?: string;
}

export interface ContentPromotionUpdateDto {
  weight: number;
  startTime?: string;
  endTime?: string;
  isEnabled: boolean;
  reason?: string;
}

export interface ContentPromotionGetListInput extends PagedAndSortedResultRequestDto {
  entityType?: string;
  entityId?: string;
  scene?: string;
  isEnabled?: boolean;
}

// ==================== Redirects ====================
export interface ContentRedirectDto {
  id: string;
  sourcePath: string;
  entityType: string;
  entityId: string;
  targetCode?: string;
  httpStatusCode: number;
  isEnabled: boolean;
  creationTime?: string;
}

export interface ContentRedirectCreateDto {
  sourcePath: string;
  entityType: string;
  entityId: string;
  targetCode?: string;
  httpStatusCode?: number;
  isEnabled?: boolean;
}

export interface ContentRedirectUpdateDto {
  targetCode?: string;
  httpStatusCode?: number;
  isEnabled?: boolean;
}

export interface ContentRedirectGetListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  entityType?: string;
  isEnabled?: boolean;
}

// ==================== Sources ====================
export interface ContentSourceDto {
  id: string;
  articleId: string;
  sourceType: SourceType;
  sourceSystem?: string;
  sourceId?: string;
  externalId?: string;
  sourceUrl?: string;
  importer?: string;
  importedTime?: string;
  contentHash?: string;
  metadataJson?: string;
  creationTime?: string;
}

export interface ContentSourceCreateDto {
  articleId: string;
  sourceType: SourceType;
  sourceSystem?: string;
  sourceId?: string;
  externalId?: string;
  sourceUrl?: string;
  importer?: string;
  importedTime?: string;
  contentHash?: string;
  metadataJson?: string;
}

export interface ContentSourceUpdateDto {
  sourceType: SourceType;
  sourceSystem?: string;
  sourceId?: string;
  externalId?: string;
  sourceUrl?: string;
  importer?: string;
  importedTime?: string;
  contentHash?: string;
  metadataJson?: string;
}

export interface ContentSourceGetListInput extends PagedAndSortedResultRequestDto {
  articleId?: string;
  sourceType?: SourceType;
  sourceSystem?: string;
  externalId?: string;
}

// ==================== Daily Stats ====================
export interface ContentDailyStatDto {
  id: string;
  entityType: string;
  entityId: string;
  statDate: string;
  viewCount: number;
  uniqueVisitorCount: number;
  likeCount: number;
  commentCount: number;
  favoriteCount: number;
  shareCount: number;
  totalDurationSeconds: number;
  avgReadPercentage: number;
}

export interface ContentDailyStatGetListInput extends PagedAndSortedResultRequestDto {
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}
