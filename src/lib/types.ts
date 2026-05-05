// --- user ---
export type UserRole = 'student' | 'volunteer' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

// --- cats ---
export type HealthStatus = 'healthy' | 'needs_attention' | 'injured' | 'unknown';
export type OwnershipTag = 'stray' | 'adopted' | 'campus_managed' | 'unknown';

export interface Cat {
  id: string;
  nickname: string;
  description: string;
  photoUrl: string;
  locationName: string;
  latitude: number;
  longitude: number;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

// --- emergencies ---
export type EmergencyType = 'injury' | 'sickness' | 'missing' | 'feeding_urgent' | 'danger' | 'other';
export type Priority = 'low' | 'medium' | 'high' | 'critical';
export type EmergencyStatus = 'open' | 'in_progress' | 'resolved' | 'cancelled';

export interface EmergencyReport {
  id: string;
  catId: string | null;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  status: EmergencyStatus;
  locationName: string;
  latitude: number;
  longitude: number;
  reportedByUserId: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  cat: { id: string; nickname: string } | null;
}

// --- api responses ---
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

// --- views / pages ---
export type AppView =
  | 'login'
  | 'register'
  | 'dashboard'
  | 'cats'
  | 'cat-detail'
  | 'create-cat'
  | 'emergencies'
  | 'emergency-detail'
  | 'create-emergency'
  | 'profile';

// --- form data ---
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  fullName: string;
  email: string;
  password: string;
}

export interface CreateCatFormData {
  nickname: string;
  description: string;
  photoUrl?: string;
  locationName: string;
  latitude: number;
  longitude: number;
  healthStatus: HealthStatus;
  ownershipTag: OwnershipTag;
}

export interface CreateEmergencyFormData {
  catId?: string;
  title: string;
  description: string;
  emergencyType: EmergencyType;
  priority: Priority;
  locationName: string;
  latitude: number;
  longitude: number;
}

// --- filters ---
export interface CatFilters {
  page?: number;
  pageSize?: number;
  search?: string;
  healthStatus?: HealthStatus | '';
}

export interface EmergencyFilters {
  page?: number;
  pageSize?: number;
  status?: EmergencyStatus | '';
  priority?: Priority | '';
}
