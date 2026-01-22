export interface Community {
  id: string;
  name: string;
  description: string;
  members: number;
  posts: number;
  visibility: "public" | "private";
  postingRestrictions: "all_members" | "admin_only";
  createdAt: string;
  updatedAt?: string;
  categoryId?: string;
  categoryName?: string; // Nome da categoria associada
  icon?: string; // Emoji ou ícone para a comunidade
}

export interface CommunityForm {
  name: string;
  description: string;
  visibility: "public" | "private";
  postingRestrictions: "all_members" | "admin_only";
  categoryId?: string;
  icon?: string; // Emoji ou ícone para a comunidade
  ownerId?: string;
  isActive?: boolean;
  isPrivate?: boolean;
  postingRestrictedToMembers?: boolean;
  location?: string;
  tags?: string[];
  contactEmail?: string;
  contactPhone?: string;
  websiteUrl?: string;
  socialLinks?: any;
  meetingDetails?: string;
  welcomeMessage?: string;
  rules?: string;
  moderationPolicy?: string;
}

export interface SupabaseCommunity {
  id: string;
  name: string;
  description: string;
  members: number;
  posts: number;
  visibility: string;
  posting_restrictions: string;
  created_at: string;
  updated_at: string;
  category_id?: string;
  icon?: string; // Emoji ou ícone para a comunidade
}

// Add this missing function
export function mapCommunityFromSupabase(community: SupabaseCommunity): Community {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    members: community.members || 0,
    posts: community.posts || 0,
    visibility: community.visibility as "public" | "private",
    postingRestrictions: community.posting_restrictions as "all_members" | "admin_only",
    createdAt: community.created_at,
    updatedAt: community.updated_at,
    categoryId: community.category_id,
    icon: community.icon
  };
}

export function mapFromSupabase(community: SupabaseCommunity): Community {
  return {
    id: community.id,
    name: community.name,
    description: community.description,
    members: community.members || 0,
    posts: community.posts || 0,
    visibility: community.visibility as "public" | "private",
    postingRestrictions: community.posting_restrictions as "all_members" | "admin_only",
    createdAt: community.created_at,
    updatedAt: community.updated_at,
    categoryId: community.category_id,
    icon: community.icon
  };
}

export function mapToSupabase(community: Community | CommunityForm): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  if ('name' in community) mapped.name = community.name;
  if ('description' in community) mapped.description = community.description;
  
  if ('visibility' in community) mapped.visibility = community.visibility;
  if ('postingRestrictions' in community) mapped.posting_restrictions = community.postingRestrictions;
  if ('icon' in community) mapped.icon = community.icon;
  
  return mapped;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  presenter: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  location?: string;
  link?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface EventForm {
  title: string;
  description: string;
  presenter: string;
  date: Date;
  timeStart: string;
  timeEnd: string;
  location?: string;
  link?: string;
}

export interface SupabaseEvent {
  id: string;
  title: string;
  description: string;
  presenter: string;
  date: string;
  time_start: string;
  time_end: string;
  location?: string;
  link?: string;
  created_at: string;
  updated_at: string;
}

export function mapEventFromSupabase(event: SupabaseEvent): Event {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    presenter: event.presenter,
    date: new Date(event.date),
    timeStart: event.time_start,
    timeEnd: event.time_end,
    location: event.location,
    link: event.link,
    createdAt: event.created_at,
    updatedAt: event.updated_at
  };
}

export function mapEventToSupabase(event: Event | EventForm): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  if ('title' in event) mapped.title = event.title;
  if ('description' in event) mapped.description = event.description;
  if ('presenter' in event) mapped.presenter = event.presenter;
  if ('date' in event) mapped.date = event.date.toISOString();
  if ('timeStart' in event) mapped.time_start = event.timeStart;
  if ('timeEnd' in event) mapped.time_end = event.timeEnd;
  if ('location' in event) mapped.location = event.location;
  if ('link' in event) mapped.link = event.link;
  
  return mapped;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  order_index?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CategoryForm {
  name: string;
  slug: string;
}

export interface SupabaseCategory {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export function mapCategoryFromSupabase(category: SupabaseCategory): Category {
  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    createdAt: category.created_at,
    updatedAt: category.updated_at
  };
}

