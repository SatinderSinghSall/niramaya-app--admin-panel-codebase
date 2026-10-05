export type GoalStatus = "active" | "paused" | "completed" | "cancelled";

export type GoalCategory =
  | "sleep"
  | "stress_management"
  | "fitness"
  | "flexibility"
  | "strength"
  | "weight_management"
  | "digestion"
  | "energy"
  | "mental_wellbeing"
  | "mobility"
  | "skin_wellness"
  | "hair_wellness"
  | "general_wellbeing"
  | "other";

export type GoalSortBy =
  | "createdAt"
  | "updatedAt"
  | "startDate"
  | "targetDate"
  | "progressPercentage"
  | "title";

export interface GoalUser {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface GoalTarget {
  value?: number | null;
  unit?: string | null;
  description?: string | null;
}

export interface GoalMilestone {
  _id?: string;
  title: string;
  targetValue?: number | null;
  completed: boolean;
  completedAt?: string | null;
}

export interface AdminGoal {
  _id: string;
  user: GoalUser | string | null;
  title: string;
  description?: string | null;
  category: GoalCategory;
  target?: GoalTarget | null;
  currentValue: number;
  progressPercentage: number;
  startDate: string;
  targetDate?: string | null;
  status: GoalStatus;
  completedAt?: string | null;
  cancellationReason?: string | null;
  milestones?: GoalMilestone[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GoalListResponse {
  items: AdminGoal[];
  pagination: GoalPagination;
}

export interface GoalStats {
  total: number;
  byStatus: Record<string, number>;
  byCategory: Array<{ category: string; count: number }>;
  activeProgress: {
    averageProgress: number;
    averageCurrentValue: number;
    count: number;
  };
  dueSoon: number;
  overdue: number;
  statusValues: GoalStatus[];
}

export interface GoalStatusForm {
  status: GoalStatus;
  reason: string;
}

export interface GoalProgressForm {
  currentValue: string;
  progressPercentage: string;
}
