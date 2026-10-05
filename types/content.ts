export type ContentType = "ayurveda" | "yoga";

export type AdminRole = "super_admin" | "admin" | "content_manager" | "support";

export interface ContentItem {
  _id: string;
  title: string;
  slug: string;
  description: string;

  shortDescription?: string;

  imageUrl?: string;
  videoUrl?: string;

  type: string;
  category: string;
  difficulty?: string;

  durationMinutes?: number;

  bestTime?: string[];
  frequency?: string;
  duration?: string;
  preparation?: string;
  usage?: string;
  howToUse?: string[];

  doshas?: string[];
  prakriti?: string[];

  properties?: {
    rasa?: string[];
    guna?: string[];
    virya?: string;
    vipaka?: string;
  };

  bodySystems?: string[];
  wellnessGoals?: string[];
  tags?: string[];
  benefits?: string[];
  suitableFor?: string[];

  ingredients?: {
    name?: string;
    description?: string;
    quantity?: string;
    form?: string;
  }[];

  precautions?: string[];
  contraindications?: string[];

  recommendedFor?: {
    energyLevels?: string[];
    digestion?: string[];
    stressLevels?: string[];
    sleepQualities?: string[];
    activityLevels?: string[];
    concerns?: string[];
    goalCategories?: string[];

    yogaExperience?: string[];
  };

  traditionalUseNote?: string;
  evidenceNote?: string;

  sources?: {
    title?: string;
    url?: string;
    publisher?: string;
  }[];

  equipment?: string[];
  bodyFocus?: string[];
  instructions?: string[];

  isActive: boolean;
  isFeatured: boolean;
  viewCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface ContentListResponse {
  success: boolean;
  data: {
    items: ContentItem[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    filters: {
      search: string;
      category: string | null;
      type: string | null;
      difficulty: string | null;
      isActive: boolean | null;
      isFeatured: boolean | null;
      sortBy: string;
      sortOrder: "asc" | "desc";
    };
  };
}

export interface ContentStatsResponse {
  success: boolean;
  data: {
    contentType: ContentType;
    label: string;
    total: number;
    active: number;
    inactive: number;
    featured: number;
    notFeatured: number;
  };
}

export interface CategoriesResponse {
  success: boolean;
  data: {
    category: string;
    count: number;
  }[];
}
