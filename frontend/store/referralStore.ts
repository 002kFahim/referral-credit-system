import { create } from "zustand";

interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  pendingReferrals: number;
  totalCreditsEarned: number;
  conversionRate: string;
}

interface ReferralUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

interface RecentReferral {
  id: string;
  referredUser: ReferralUser;
  status: "pending" | "completed";
  createdAt: string;
  completedAt?: string;
}

interface ReferralState {
  stats: ReferralStats | null;
  recentReferrals: RecentReferral[];
  isLoading: boolean;
  setStats: (stats: ReferralStats) => void;
  setRecentReferrals: (referrals: RecentReferral[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useReferralStore = create<ReferralState>((set) => ({
  stats: null,
  recentReferrals: [],
  isLoading: false,
  setStats: (stats) => set({ stats }),
  setRecentReferrals: (recentReferrals) => set({ recentReferrals }),
  setLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ stats: null, recentReferrals: [], isLoading: false }),
}));
