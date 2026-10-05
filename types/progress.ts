export interface ProgressUser {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface AdminProgress {
  _id: string;
  user: ProgressUser | string | null;
  date: string;
  mood?: number;
  energyLevel?: number;
  stressLevel?: number;
  sleepHours?: number;
  sleepQuality?: number;
  waterIntakeLiters?: number;
  steps?: number;
  exerciseMinutes?: number;
  yogaMinutes?: number;
  meditationMinutes?: number;
  weightKg?: number;
  notes?: string;
  completedActivities?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ProgressPagination {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ProgressListResponse {
  items: AdminProgress[];
  pagination: ProgressPagination;
}

export interface ProgressStats {
  total?: number;
  averageMood?: number;
  averageEnergyLevel?: number;
  averageStressLevel?: number;
  averageSleepHours?: number;
  averageSleepQuality?: number;
  averageWaterIntakeLiters?: number;
  averageSteps?: number;
  averageExerciseMinutes?: number;
  averageYogaMinutes?: number;
  averageMeditationMinutes?: number;
  averageWeightKg?: number;
  [key: string]: unknown;
}

export interface ProgressFormValues {
  date: string;
  mood: string;
  energyLevel: string;
  stressLevel: string;
  sleepHours: string;
  sleepQuality: string;
  waterIntakeLiters: string;
  steps: string;
  exerciseMinutes: string;
  yogaMinutes: string;
  meditationMinutes: string;
  weightKg: string;
  notes: string;
  completedActivities: string[];
}
a