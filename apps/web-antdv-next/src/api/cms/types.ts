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
    SensitiveWords: {
      Default: 'Cms.Moderations.SensitiveWords',
      Create: 'Cms.Moderations.SensitiveWords.Create',
      Update: 'Cms.Moderations.SensitiveWords.Update',
      Delete: 'Cms.Moderations.SensitiveWords.Delete',
      Import: 'Cms.Moderations.SensitiveWords.Import',
      Export: 'Cms.Moderations.SensitiveWords.Export',
      OverrideLocked: 'Cms.Moderations.SensitiveWords.OverrideLocked',
    },
    Whitelists: {
      Default: 'Cms.Moderations.Whitelists',
      Create: 'Cms.Moderations.Whitelists.Create',
      Update: 'Cms.Moderations.Whitelists.Update',
      Delete: 'Cms.Moderations.Whitelists.Delete',
    },
    Sources: {
      Default: 'Cms.Moderations.Sources',
      Create: 'Cms.Moderations.Sources.Create',
      Update: 'Cms.Moderations.Sources.Update',
      Sync: 'Cms.Moderations.Sources.Sync',
      SnapshotDownload: 'Cms.Moderations.Sources.SnapshotDownload',
      Initialize: 'Cms.Moderations.Sources.Initialize',
    },
    SyncBatches: {
      Default: 'Cms.Moderations.SyncBatches',
      Apply: 'Cms.Moderations.SyncBatches.Apply',
      Ignore: 'Cms.Moderations.SyncBatches.Ignore',
      Retry: 'Cms.Moderations.SyncBatches.Retry',
      Cancel: 'Cms.Moderations.SyncBatches.Cancel',
    },
    MappingProfiles: {
      Default: 'Cms.Moderations.MappingProfiles',
      Create: 'Cms.Moderations.MappingProfiles.Create',
      Update: 'Cms.Moderations.MappingProfiles.Update',
      Delete: 'Cms.Moderations.MappingProfiles.Delete',
    },
    RuleVersions: {
      Default: 'Cms.Moderations.RuleVersions',
      Publish: 'Cms.Moderations.RuleVersions.Publish',
      PublishEmpty: 'Cms.Moderations.RuleVersions.PublishEmpty',
      Rollback: 'Cms.Moderations.RuleVersions.Rollback',
    },
    Runtime: {
      Default: 'Cms.Moderations.Runtime',
      Manage: 'Cms.Moderations.Runtime.Manage',
    },
    Test: 'Cms.Moderations.Test',
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

export enum AssetScope {
  Tenant = 0,
  Owner = 1,
  Private = 2,
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
  contentType?: string;
  status: ArticleStatus;
  currentRevisionId?: string;
  activeSnapshotId?: string;
  viewCount: number;
  actualViewCount: number;
  baseViewCount?: number;
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
  tags?: TagDto[];
  categories?: CategoryDto[];
  mainCategoryId?: string;
}

export interface ArticleRevisionDto {
  id: string;
  articleId: string;
  version: number;
  title: string;
  subTitle?: string;
  subtitle?: string;
  summary?: string;
  coverUrl?: string;
  content?: string;
  contentHtml?: string;
  contentText?: string;
  contentJson?: string;
  markdownContent?: string;
  sourceType?: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  editorUserId?: string;
  changeLog?: string;
  changeSummary?: string;
  creationTime: string;
}

export interface AdminArticleDetailDto extends AdminArticleListItemDto {
  sourceType: SourceType;
  sourceUrl?: string;
  sourceAuthor?: string;
  slug?: string;
  content?: string;
  markdownContent?: string;
  password?: string;
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
  contentType?: string;
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
  contentType?: string;
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
  baseViewCount?: number;
}

export interface AdminArticleUpdateInput {
  title: string;
  subTitle?: string;
  summary?: string;
  slug?: string;
  coverUrl?: string;
  contentType?: string;
  content?: string;
  markdownContent?: string;
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
  baseViewCount?: number;
}

export interface AdminArticleBatchIdsInput {
  ids: string[];
}

export interface AdminArticleBatchCategoriesInput {
  ids: string[];
  categoryIds: string[];
  overwrite?: boolean;
}

export interface AdminArticleBatchTagsInput {
  ids: string[];
  tagNames: string[];
  overwrite?: boolean;
}

