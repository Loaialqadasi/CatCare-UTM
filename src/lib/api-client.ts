import type {
  User,
  Cat,
  EmergencyReport,
  ApiResponse,
  PaginatedResponse,
  LoginFormData,
  RegisterFormData,
  CreateCatFormData,
  CreateEmergencyFormData,
  CatFilters,
  EmergencyFilters,
  EmergencyStatus,
} from './types';
import { demoUser, demoCats, demoEmergencies } from './mock-data';

const API_BASE = 'https://catcare-utm-api.onrender.com/api/api';
const BACKEND_AVAILABLE = true; // flip this to true once the backend API is live

// fake a small delay so the UI shows loading states
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// --- auth ---
export async function login(data: LoginFormData): Promise<{ user: User; token: string }> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Login failed');
    return json.data;
  }

  // using demo data
  await delay(800);
  if (data.email === demoUser.email && data.password === 'password123') {
    return { user: demoUser, token: 'mock-jwt-token-xyz' };
  }
  // in demo mode we just let anyone in
  return {
    user: { ...demoUser, email: data.email },
    token: 'mock-jwt-token-xyz',
  };
}

export async function register(data: RegisterFormData): Promise<{ user: User; token: string }> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Registration failed');
    return json.data;
  }

  // using demo data
  await delay(1000);
  const newUser: User = {
    id: `user-${Date.now()}`,
    fullName: data.fullName,
    email: data.email,
    role: 'student',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return { user: newUser, token: 'mock-jwt-token-xyz' };
}

export async function getMe(token: string): Promise<User> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to get user');
    return json.data;
  }

  // using demo data
  await delay(300);
  return demoUser;
}

// --- cats ---
export async function fetchCats(
  filters: CatFilters = {},
  _token?: string
): Promise<PaginatedResponse<Cat>> {
  const { page = 1, pageSize = 10, search = '', healthStatus = '' } = filters;

  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set('search', search);
    if (healthStatus) params.set('healthStatus', healthStatus);
    const res = await fetch(`${API_BASE}/cats?${params}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cats');
    return json.data;
  }

  // using demo data
  await delay(600);

  let filtered = [...demoCats];

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.nickname.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.locationName.toLowerCase().includes(q)
    );
  }

  if (healthStatus) {
    filtered = filtered.filter((c) => c.healthStatus === healthStatus);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, pagination: { page, pageSize, totalItems, totalPages } };
}

export async function fetchCatById(id: string, _token?: string): Promise<Cat> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/cats/${id}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch cat');
    return json.data;
  }

  // using demo data
  await delay(400);
  const cat = demoCats.find((c) => c.id === id);
  if (!cat) throw new Error('Cat not found');
  return cat;
}

export async function createCat(
  data: CreateCatFormData,
  _token?: string
): Promise<Cat> {
  if (BACKEND_AVAILABLE) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    const res = await fetch(`${API_BASE}/cats`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${_token}` },
      body: formData,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create cat');
    return json.data;
  }

  // using demo data
  await delay(1000);
  const newCat: Cat = {
    id: `cat-${Date.now()}`,
    nickname: data.nickname,
    description: data.description,
    photoUrl: data.photoUrl || 'https://placecats.com/millie/400/300',
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    healthStatus: data.healthStatus,
    ownershipTag: data.ownershipTag,
    createdByUserId: 'user-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  demoCats.unshift(newCat);
  return newCat;
}

// --- emergencies ---
export async function fetchEmergencies(
  filters: EmergencyFilters = {},
  _token?: string
): Promise<PaginatedResponse<EmergencyReport>> {
  const { page = 1, pageSize = 10, status = '', priority = '' } = filters;

  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    const res = await fetch(`${API_BASE}/emergencies?${params}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergencies');
    return json.data;
  }

  // using demo data
  await delay(600);

  let filtered = [...demoEmergencies];

  if (status) {
    filtered = filtered.filter((e) => e.status === status);
  }

  if (priority) {
    filtered = filtered.filter((e) => e.priority === priority);
  }

  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const start = (page - 1) * pageSize;
  const items = filtered.slice(start, start + pageSize);

  return { items, pagination: { page, pageSize, totalItems, totalPages } };
}

export async function fetchEmergencyById(
  id: string,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/${id}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch emergency');
    return json.data;
  }

  // using demo data
  await delay(400);
  const emergency = demoEmergencies.find((e) => e.id === id);
  if (!emergency) throw new Error('Emergency report not found');
  return emergency;
}

export async function fetchPriorityFeed(_token?: string): Promise<EmergencyReport[]> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/priority-feed`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch priority feed');
    return json.data;
  }

  // using demo data
  await delay(500);
  const priorityOrder: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return demoEmergencies
    .filter((e) => e.status !== 'resolved' && e.status !== 'cancelled')
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

export async function createEmergency(
  data: CreateEmergencyFormData,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to create emergency');
    return json.data;
  }

  // using demo data
  await delay(1000);
  const cat = data.catId ? demoCats.find((c) => c.id === data.catId) : null;
  const newEmergency: EmergencyReport = {
    id: `emg-${Date.now()}`,
    catId: data.catId || null,
    title: data.title,
    description: data.description,
    emergencyType: data.emergencyType,
    priority: data.priority,
    status: 'open',
    locationName: data.locationName,
    latitude: data.latitude,
    longitude: data.longitude,
    reportedByUserId: 'user-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    cat: cat ? { id: cat.id, nickname: cat.nickname } : null,
  };
  demoEmergencies.unshift(newEmergency);
  return newEmergency;
}

export async function updateEmergencyStatus(
  id: string,
  status: EmergencyStatus,
  _token?: string
): Promise<EmergencyReport> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/emergencies/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to update status');
    return json.data;
  }

  // using demo data
  await delay(500);
  const emergency = demoEmergencies.find((e) => e.id === id);
  if (!emergency) throw new Error('Emergency not found');
  emergency.status = status;
  emergency.updatedAt = new Date().toISOString();
  if (status === 'resolved' || status === 'cancelled') {
    emergency.resolvedAt = new Date().toISOString();
  }
  return { ...emergency };
}
