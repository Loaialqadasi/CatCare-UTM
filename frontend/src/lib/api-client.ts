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
  Volunteer,
  CreateVolunteerFormData,
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
  emailVerified: boolean;
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
    emailVerified: raw.emailVerified,
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

// --- Automatic token refresh ---
// When a 401 is received (but NOT from login/register), we try to silently
// refresh the access token before logging the user out. The backend exposes
// POST /api/auth/refresh which reads the refreshToken HttpOnly cookie and
// issues a new access token cookie.

let _isRefreshing = false;

async function refreshAccessToken(): Promise<boolean> {
  if (_isRefreshing) return false; // Prevent concurrent refresh attempts
  _isRefreshing = true;
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    _isRefreshing = false;
  }
}

// Proactive refresh: refresh the access token every 12 minutes (token lasts 15 min)
let _refreshInterval: ReturnType<typeof setInterval> | null = null;

export function startTokenRefreshTimer(): void {
  stopTokenRefreshTimer(); // Clear any existing interval
  _refreshInterval = setInterval(async () => {
    const success = await refreshAccessToken();
    if (!success) {
      // Silent failure — the 401 interceptor will handle logout when needed
      console.warn('Proactive token refresh failed');
    }
  }, 12 * 60 * 1000); // 12 minutes
}

export function stopTokenRefreshTimer(): void {
  if (_refreshInterval) {
    clearInterval(_refreshInterval);
    _refreshInterval = null;
  }
}

// CRIT-4: Fetch and cache CSRF token for state-changing requests
// The CSRF token can expire or become invalid, so we need to handle
// token refresh gracefully. We cache the token but clear it on errors.
let _csrfToken: string | null = null;
let _csrfTokenPromise: Promise<string> | null = null;

export async function ensureCsrfToken(): Promise<string> {
  // Return cached token if available
  if (_csrfToken) return _csrfToken;

  // Deduplicate concurrent CSRF token requests
  if (_csrfTokenPromise) return _csrfTokenPromise;

  _csrfTokenPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/csrf-token`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && json.data?.token) {
        _csrfToken = json.data.token;
        return _csrfToken as string;
      }
    } catch {
      // CSRF token fetch failed — will retry on next request
    } finally {
      _csrfTokenPromise = null;
    }
    return '';
  })();

  return _csrfTokenPromise;
}

// Clear the cached CSRF token (called on logout or when token is invalid)
export function clearCsrfToken(): void {
  _csrfToken = null;
  _csrfTokenPromise = null;
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

  // CRIT-4: If CSRF validation failed, refresh token and retry once
  if (res.status === 403) {
    const json = await res.clone().json().catch(() => ({}));
    if (json.error?.code === 'CSRF_INVALID') {
      clearCsrfToken(); // Clear cached token
      // Retry once with a fresh CSRF token
      const freshToken = await ensureCsrfToken();
      if (freshToken) {
        const retryHeaders = new Headers(options?.headers);
        retryHeaders.set('X-CSRF-Token', freshToken);
        const retryRes = await fetch(url, {
          ...options,
          headers: retryHeaders,
          credentials: 'include',
        });
        if (retryRes.status === 401) {
          getStoreLogout().then(fn => fn());
          toast.error('Your session has expired. Please log in again.');
          throw new Error('SESSION_EXPIRED');
        }
        return retryRes;
      }
      toast.error('Security token expired. Please try again.');
      throw new Error('CSRF_TOKEN_EXPIRED');
    }
  }

  // MED-4: Global 401 interceptor with automatic token refresh
  if (res.status === 401) {
    // Don't try to refresh if this was a login/register request
    const isAuthEndpoint = url.includes('/auth/login') || url.includes('/auth/register');
    if (!isAuthEndpoint) {
      try {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
          // Retry the original request once with the new token
          const retryHeaders = new Headers(options?.headers);
          // Re-attach CSRF token for state-changing requests
          if (isStateChanging(options?.method)) {
            const freshToken = await ensureCsrfToken();
            if (freshToken) retryHeaders.set('X-CSRF-Token', freshToken);
          }
          const retryRes = await fetch(url, {
            ...options,
            headers: retryHeaders,
            credentials: 'include',
          });
          if (retryRes.status !== 401) return retryRes;
        }
      } catch {
        // Network error during refresh — don't force logout.
        // The user might just have a temporary connectivity issue.
      }
    }
    // Refresh failed or retry still returned 401 — force logout
    stopTokenRefreshTimer();
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
  clearCsrfToken(); // Clear cached CSRF token on logout
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
    if (value === undefined || value === null) return;
    // File objects must be appended directly — String() would produce "[object File]"
    if (value instanceof File) {
      formData.append(key, value);
    } else {
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

export async function updateCat(
  id: string,
  data: Partial<Omit<CreateCatFormData, 'photo'>> & { photo?: File; photoUrl?: string | null },
): Promise<Cat> {
  const formData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    // Skip undefined values — they should not be sent
    if (value === undefined) return;
    // Handle explicit null for photoUrl (photo removal) — send as empty string
    // so the backend knows the field was intentionally cleared
    if (value === null) {
      formData.append(key, '');
      return;
    }
    if (value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, String(value));
    }
  });
  const res = await apiFetch(`${API_BASE}/cats/${id}`, {
    method: 'PATCH',
    body: formData,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update cat');
  return normalizeCat(json.data);
}

export async function deleteCat(id: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/cats/${id}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to delete cat');
}

export async function restoreCat(id: string): Promise<Cat> {
  const res = await apiFetch(`${API_BASE}/cats/${id}/restore`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to restore cat');
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
  // Use FormData if there's a receipt file, otherwise JSON
  if (data.receipt) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    const res = await apiFetch(`${API_BASE}/donations`, {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create donation');
    return normalizeDonation(json.data);
  }

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
    body: JSON.stringify({ status: 'reviewed' }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to review donation');
  return normalizeDonation(json.data);
}

export async function approveDonation(id: string): Promise<Donation> {
  const res = await apiFetch(`${API_BASE}/donations/${id}/approve`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'approved' }),
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

// --- volunteers ---

export async function createVolunteer(
  data: CreateVolunteerFormData,
): Promise<Volunteer> {
  const res = await apiFetch(`${API_BASE}/volunteers`, {
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
      throw new Error(messages || json.error?.message || 'Failed to submit volunteer application');
    }
    throw new Error(json.error?.message || 'Failed to submit volunteer application');
  }
  return {
    id: String(json.data.id),
    studentName: json.data.studentName,
    studentId: json.data.studentId,
    age: Number(json.data.age),
    faculty: json.data.faculty,
    interests: json.data.interests,
    userId: json.data.userId != null ? String(json.data.userId) : null,
    status: json.data.status,
    createdAt: json.data.createdAt,
    updatedAt: json.data.updatedAt,
  };
}

export async function fetchMyVolunteerings(): Promise<Volunteer[]> {
  const res = await apiFetch(`${API_BASE}/volunteers/my`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch volunteer applications');
  return json.data.map((v: any) => ({
    id: String(v.id),
    studentName: v.studentName,
    studentId: v.studentId,
    age: Number(v.age),
    faculty: v.faculty,
    interests: v.interests,
    userId: v.userId != null ? String(v.userId) : null,
    status: v.status,
    createdAt: v.createdAt,
    updatedAt: v.updatedAt,
  }));
}

// --- admin: volunteer management ---

export async function fetchAllVolunteers(params?: { page?: number; pageSize?: number; status?: string }): Promise<PaginatedResponse<Volunteer>> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set('page', String(params.page));
  if (params?.pageSize) searchParams.set('pageSize', String(params.pageSize));
  if (params?.status) searchParams.set('status', params.status);
  const query = searchParams.toString();
  const res = await apiFetch(`${API_BASE}/volunteers${query ? `?${query}` : ''}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch volunteers');
  return {
    items: json.data.items.map((v: any) => ({
      id: String(v.id),
      studentName: v.studentName,
      studentId: v.studentId,
      age: Number(v.age),
      faculty: v.faculty,
      interests: v.interests,
      userId: v.userId != null ? String(v.userId) : null,
      status: v.status,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    })),
    pagination: json.data.pagination,
  };
}

