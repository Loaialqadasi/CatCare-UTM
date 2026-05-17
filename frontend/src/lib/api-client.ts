// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import type {
  User,
  Cat,
  Donation,
  DonationProgress,
  EmergencyReport,
  DonationStatus,
  PaginatedResponse,
  LoginFormData,
  RegisterFormData,
  CreateCatFormData,
  CreateDonationFormData,
  CreateEmergencyFormData,
  CatFilters,
  EmergencyFilters,
  EmergencyStatus,
} from './types';
import { demoUser, demoCats, demoDonations, demoEmergencies } from './mock-data';

const API_BASE = 'https://catcare-backend.onrender.com/api';
const BACKEND_AVAILABLE = true; // flip this to true once the backend API is live

const UTM_EMAIL_DOMAINS = ['@utm.my', '@graduate.utm.my'];

function isUtmEmail(email: string): boolean {
  return UTM_EMAIL_DOMAINS.some((domain) => email.endsWith(domain));
}

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
  if (!isUtmEmail(data.email)) {
    throw new Error('Please use a valid UTM email (e.g. your.name@utm.my or your.name@graduate.utm.my)');
  }
  if (data.email === demoUser.email && data.password === 'password123') {
    return { user: demoUser, token: 'mock-jwt-token-xyz' };
  }
  // in demo mode we just let anyone in with a valid UTM email
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
  if (!isUtmEmail(data.email)) {
    throw new Error('Please use a valid UTM email (e.g. your.name@utm.my or your.name@graduate.utm.my)');
  }
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

// --- donations ---
function maskName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length <= 1) return '*';
  if (trimmed.length === 2) return `${trimmed[0]}*`;
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`;
}

export async function fetchDonationProgress(_token?: string): Promise<DonationProgress> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/donations/public-progress`, {
      headers: _token ? { Authorization: `Bearer ${_token}` } : undefined,
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donation progress');
    return json.data;
  }

  await delay(400);
  const goalAmount = 1000;
  const verified = demoDonations.filter((d) => d.status === 'verified');
  const totalVerifiedAmount = verified.reduce((sum, d) => sum + d.amount, 0);
  const percentage = Math.min(100, Number(((totalVerifiedAmount / goalAmount) * 100).toFixed(2)));

  return {
    totalVerifiedAmount,
    goalAmount,
    percentage,
    achieved: totalVerifiedAmount >= goalAmount,
    recentVerifiedDonors: verified
      .filter((d) => d.verifiedAt)
      .sort((a, b) => new Date(b.verifiedAt || 0).getTime() - new Date(a.verifiedAt || 0).getTime())
      .slice(0, 5)
      .map((d) => ({
        maskedName: maskName(d.donorName),
        amount: d.amount,
        verifiedAt: d.verifiedAt || new Date().toISOString(),
      })),
  };
}

export async function createDonationReceipt(
  data: CreateDonationFormData,
  _token?: string
): Promise<Donation> {
  if (BACKEND_AVAILABLE) {
    const formData = new FormData();
    formData.append('donorName', data.donorName);
    formData.append('amount', String(data.amount));
    if (data.note) {
      formData.append('note', data.note);
    }
    formData.append('receipt', data.receipt);

    const res = await fetch(`${API_BASE}/donations/receipts`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${_token}` },
      body: formData,
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to submit donation receipt');
    return json.data;
  }

  await delay(700);
  const now = new Date().toISOString();
  const created: Donation = {
    id: `don-${Date.now()}`,
    donorName: data.donorName,
    amount: data.amount,
    receiptUrl: `/uploads/receipts/${data.receipt.name}`,
    note: data.note ?? null,
    status: 'pending',
    createdByUserId: demoUser.id,
    verifiedByUserId: null,
    verifiedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  demoDonations.unshift(created);
  return created;
}

export async function fetchDonationSubmissions(
  status: DonationStatus | '' = '',
  _token?: string
): Promise<PaginatedResponse<Donation>> {
  if (BACKEND_AVAILABLE) {
    const params = new URLSearchParams({ page: '1', pageSize: '50' });
    if (status) params.set('status', status);

    const res = await fetch(`${API_BASE}/donations/admin/submissions?${params}`, {
      headers: { Authorization: `Bearer ${_token}` },
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to fetch donation submissions');
    return json.data;
  }

  await delay(500);
  const filtered = status ? demoDonations.filter((d) => d.status === status) : demoDonations;
  return {
    items: [...filtered],
    pagination: {
      page: 1,
      pageSize: 50,
      totalItems: filtered.length,
      totalPages: 1,
    },
  };
}

export async function updateDonationSubmissionStatus(
  id: string,
  status: DonationStatus,
  _token?: string
): Promise<Donation> {
  if (BACKEND_AVAILABLE) {
    const res = await fetch(`${API_BASE}/donations/admin/submissions/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${_token}`,
      },
      body: JSON.stringify({ status }),
    });

    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Failed to update donation status');
    return json.data;
  }

  await delay(400);
  const target = demoDonations.find((d) => d.id === id);
  if (!target) {
    throw new Error('Donation submission not found');
  }

  target.status = status;
  target.updatedAt = new Date().toISOString();
  if (status === 'verified') {
    target.verifiedAt = new Date().toISOString();
    target.verifiedByUserId = 'admin-001';
  } else {
    target.verifiedAt = null;
    target.verifiedByUserId = null;
  }

  return { ...target };
}
