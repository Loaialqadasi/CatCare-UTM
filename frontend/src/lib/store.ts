// Mohamed Abdelgawwad — CCU-S1-04 | Foundation Module

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AppView, Cat, EmergencyReport } from './types';

interface AppState {
  // Auth state
  user: User | null;
  isAuthenticated: boolean;

  // Navigation state
  currentView: AppView;
  previousView: AppView | null;
  selectedCatId: string | null;
  selectedEmergencyId: string | null;
  selectedDonationId: string | null;
  preselectedCatIdForEmergency: string | null;

  // Sidebar state
  sidebarOpen: boolean;

  // Auth actions
  setUser: (user: User) => void;
  login: (user: User) => void;
  logout: () => void;

  // Navigation actions
  setCurrentView: (view: AppView) => void;
  goBack: () => void;
  navigateToCatDetail: (catId: string) => void;
  navigateToEmergencyDetail: (emergencyId: string) => void;
  navigateToDonationDetail: (donationId: string) => void;
  navigateToCreateEmergencyForCat: (catId: string) => void;
  clearPreselectedCatId: () => void;

  // Sidebar actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // starts logged out — users must sign in with a valid UTM email
      user: null,
      isAuthenticated: false,

      // Navigation state
      currentView: 'login',
      previousView: null,
      selectedCatId: null,
      selectedEmergencyId: null,
      selectedDonationId: null,
      preselectedCatIdForEmergency: null,

      // Sidebar state
      sidebarOpen: false,

      // Auth actions
      setUser: (user) => set({ user }),
      login: (user) =>
        set({ user, isAuthenticated: true, currentView: 'dashboard' }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          currentView: 'login',
          previousView: null,
          selectedCatId: null,
          selectedEmergencyId: null,
          selectedDonationId: null,
          preselectedCatIdForEmergency: null,
        }),

      // Navigation actions
      setCurrentView: (view) =>
        set((state) => ({
          previousView: state.currentView,
          currentView: view,
          selectedCatId: null,
          selectedEmergencyId: null,
          selectedDonationId: null,
        })),
      goBack: () =>
        set((state) => {
          const defaultBackViews: Partial<Record<AppView, AppView>> = {
            'cat-detail': 'cats',
            'emergency-detail': 'emergencies',
            'donation-detail': 'my-donations',
          };
          const backView = state.previousView ?? defaultBackViews[state.currentView] ?? 'dashboard';
          return {
            previousView: null,
            currentView: backView,
            selectedCatId: null,
            selectedEmergencyId: null,
            selectedDonationId: null,
          };
        }),
      navigateToCatDetail: (catId) =>
        set((state) => ({ previousView: state.currentView, currentView: 'cat-detail', selectedCatId: catId })),
      navigateToEmergencyDetail: (emergencyId) =>
        set((state) => ({ previousView: state.currentView, currentView: 'emergency-detail', selectedEmergencyId: emergencyId })),
      navigateToDonationDetail: (donationId) =>
        set((state) => ({ previousView: state.currentView, currentView: 'donation-detail', selectedDonationId: donationId })),
      navigateToCreateEmergencyForCat: (catId) =>
        set((state) => ({ previousView: state.currentView, currentView: 'create-emergency', selectedCatId: null, selectedEmergencyId: null, selectedDonationId: null, preselectedCatIdForEmergency: catId })),
      clearPreselectedCatId: () =>
        set({ preselectedCatIdForEmergency: null }),

      // Sidebar actions
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
    }),
    {
      name: 'catcare-storage',
      // CRIT-1 Fix: Only persist isAuthenticated flag.
      // Token is now in an HttpOnly cookie — never in localStorage.
      // User object is re-fetched via /api/auth/me on every page load.
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// --- data cache ---
// MIN-4 Fix: Added loading flags per resource
interface DataCacheState {
  cats: Cat[];
  catsPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  catsLastFetched: number | null;
  catsLoading: boolean;
  emergencies: EmergencyReport[];
  emergenciesPagination: { page: number; pageSize: number; totalItems: number; totalPages: number };
  emergenciesLastFetched: number | null;
  emergenciesLoading: boolean;
  priorityFeed: EmergencyReport[];
  priorityFeedLastFetched: number | null;
  priorityFeedLoading: boolean;

  setCats: (cats: Cat[], pagination: DataCacheState['catsPagination']) => void;
  setCatsLoading: (loading: boolean) => void;
  setEmergencies: (emergencies: EmergencyReport[], pagination: DataCacheState['emergenciesPagination']) => void;
  setEmergenciesLoading: (loading: boolean) => void;
  setPriorityFeed: (feed: EmergencyReport[]) => void;
  setPriorityFeedLoading: (loading: boolean) => void;
  invalidateCats: () => void;
  invalidateEmergencies: () => void;
  invalidatePriorityFeed: () => void;
  isCatsStale: (maxAgeMs?: number) => boolean;
  isEmergenciesStale: (maxAgeMs?: number) => boolean;
  isPriorityFeedStale: (maxAgeMs?: number) => boolean;
}

const CACHE_STALE_MS = 30_000; // 30 seconds

export const useDataCache = create<DataCacheState>((set, get) => ({
  cats: [],
  catsPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  catsLastFetched: null,
  catsLoading: false,
  emergencies: [],
  emergenciesPagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 0 },
  emergenciesLastFetched: null,
  emergenciesLoading: false,
  priorityFeed: [],
  priorityFeedLastFetched: null,
  priorityFeedLoading: false,

  setCats: (cats, pagination) => set({ cats, catsPagination: pagination, catsLastFetched: Date.now(), catsLoading: false }),
  setCatsLoading: (loading) => set({ catsLoading: loading }),
  setEmergencies: (emergencies, pagination) => set({ emergencies, emergenciesPagination: pagination, emergenciesLastFetched: Date.now(), emergenciesLoading: false }),
  setEmergenciesLoading: (loading) => set({ emergenciesLoading: loading }),
  setPriorityFeed: (feed) => set({ priorityFeed: feed, priorityFeedLastFetched: Date.now(), priorityFeedLoading: false }),
  setPriorityFeedLoading: (loading) => set({ priorityFeedLoading: loading }),
  invalidateCats: () => set({ catsLastFetched: null }),
  invalidateEmergencies: () => set({ emergenciesLastFetched: null }),
  invalidatePriorityFeed: () => set({ priorityFeedLastFetched: null }),
  isCatsStale: (maxAgeMs = CACHE_STALE_MS) => {
    const last = get().catsLastFetched;
    return last === null || Date.now() - last > maxAgeMs;
  },
  isEmergenciesStale: (maxAgeMs = CACHE_STALE_MS) => {
    const last = get().emergenciesLastFetched;
    return last === null || Date.now() - last > maxAgeMs;
  },
  isPriorityFeedStale: (maxAgeMs = CACHE_STALE_MS) => {
    const last = get().priorityFeedLastFetched;
    return last === null || Date.now() - last > maxAgeMs;
  },
}));