export function mapCategoryToSupabase(category: Category | CategoryForm): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  if ('name' in category) mapped.name = category.name;
  if ('slug' in category) mapped.slug = category.slug;
  
  return mapped;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'post' | 'comment';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReportForm {
  targetType: 'user' | 'post' | 'comment';
  targetId: string;
  reason: string;
}

export interface SupabaseReport {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at?: string;
  resolved_by?: string;
}

export function mapReportFromSupabase(report: SupabaseReport): Report {
  return {
    id: report.id,
    reporterId: report.reporter_id,
    targetId: report.target_id,
    targetType: report.target_type as 'user' | 'post' | 'comment',
    reason: report.reason,
    status: report.status as 'pending' | 'approved' | 'rejected',
    createdAt: report.created_at,
    resolvedAt: report.resolved_at,
    resolvedBy: report.resolved_by
  };
}

export function mapReportToSupabase(report: Report | ReportForm): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  if ('reporterId' in report) mapped.reporter_id = report.reporterId;
  if ('targetType' in report) mapped.target_type = report.targetType;
  if ('targetId' in report) mapped.target_id = report.targetId;
  if ('reason' in report) mapped.reason = report.reason;
  if ('status' in report) mapped.status = report.status;
  if ('resolvedAt' in report && report.resolvedAt) mapped.resolved_at = report.resolvedAt;
  if ('resolvedBy' in report && report.resolvedBy) mapped.resolved_by = report.resolvedBy;
  
  return mapped;
}

export interface UserRanking {
  id: string;
  userId: string;
  points: number;
  level: number;
  postsCount: number;
  commentsCount: number;
  likesReceived: number;
  createdAt: string;
  updatedAt?: string;
}

export interface SupabaseUserRanking {
  id: string;
  user_id: string;
  points: number;
  level: number;
  posts_count: number;
  comments_count: number;
  likes_received: number;
  created_at: string;
  updated_at: string;
}

export function mapUserRankingFromSupabase(ranking: SupabaseUserRanking): UserRanking {
  return {
    id: ranking.id,
    userId: ranking.user_id,
    points: ranking.points,
    level: ranking.level,
    postsCount: ranking.posts_count,
    commentsCount: ranking.comments_count,
    likesReceived: ranking.likes_received,
    createdAt: ranking.created_at,
    updatedAt: ranking.updated_at
  };
}

export function mapUserRankingToSupabase(ranking: UserRanking): Record<string, any> {
  return {
    user_id: ranking.userId,
    points: ranking.points,
    level: ranking.level,
    posts_count: ranking.postsCount,
    comments_count: ranking.commentsCount,
    likes_received: ranking.likesReceived
  };
}

export interface Post {
  id: string;
  title: string;
  content: string;
  userId: string;
  categoryId?: string;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  isTrending: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostForm {
  title: string;
  content: string;
  categoryId?: string;
}

export interface SupabasePost {
  id: string;
  title: string;
  content: string;
  user_id: string;
  category_id?: string;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

export const mapPostFromSupabase = (post: any): Post => {
  return {
    id: post.id,
    title: post.title || post.content?.substring(0, 50) || 'Sem título',
    content: post.content || '',
    userId: post.user_id,
    categoryId: post.category_id,
    likesCount: typeof post.likes_count === 'number' ? post.likes_count : 
               (post.likes && typeof post.likes === 'number' ? post.likes : 0),
    commentsCount: typeof post.comments_count === 'number' ? post.comments_count : 
                  (post.comments && typeof post.comments === 'number' ? post.comments : 0),
    viewsCount: typeof post.views_count === 'number' ? post.views_count : 
               (post.views && typeof post.views === 'number' ? post.views : 0),
    isTrending: post.is_trending || false,
    createdAt: post.created_at,
    updatedAt: post.updated_at
  };
};

export function mapPostToSupabase(post: Post | PostForm): Record<string, any> {
  const mapped: Record<string, any> = {};
  
  if ('title' in post) mapped.title = post.title;
  if ('content' in post) mapped.content = post.content;
  if ('userId' in post) mapped.user_id = post.userId;
  if ('categoryId' in post && post.categoryId) mapped.category_id = post.categoryId;
  if ('likesCount' in post) mapped.likes_count = post.likesCount;
  if ('commentsCount' in post) mapped.comments_count = post.commentsCount;
  if ('viewsCount' in post) mapped.views_count = post.viewsCount;
  if ('isTrending' in post) mapped.is_trending = post.isTrending;
  
  return mapped;
}
