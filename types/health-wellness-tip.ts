export type HealthWellnessCategory =
  | "nutrition"
  | "fitness"
  | "yoga"
  | "ayurveda"
  | "mental-wellbeing"
  | "sleep"
  | "stress-management"
  | "lifestyle"
  | "preventive-care"
  | "personal-care"
  | "healthy-habits"
  | "general-wellness";

export type HealthWellnessType =
  | "tip"
  | "guide"
  | "lesson"
  | "routine"
  | "exercise"
  | "practice"
  | "warning"
  | "educational";

export type HealthWellnessDifficulty = "beginner" | "intermediate" | "advanced";

export interface HealthWellnessImage {
  enabled: boolean;
  url?: string;
  altText?: string;
  caption?: string;
  credit?: string;
}

export interface HealthWellnessSource {
  name?: string;
  url?: string;
  accessedAt?: string | null;
}

export interface HealthWellnessReference {
  title: string;
  source?: string;
  url?: string;
  publishedDate?: string | null;
}

export interface HealthWellnessReviewer {
  name?: string;
  qualification?: string;
  reviewedAt?: string | null;
}

export interface HealthWellnessAction {
  enabled: boolean;
  label?: string;
  route?: string;
}

export interface HealthWellnessTip {
  _id: string;

  title: string;
  shortDescription: string;
  content: string;

  highlights: string[];

  category: HealthWellnessCategory;
  type: HealthWellnessType;
  tags: string[];

  image: HealthWellnessImage;
  thumbnailUrl?: string;

  source: HealthWellnessSource;

  references: HealthWellnessReference[];

  disclaimer?: string;
  safetyNote?: string;

  reviewed: boolean;
  reviewedBy?: HealthWellnessReviewer | null;

  readTimeMinutes: number;
  difficulty: HealthWellnessDifficulty;

  isActive: boolean;
  featured: boolean;
  priority: number;

  startDate: string;
  endDate: string | null;

  action: HealthWellnessAction;

  createdAt: string;
  updatedAt: string;
}

export interface HealthWellnessTipFormValues {
  title: string;
  shortDescription: string;
  content: string;

  highlights: string[];

  category: HealthWellnessCategory;
  type: HealthWellnessType;
  tags: string[];

  imageEnabled: boolean;
  imageUrl: string;
  imageAltText: string;
  imageCaption: string;
  imageCredit: string;

  thumbnailUrl: string;

  sourceName: string;
  sourceUrl: string;
  sourceAccessedAt: string;

  references: HealthWellnessReference[];

  disclaimer: string;
  safetyNote: string;

  reviewed: boolean;
  reviewerName: string;
  reviewerQualification: string;
  reviewedAt: string;

  readTimeMinutes: string;
  difficulty: HealthWellnessDifficulty;

  isActive: boolean;
  featured: boolean;
  priority: string;

  startDate: string;
  endDate: string;

  actionEnabled: boolean;
  actionLabel: string;
  actionRoute: string;
}

export interface HealthWellnessTipListResponse {
  items: HealthWellnessTip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface HealthWellnessTipApiResponse {
  success: boolean;
  data: HealthWellnessTip;
  message?: string;
}

export interface HealthWellnessTipListApiResponse {
  success: boolean;
  data: HealthWellnessTipListResponse;
  message?: string;
}

export type HealthWellnessStatusFilter = "" | "active" | "inactive";

export interface HealthWellnessTipListFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: string;
  difficulty?: string;
  status?: HealthWellnessStatusFilter;
  featured?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
