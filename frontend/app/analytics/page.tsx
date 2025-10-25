"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { referralAPI, purchaseAPI } from "@/lib/api";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

interface AnalyticsData {
  referralStats: {
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalCreditsEarned: number;
    conversionRate: number;
  };
  purchaseStats: {
    totalPurchases: number;
    totalSpent: number;
    totalCreditsUsed: number;
    averagePurchase: number;
  };
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const router = useRouter();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setHasError(false);
        // Fetch real data from API endpoints
        const [referralStatsResponse, purchases] = await Promise.all([
          referralAPI.getStats(),
          purchaseAPI.getHistory(),
        ]);

        const purchaseData = purchases.data || [];

        const referralStats = {
          totalReferrals: referralStatsResponse.data.stats.totalReferrals,
          pendingReferrals: referralStatsResponse.data.stats.pendingReferrals,
          completedReferrals:
            referralStatsResponse.data.stats.successfulReferrals,
          totalCreditsEarned:
            referralStatsResponse.data.stats.totalCreditsEarned,
          conversionRate: parseFloat(
            referralStatsResponse.data.stats.conversionRate
          ),
        };

        const purchaseStats = {
          totalPurchases: purchaseData.length,
          totalSpent: purchaseData.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
          ),
          totalCreditsUsed: purchaseData.reduce(
            (sum: number, p: any) => sum + (p.creditsUsed || 0),
            0
          ),
          averagePurchase:
            purchaseData.length > 0
              ? purchaseData.reduce(
                  (sum: number, p: any) => sum + p.amount,
                  0
                ) / purchaseData.length
              : 0,
        };

        setAnalytics({
          referralStats,
          purchaseStats,
        });
      } catch (error: any) {
        console.error("Analytics loading error:", error);
        setHasError(true);
        toast.error(
          error.response?.data?.message || "Failed to load analytics"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalytics();
  }, [timeRange]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </ProtectedRoute>
    );
  }

  // Handle API errors
  if (hasError) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="text-center p-8">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Unable to Load Analytics
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We're having trouble loading your analytics data. Please check
              your connection and try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  // Handle empty data (user has no activity yet)
  if (
    !analytics ||
    (analytics.referralStats.totalReferrals === 0 &&
      analytics.purchaseStats.totalPurchases === 0)
  ) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <Card className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Start Your Journey
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't made any referrals or purchases yet. Start referring
              friends or make your first purchase to see your analytics here!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => router.push("/referrals")}>
                Start Referring
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Analytics Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Track your referral and purchase performance
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            {/* Referral Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Referral Performance
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Referred Users
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.referralStats.totalReferrals}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {analytics.referralStats.pendingReferrals} pending,{" "}
                    {analytics.referralStats.completedReferrals} completed
                  </p>
                </Card>

                <Card className="text-center">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Converted Users
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.referralStats.completedReferrals}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Who purchased
                  </p>
                </Card>

                <Card className="text-center">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total Credits Earned
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.referralStats.totalCreditsEarned}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total lifetime
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* Purchase Analytics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Purchase Analytics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="text-center">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-orange-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total Purchases
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.purchaseStats.totalPurchases}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All time
                  </p>
                </Card>

                <Card className="text-center">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-red-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Total Spent
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${analytics.purchaseStats.totalSpent.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    All time
                  </p>
                </Card>

                <Card className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-6 h-6 text-indigo-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Average Purchase
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${analytics.purchaseStats.averagePurchase.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Per transaction
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* Credits Usage */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Credits Overview
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Credits Earned
                    </h4>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {analytics.referralStats.totalCreditsEarned}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      From {analytics.referralStats.completedReferrals}{" "}
                      successful referrals
                    </p>
                  </div>

                  <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 12H4"
                        />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Credits Used
                    </h4>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {analytics.purchaseStats.totalCreditsUsed}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Across {analytics.purchaseStats.totalPurchases} purchases
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
