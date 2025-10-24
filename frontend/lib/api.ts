import axios from "axios";
import { useAuthStore } from "@/store/authStore";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API functions
export const authAPI = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    referralCode?: string;
  }) => api.post("/auth/register", data),

  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),

  getProfile: () => api.get("/auth/profile"),
};

// Referral API functions
export const referralAPI = {
  getStats: () => api.get("/referrals/stats"),
  validateCode: (code: string) => api.get(`/referrals/validate/${code}`),
  getHistory: (page = 1, limit = 10) =>
    api.get(`/referrals/history?page=${page}&limit=${limit}`),
};

// Purchase API functions
export const purchaseAPI = {
  create: (data: { productName: string; amount: number; currency: string }) =>
    api.post("/purchases", data),

  getHistory: (page = 1, limit = 10) =>
    api.get(`/purchases/history?page=${page}&limit=${limit}`),
};