export interface AdminArticleBatchStatusInput {
  ids: string[];
  status: ArticleStatus;
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
  articleCount?: number;
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

// ==================== Asset Folders ====================
export interface AssetFolderDto {
  id: string;
  parentId?: string;
  name: string;
  scope: AssetScope;
  ownerType?: string;
  ownerId?: string;
  ownerName?: string;
  fileCount: number;
  totalFileCount?: number;
  sorting: number;
  description?: string;
  fullPath: string;
  fullPathName: string;
  depth: number;
  childrenCount: number;
  creationTime?: string;
  children?: AssetFolderDto[];
}

export interface AssetFolderCreateDto {
  parentId?: string;
  name: string;
  scope?: AssetScope;
  ownerType?: string;
  ownerId?: string;
  ownerName?: string;
  sorting?: number;
  description?: string;
}

export interface AssetFolderUpdateDto {
  parentId?: string;
  name: string;
  sorting?: number;
  description?: string;
}

export interface AssetFolderMoveDto {
  targetParentId?: string;
}

export interface AssetFolderGetListInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  parentId?: string;
  scope?: AssetScope;
  ownerType?: string;
  ownerId?: string;
}

// ==================== Assets ====================
export interface AssetVariantDto {
  url: string;
  id: string;
  assetId: string;
  variantType: string;
  blobName: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export interface AssetDto {
  url: string;
  thumbnailUrl?: null | string;
  id: string;
  fileName: string;
  type: AssetType;
  status: AssetStatus;
  folderId?: string;
  folderName?: string;
  scope: AssetScope;
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
  ownerUserId: string;
  actorType?: string;
  actorId?: string;
  actorName?: string;
  referenceCount?: number;
  variants: AssetVariantDto[];
  creationTime: string;
}

export interface AssetCreateDto {
  fileName: string;
  type: AssetType;
  folderId?: string;
  scope?: AssetScope;
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
  folderId?: string;
  includeSubFolders?: boolean;
  scope?: AssetScope;
  actorType?: string;
  actorId?: string;
  includeReferenceCount?: boolean;
}

export interface AssetBatchMoveDto {
  assetIds: string[];
  targetFolderId?: string;
}

export interface AssetRenameDto {
  fileName: string;
}

export interface AssetBatchDeleteInput {
  assetIds: string[];
}

export interface AssetBatchDeleteResultDto {
  deletedCount: number;
  skippedCount: number;
  skippedFileNames: string[];
}

export interface AssetStatusUpdateDto {
  status: AssetStatus;
}

export interface AssetReferenceDto {
  referenceTime?: string;
  targetId: string;
  targetTitle: string;
  targetType: string;
  targetUrl?: string;
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

export interface PreviewRecommendationRuleInput {
  ruleId?: string;
  scene?: string;
  freshnessWeight?: number;
  similarityWeight?: number;
  interestWeight?: number;
  popularityWeight?: number;
  manualWeight?: number;
  resultCount?: number;
}

export interface RecommendationRulePreviewItemDto {
  articleId: string;
  title: string;
  code: string;
  coverUrl?: string;
  publishTime?: string;
  categoryName?: string;
  authorName?: string;
  viewCount: number;
  likeCount: number;
  sorting: number;
  calculatedScore: number;
  rank: number;
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

// ==================== Sensitive Words & Moderation Rules ====================
export enum ModerationScene {
  General = 0,
  ContentCreate = 10,
  ContentPublish = 20,
  CommentCreate = 30,
  MediaMetadata = 40,
  ActorProfile = 50,
  SearchQuery = 60,
}

export enum SensitiveRiskLevel {
  Low = 1,
  Medium = 2,
  High = 3,
}

export enum SensitiveWordAction {
  Pass = 1,
  Review = 2,
  Reject = 3,
}

export const SensitiveWordCategories = {
  Political: 'Political',
  Violence: 'Violence',
  Sexual: 'Sexual',
  Abuse: 'Abuse',
  Fraud: 'Fraud',
  Advertisement: 'Advertisement',
  ContactInfo: 'ContactInfo',
  Illegal: 'Illegal',
  Custom: 'Custom',
} as const;

export enum SensitiveWordSourceType {
  Git = 10,
  Http = 20,
  LocalFile = 30,
}

export enum SensitiveWordSyncMode {
  Manual = 0,
  ReviewBeforeApply = 10,
  Automatic = 20,
}

export enum SensitiveWordSourceStatus {
  Idle = 0,
  Checking = 10,
  Syncing = 20,
  Error = 30,
}

export enum SensitiveWordBatchStatus {
  Queued = 0,
  Fetching = 10,
  Parsing = 20,
  Diffing = 30,
  PendingReview = 40,
  ReadyToApply = 50,
  Applying = 60,
  Applied = 70,
  Ignored = 80,
  Superseded = 90,
  Failed = 100,
  Cancelled = 110,
}

export enum SensitiveWordChangeType {
  Unchanged = 0,
  Added = 10,
  Updated = 20,
  Removed = 30,
  Conflict = 40,
}

export enum SensitiveWordApplyStatus {
  Pending = 0,
  Applied = 10,
  Skipped = 20,
  Failed = 30,
}

export enum SensitiveWordRuleVersionStatus {
  Draft = 0,
  Ready = 10,
  Active = 20,
  Archived = 30,
}

export enum SensitiveWordActivationAction {
  Initial = 0,
  Publish = 10,
  Rollback = 20,
  Bootstrap = 30,
}

export enum ModerationTestTarget {
  CurrentPublished = 0,
  Draft = 1,
  Version = 2,
}

export interface SensitiveWordDto {
  id: string;
  word: string;
  normalizedWord?: string;
  category: string;
  riskLevel: SensitiveRiskLevel;
  action: SensitiveWordAction;
  scene?: ModerationScene;
  isEnabled: boolean;
  isRegex: boolean;
  isManual?: boolean;
  isLocked?: boolean;
  sourceCount?: number;
  remark?: string;
  creationTime: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

export interface CreateSensitiveWordInput {
  word: string;
  category: string;
  riskLevel?: SensitiveRiskLevel;
  action?: SensitiveWordAction;
  scene?: ModerationScene;
  isRegex?: boolean;
  isLocked?: boolean;
  remark?: string;
}

export interface UpdateSensitiveWordInput {
  category: string;
  riskLevel: SensitiveRiskLevel;
  action: SensitiveWordAction;
  scene?: ModerationScene;
  isRegex: boolean;
  isLocked?: boolean;
  remark?: string;
}

export interface GetSensitiveWordsInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  category?: string;
  riskLevel?: SensitiveRiskLevel;
  scene?: ModerationScene;
  isEnabled?: boolean;
  isLocked?: boolean;
  isManual?: boolean;
}

export interface SensitiveWordBatchImportInput {
  content: string;
  defaultCategory?: string;
  defaultRiskLevel?: SensitiveRiskLevel;
  defaultAction?: SensitiveWordAction;
  defaultScene?: ModerationScene;
  conflictStrategy?: 'Skip' | 'Overwrite';
  overrideLocked?: boolean;
}

export interface BatchImportResultDto {
  totalCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  errorMessages: string[];
}

export interface SensitiveWordExportDto {
  word: string;
  category: string;
  riskLevel: string;
  action: string;
  scene?: string;
  isEnabled: boolean;
  remark?: string;
}

export interface SensitiveWordWhitelistDto {
  id: string;
  text: string;
  normalizedText?: string;
  scene?: ModerationScene;
  isEnabled: boolean;
  remark?: string;
  creationTime: string;
  creatorId?: string;
  lastModificationTime?: string;
  lastModifierId?: string;
}

export interface CreateSensitiveWordWhitelistInput {
  text: string;
  scene?: ModerationScene;
  remark?: string;
}

export interface UpdateSensitiveWordWhitelistInput {
  scene?: ModerationScene;
  remark?: string;
}

export interface GetSensitiveWordWhitelistsInput extends PagedAndSortedResultRequestDto {
  keyword?: string;
  scene?: ModerationScene;
  isEnabled?: boolean;
}

// ----------------- Source -----------------
export interface SensitiveWordSourceGetListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
  sourceType?: SensitiveWordSourceType;
  isEnabled?: boolean;
}

export interface SensitiveWordSourceDto {
  id: string;
  code: string;
  name: string;
  sourceType: SensitiveWordSourceType;
  sourceUri: string;
  branch?: string;
  priority: number;
  isEnabled: boolean;
  autoSync: boolean;
  syncMode: SensitiveWordSyncMode;
  status: SensitiveWordSourceStatus;
  lastCheckedVersion?: string;
  lastFetchedVersion?: string;
  lastAppliedVersion?: string;
  lastCheckTime?: string;
  lastFetchTime?: string;
  lastApplyTime?: string;
  creationTime: string;
}

export interface SensitiveWordSourceDetailDto extends SensitiveWordSourceDto {
  fileManifestJson?: string;
  mappingProfileId?: string;
  checkIntervalSeconds: number;
  configurationRevision: number;
  lastFetchedContentHash?: string;
  lastAppliedSemanticHash?: string;
  lastErrorCode?: string;
  errorMessage?: string;
  license?: string;
  licenseUri?: string;
  attribution?: string;
  repositoryName?: string;
}

export interface SensitiveWordSourceCreateInput {
  code: string;
  name: string;
  sourceType: SensitiveWordSourceType;
  sourceUri: string;
  branch?: string;
  fileManifestJson?: string;
  mappingProfileId?: string;
  priority?: number;
  isEnabled?: boolean;
  autoSync?: boolean;
  syncMode?: SensitiveWordSyncMode;
  checkIntervalSeconds?: number;
}

export interface SensitiveWordSourceUpdateInput {
  name: string;
  sourceUri: string;
  branch?: string;
  fileManifestJson?: string;
  mappingProfileId?: string;
  priority?: number;
  autoSync?: boolean;
  syncMode?: SensitiveWordSyncMode;
  checkIntervalSeconds?: number;
  license?: string;
  licenseUri?: string;
  attribution?: string;
  repositoryName?: string;
}

export interface SourceCheckResultDto {
  hasChanges: boolean;
  latestVersion?: string;
  message?: string;
}

export interface SensitiveWordSourceSnapshotDto {
  id: string;
  sourceId: string;
  sourceVersion: string;
  contentHash: string;
  manifestHash: string;
  storageKey: string;
  totalBytes: number;
  fileCount: number;
  fetchedTime: string;
}

// ----------------- Mapping Profiles -----------------
export interface SensitiveWordMappingProfileGetListInput extends PagedAndSortedResultRequestDto {
  filter?: string;
}

export interface SensitiveWordMappingProfileDto {
  id: string;
  code: string;
  name: string;
  revision: number;
  defaultRiskLevel: SensitiveRiskLevel;
  defaultAction: SensitiveWordAction;
  defaultScene?: ModerationScene;
  remark?: string;
  creationTime: string;
}

export interface SensitiveWordMappingProfileDetailDto extends SensitiveWordMappingProfileDto {
  categoryMappingsJson?: string;
}

export interface SensitiveWordMappingProfileCreateInput {
  code: string;
  name: string;
  categoryMappingsJson?: string;
  defaultRiskLevel?: SensitiveRiskLevel;
  defaultAction?: SensitiveWordAction;
  defaultScene?: ModerationScene;
  remark?: string;
}

export interface SensitiveWordMappingProfileUpdateInput {
  name: string;
  categoryMappingsJson?: string;
  defaultRiskLevel?: SensitiveRiskLevel;
  defaultAction?: SensitiveWordAction;
  defaultScene?: ModerationScene;
  remark?: string;
}

export interface MappingProfileValidateResultDto {
  isValid: boolean;
  mappingCount: number;
  errors: string[];
}

// ----------------- Sync Batches -----------------
export interface SensitiveWordSyncBatchGetListInput extends PagedAndSortedResultRequestDto {
  sourceId?: string;
  status?: SensitiveWordBatchStatus;
}

export interface SensitiveWordSyncBatchDto {
  id: string;
  sourceId: string;
  status: SensitiveWordBatchStatus;
  sourceVersion: string;
  contentHash: string;
  semanticHash: string;
  totalCount: number;
  addedCount: number;
  updatedCount: number;
  removedCount: number;
  conflictCount: number;
  requiresReview: boolean;
  creationTime: string;
}

export interface SensitiveWordSyncBatchDetailDto extends SensitiveWordSyncBatchDto {
  snapshotId?: string;
  sourceConfigurationRevision: number;
  mappingRevision: number;
  operationId?: string;
  stage?: string;
  reviewedUserId?: string;
  reviewedTime?: string;
  reviewRemark?: string;
  appliedUserId?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SensitiveWordSyncItemGetListInput extends PagedAndSortedResultRequestDto {
  changeType?: SensitiveWordChangeType;
  hasConflict?: boolean;
}

export interface SensitiveWordSyncItemDto {
  id: string;
  batchId: string;
  sourceKey: string;
  word: string;
  normalizedWord: string;
  isRegex: boolean;
  locationEvidence?: string;
  oldSourceCategory?: string;
  newSourceCategory?: string;
  suggestedRiskLevel: SensitiveRiskLevel;
  suggestedAction: SensitiveWordAction;
  suggestedScene?: ModerationScene;
  changeType: SensitiveWordChangeType;
  hasConflict: boolean;
  conflictReason?: string;
  applyStatus: SensitiveWordApplyStatus;
  sensitiveWordId?: string;
}

export interface SensitiveWordSyncBatchIgnoreInput {
  remark?: string;
}

// ----------------- Rule Versions -----------------
export interface SensitiveWordRuleVersionGetListInput extends PagedAndSortedResultRequestDto {
  status?: SensitiveWordRuleVersionStatus;
}

export interface SensitiveWordRuleVersionDto {
  id: string;
  version: number;
  contentHash: string;
  status: SensitiveWordRuleVersionStatus;
  wordCount: number;
  whitelistCount: number;
  isActive: boolean;
  firstPublishedTime?: string;
  remark?: string;
  creationTime: string;
}

export interface SensitiveWordRuleVersionDetailDto extends SensitiveWordRuleVersionDto {
  draftRevision: number;
  normalizerVersion: string;
  engineFormatVersion: string;
  sourceVersionsJson?: string;
  firstPublishedUserId?: string;
  errorMessage?: string;
}

export interface SensitiveWordRulePreviewDto {
  currentDraftRevision: number;
  lastPublishedDraftRevision: number;
  totalWords: number;
  totalRegexWords: number;
  totalWhitelists: number;
  contentHash: string;
  hasUnpublishedChanges: boolean;
  activeVersion?: string;
}

export interface SensitiveWordRulePublishInput {
  remark?: string;
  operationId?: string;
}

export interface SensitiveWordRuleRollbackInput {
  reason: string;
  operationId?: string;
}

export interface SensitiveWordRuleActivationDto {
  id: string;
  toVersionId: string;
  fromVersionId?: string;
  activationSequence: number;
  action: SensitiveWordActivationAction;
  contentHash: string;
  activatedTime: string;
  reason?: string;
  operationId?: string;
  operatorUserId?: string;
}

// ----------------- Runtime & Rule Engine -----------------
export interface SensitiveWordRuntimeNodeDto {
  nodeName: string;
  processId: number;
  status: string;
  lastReloadTime?: string;
  isReady: boolean;
}

export interface SensitiveWordRuntimeDto {
  scopeKey: string;
  tenantId?: string;
  currentRuleVersionId?: string;
  version: string;
  ruleVersionNumber: number;
  activationSequence: number;
  draftRevision: number;
  wordCount: number;
  whitelistCount: number;
  loadedTime?: string;
  isReady: boolean;
  lastReloadSuccess: boolean;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  buildDurationMs: number;
  nodes: SensitiveWordRuntimeNodeDto[];
}

export interface ModerationRuleTestInput {
  text: string;
  scene?: ModerationScene;
  testTarget?: ModerationTestTarget;
  versionId?: string;
  expectedDraftRevision?: number;
}

export interface SensitiveWordHitDto {
  sensitiveWordId: string;
  word: string;
  category: string;
  riskLevel: SensitiveRiskLevel;
  action: SensitiveWordAction;
  startIndex: number;
  length: number;
}

export interface ModerationRuleTestResultDto {
  decision: ModerationDecision;
  riskLevel: ContentRiskLevel;
  score: number;
  ruleVersion: string;
  elapsedMilliseconds: number;
  hits: SensitiveWordHitDto[];
  versionId?: string;
  activationSequence?: number;
  draftRevision?: number;
  runtimeStatus?: string;
}

export interface SensitiveWordRuntimeStateDto {
  version: string;
  wordCount: number;
  whitelistCount: number;
  lastReloadTime?: string;
  lastReloadSuccess: boolean;
  lastErrorMessage?: string;
  currentRuleVersionId?: string;
  activationSequence?: number;
  draftRevision?: number;
  runtimeStatus?: string;
  nodeName?: string;
  processId?: number;
}