export async function updateVolunteerStatus(id: string, status: 'approved' | 'rejected'): Promise<Volunteer> {
  const res = await apiFetch(`${API_BASE}/volunteers/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update volunteer status');
  return {
    id: String(json.data.id),
    studentName: json.data.studentName,
    studentId: json.data.studentId,
    age: Number(json.data.age),
    faculty: json.data.faculty,
    interests: json.data.interests,
    userId: json.data.userId != null ? String(json.data.userId) : null,
    status: json.data.status,
    createdAt: json.data.createdAt,
    updatedAt: json.data.updatedAt,
  };
}

// --- care history ---

export async function fetchCareHistory(catId: string): Promise<CareHistoryEntry[]> {
  const res = await apiFetch(`${API_BASE}/cats/${catId}/care-history`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch care history');
  return json.data.map(normalizeCareHistory);
}

// --- admin: user management ---

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const res = await apiFetch(`${API_BASE}/auth/users`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to fetch users');
  // Backend returns paginated { items, pagination } — extract the items array
  const items = Array.isArray(json.data) ? json.data : (json.data?.items ?? []);
  return items.map((u: any) => ({
    id: String(u.id),
    fullName: u.fullName,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  }));
}

export async function updateUserRole(userId: string, role: string): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}/role`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update user role');
  return {
    id: String(json.data.id),
    fullName: json.data.fullName,
    email: json.data.email,
    role: json.data.role,
    emailVerified: json.data.emailVerified,
    createdAt: json.data.createdAt,
    updatedAt: json.data.updatedAt,
  };
}

export async function createUser(data: { fullName: string; email: string; password: string; role: string }): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to create user');
  return {
    id: String(json.data.id),
    fullName: json.data.fullName,
    email: json.data.email,
    role: json.data.role,
    emailVerified: json.data.emailVerified,
    createdAt: json.data.createdAt,
    updatedAt: json.data.updatedAt,
  };
}

export async function updateUser(userId: string, data: { fullName?: string; email?: string }): Promise<AdminUser> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to update user');
  return {
    id: String(json.data.id),
    fullName: json.data.fullName,
    email: json.data.email,
    role: json.data.role,
    emailVerified: json.data.emailVerified,
    createdAt: json.data.createdAt,
    updatedAt: json.data.updatedAt,
  };
}

export async function deleteUser(userId: string): Promise<void> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}`, {
    method: 'DELETE',
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to delete user');
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/change-password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to change password');
  return json.data;
}

export async function adminResetUserPassword(userId: string, password: string): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/users/${userId}/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to reset password');
  return json.data;
}

export async function forgotPassword(email: string): Promise<{ message: string; token?: string }> {
  const res = await apiFetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to process request');
  return json.data;
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  const res = await apiFetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, password }),
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'Failed to reset password');
  return json.data;
}
