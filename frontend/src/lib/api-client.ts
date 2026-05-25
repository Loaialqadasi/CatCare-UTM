// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import type {
  User,
  Cat,
  EmergencyReport,
  PaginatedResponse,
  LoginFormData,
  RegisterFormData,
  CreateCatFormData,
  CreateEmergencyFormData,
  CatFilters,
  EmergencyFilters,
  EmergencyStatus,
  Donation,
  DonationSummary,
  CreateDonationFormData,
  DonationFilters,
  CareHistoryEntry,
} from './types';

// API URL — env var with hardcoded production fallback so the app
// always connects to the real backend even if Vercel env vars aren't set
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://catcare-backend.onrender.com/api';
if (typeof window !== 'undefined' && !API_BASE) {
  console.error('API URL is not configured. API calls will fail.');
}

// --- Raw API response types ---

interface RawUser {
  id: number;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface RawCat {
  id: number;
  nickname: string;
  description: string | null;
  photoUrl: string | null;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  healthStatus: string;
  ownershipTag: string;
  createdByUserId: number | null;
  createdAt: string;
  updatedAt: string;
}

interface RawEmergency {
  id: number;
  catId: number | null;
  title: string;
  description: string;
  emergencyType: string;
  priority: string;
  status: string;
  locationName: string;
  latitude: number | null;
  longitude: number | null;
  reportedByUserId: number | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  cat: { id: number; nickname: string } | null;
}

interface RawDonation {
  id: number;
  donorName: string;
  donorEmail: string;
  amount: number;
  receiptUrl: string | null;
  note: string | null;
  status: string;
  rejectionReason: string | null;
  donorUserId: number | null;
  reviewedByUserId: number | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RawCareHistory {
  id: number;
  catId: number;
  careType: string;
  description: string;
  performedBy: string;
  performedByUserId: number | null;
  createdAt: string;
}

// --- Normalizers ---

function normalizeCat(raw: RawCat): Cat {
  return {
    id: String(raw.id),
    nickname: raw.nickname,
    description: raw.description,
    photoUrl: raw.photoUrl,
    locationName: raw.locationName,
    latitude: raw.latitude != null ? Number(raw.latitude) : raw.latitude,
    longitude: raw.longitude != null ? Number(raw.longitude) : raw.longitude,
    healthStatus: raw.healthStatus as Cat['healthStatus'],
    ownershipTag: raw.ownershipTag as Cat['ownershipTag'],
    createdByUserId: raw.createdByUserId != null ? String(raw.createdByUserId) : raw.createdByUserId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeEmergency(raw: RawEmergency): EmergencyReport {
  return {
    id: String(raw.id),
    catId: raw.catId != null ? String(raw.catId) : raw.catId,
    title: raw.title,
    description: raw.description,
    emergencyType: raw.emergencyType as EmergencyReport['emergencyType'],
    priority: raw.priority as EmergencyReport['priority'],
    status: raw.status as EmergencyReport['status'],
    locationName: raw.locationName,
    latitude: raw.latitude != null ? Number(raw.latitude) : raw.latitude,
    longitude: raw.longitude != null ? Number(raw.longitude) : raw.longitude,
    reportedByUserId: raw.reportedByUserId != null ? String(raw.reportedByUserId) : raw.reportedByUserId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    resolvedAt: raw.resolvedAt,
    cat: raw.cat ? { id: String(raw.cat.id), nickname: raw.cat.nickname } : raw.cat,
  };
}

function normalizeDonation(raw: RawDonation): Donation {
  return {
    id: String(raw.id),
    donorName: raw.donorName,
    donorEmail: raw.donorEmail,
    amount: Number(raw.amount),
    receiptUrl: raw.receiptUrl,
    note: raw.note,
    status: raw.status as Donation['status'],
    rejectionReason: raw.rejectionReason,
    donorUserId: raw.donorUserId != null ? String(raw.donorUserId) : raw.donorUserId,
    reviewedByUserId: raw.reviewedByUserId != null ? String(raw.reviewedByUserId) : raw.reviewedByUserId,
    reviewedAt: raw.reviewedAt,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeUser(raw: RawUser): User {
  return {
    id: String(raw.id),
    fullName: raw.fullName,
    email: raw.email,
    role: raw.role as User['role'],
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function normalizeCareHistory(raw: RawCareHistory): CareHistoryEntry {
  return {
    id: String(raw.id),
    catId: String(raw.catId),
    careType: raw.careType as CareHistoryEntry['careType'],
    description: raw.description,
    performedBy: raw.performedBy,
    performedByUserId: raw.performedByUserId != null ? String(raw.performedByUserId) : raw.performedByUserId,
    createdAt: raw.createdAt,
  };
}

// --- CRIT-1 Fix: Use credentials: 'include' for HttpOnly cookies ---
// MED-4 Fix: Global 401 interceptor — auto-logout on expired sessions
// CRIT-4 Fix: CSRF token support for state-changing requests

import { toast } from 'sonner';

// Lazy import store to avoid circular dependency
let _storeLogout: (() => void) | null = null;
async function getStoreLogout() {
  if (!_storeLogout) {
    // Dynamic import to avoid circular deps at module load time
    const mod = await import('./store');
    _storeLogout = () => mod.useAppStore.getState().logout();
  }
  return _storeLogout;
}

// CRIT-4: Fetch and cache CSRF token for state-changing requests
let _csrfToken: string | null = null;

async function ensureCsrfToken(): Promise<string> {
  if (_csrfToken) return _csrfToken;
  try {
    const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
    const json = await res.json();
    if (json.success && json.data?.token) {
      _csrfToken = json.data.token;
      return _csrfToken as string;
    }
  } catch {
    // CSRF token fetch failed — will retry on next request
  }
  return '';
}

function isStateChanging(method?: string): boolean {
  return method === 'POST' || method === 'PATCH' || method === 'PUT' || method === 'DELETE';
}

async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const headers = new Headers(options?.headers);

  // CRIT-4: Attach CSRF token to state-changing requests
  if (isStateChanging(options?.method)) {
    const token = await ensureCsrfToken();
    if (token) {
      headers.set('X-CSRF-Token', token);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // CRIT-1: Send HttpOnly cookies automatically
  });

  // CRIT-4: If CSRF validation failed, refresh token and don't retry automatically
  if (res.status === 403) {
    const json = await res.clone().json().catch(() => ({}));
    if (json.error?.code === 'CSRF_INVALID') {
      _csrfToken = null; // Clear cached token
      toast.error('Security token expired. Please try again.');
      throw new Error('CSRF_TOKEN_EXPIRED');
    }
  }

  // MED-4: Global 401 interceptor
  if (res.status === 401) {
    getStoreLogout().then(fn => fn());
    toast.error('Your session has expired. Please log in again.');
    throw new Error('SESSION_EXPIRED');
  }
  return res;
}

// --- auth ---

export async function login(data: LoginFormData): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Login failed');
  return { user: normalizeUser(json.data.user) };
}

export async function register(data: RegisterFormData): Promise<{ user: User }> {
  const res = await apiFetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) {
    // Extract specific field validation errors for better UX
    const fieldErrors = json.error?.details?.issues?.fieldErrors;
    if (fieldErrors) {
      const messages = Object.values(fieldErrors).flat().filter(Boolean).join(', ');
      throw new Error(messages || json.error?.message || 'Registration failed');
    }
    throw new Error(json.error?.message || 'Registration failed');
  }
  return { user: normalizeUser(json.data.user) };
}

export async function getMe(): Promise<User> {
  const res = await apiFetch(`${API_BASE}/auth/me`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to get user');
  return normalizeUser(json.data);
}

export async function logout(): Promise<void> {
  _csrfToken = null; // Clear cached CSRF token on logout
  await apiFetch(`${API_BASE}/auth/logout`, { method: 'POST' });
}

// --- cats ---

export async function fetchCats(
  filters: CatFilters = {},
): Promise<PaginatedResponse<Cat>> {
  const { page = 1, pageSize = 10, search = '', healthStatus = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (search) params.set('search', search);
  if (healthStatus) params.set('healthStatus', healthStatus);
  const res = await apiFetch(`${API_BASE}/cats?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cats');
  return {
    items: json.data.items.map(normalizeCat),
    pagination: json.data.pagination,
  };
}

export async function fetchCatById(id: string): Promise<Cat> {
  const res = await apiFetch(`${API_BASE}/cats/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cat');
  return normalizeCat(json.data);
}

export async function createCat(
  data: CreateCatFormData,
): Promise<Cat> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      formData.append(key, String(value));
    }
  });
  const res = await apiFetch(`${API_BASE}/cats`, {
    method: 'POST',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to create cat');
  return normalizeCat(json.data);
}

// --- emergencies ---

export async function fetchEmergencies(
  filters: EmergencyFilters = {},
): Promise<PaginatedResponse<EmergencyReport>> {
  const { page = 1, pageSize = 10, status = '', priority = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set('status', status);
  if (priority) params.set('priority', priority);
  const res = await apiFetch(`${API_BASE}/emergencies?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergencies');
  return {
    items: json.data.items.map(normalizeEmergency),
    pagination: json.data.pagination,
  };
}

export async function fetchEmergencyById(id: string): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergency');
  return normalizeEmergency(json.data);
}

export async function fetchPriorityFeed(): Promise<EmergencyReport[]> {
  const res = await apiFetch(`${API_BASE}/emergencies/priority-feed`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch priority feed');
  return json.data.map(normalizeEmergency);
}

export async function createEmergency(
  data: CreateEmergencyFormData,
): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to create emergency');
  return normalizeEmergency(json.data);
}

export async function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
): Promise<EmergencyReport> {
  const res = await apiFetch(`${API_BASE}/emergencies/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update status');
  return normalizeEmergency(json.data);
}

// --- donations ---

export async function fetchDonations(
  filters: DonationFilters = {},
): Promise<PaginatedResponse<Donation>> {
  const { page = 1, pageSize = 10, status = '' } = filters;

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  if (status) params.set('status', status);
  const res = await apiFetch(`${API_BASE}/donations?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donations');
  return {
    items: json.data.items.map(normalizeDonation),
    pagination: json.data.pagination,
  };
}

export async function fetchMyDonations(): Promise<PaginatedResponse<Donation>> {
  const res = await apiFetch(`${API_BASE}/donations/my`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donations');
  return {
    items: json.data.items.map(normalizeDonation),
    pagination: json.data.pagination,
  };
}

export async function fetchDonationById(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donation');
  return normalizeDonation(json.data);
}

export async function fetchDonationSummary(): Promise<DonationSummary> {
  const res = await apiFetch(`${API_BASE}/donations/summary`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donation summary');
  return json.data;
}

export async function createDonation(
  data: CreateDonationFormData,
): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to create donation');
  return normalizeDonation(json.data);
}

export async function reviewDonation(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/review`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to review donation');
  return normalizeDonation(json.data);
}

export async function approveDonation(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to approve donation');
  return normalizeDonation(json.data);
}

export async function rejectDonation(id: string, rejectionReason: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/reject`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'rejected', rejectionReason }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to reject donation');
  return normalizeDonation(json.data);
}

// --- care history ---

export async function fetchCareHistory(catId: string): Promise<CareHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE}/cats/${catId}/care-history`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch care history');
  return json.data.map(normalizeCareHistory);
}
