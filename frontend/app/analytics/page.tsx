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

// Progress Bar Component
const ProgressBar = ({
  value,
  max,
  className = "",
}: {
  value: number;
  max: number;
  className?: string;
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div
      className={`w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2 ${className}`}
    >
      <div
        className="bg-linear-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
        data-width={percentage}
        ref={(el) => {
          if (el) {
            el.style.width = `${percentage}%`;
          }
        }}
      />
    </div>
  );
};

interface AnalyticsData {
  referralStats: {
    totalReferrals: number;
    pendingReferrals: number;
    completedReferrals: number;
    totalCreditsEarned: number;
    conversionRate: number;
    monthlyGrowth: number;
  };
  purchaseStats: {
    totalPurchases: number;
    totalSpent: number;
    totalCreditsUsed: number;
    averagePurchase: number;
    monthlySpending: number;
  };
  monthlyData: Array<{
    month: string;
    referrals: number;
    purchases: number;
    credits: number;
  }>;
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">(
    "30d"
  );
  const router = useRouter();

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        // Simulate analytics data - in real app, this would come from API
        const [referrals, purchases] = await Promise.all([
          referralAPI.getHistory(),
          purchaseAPI.getHistory(),
        ]);

        const referralData = referrals.data || [];
        const purchaseData = purchases.data || [];

        const referralStats = {
          totalReferrals: referralData.length,
          pendingReferrals: referralData.filter(
            (r: any) => r.status === "pending"
          ).length,
          completedReferrals: referralData.filter(
            (r: any) => r.status === "completed"
          ).length,
          totalCreditsEarned: referralData.reduce(
            (sum: number, r: any) => sum + r.creditsEarned,
            0
          ),
          conversionRate:
            referralData.length > 0
              ? (referralData.filter((r: any) => r.status === "completed")
                  .length /
                  referralData.length) *
                100
              : 0,
          monthlyGrowth: 15.2, // Simulated
        };

        const purchaseStats = {
          totalPurchases: purchaseData.length,
          totalSpent: purchaseData.reduce(
            (sum: number, p: any) => sum + p.amount,
            0
          ),
          totalCreditsUsed: purchaseData.reduce(
            (sum: number, p: any) => sum + p.creditsUsed,
            0
          ),
          averagePurchase:
            purchaseData.length > 0
              ? purchaseData.reduce(
                  (sum: number, p: any) => sum + p.amount,
                  0
                ) / purchaseData.length
              : 0,
          monthlySpending: 245.5, // Simulated
        };

        // Generate monthly data for the last 6 months
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const date = new Date();
          date.setMonth(date.getMonth() - i);
          monthlyData.push({
            month: date.toLocaleDateString("en-US", {
              month: "short",
              year: "numeric",
            }),
            referrals: Math.floor(Math.random() * 10) + 1,
            purchases: Math.floor(Math.random() * 5) + 1,
            credits: Math.floor(Math.random() * 50) + 10,
          });
        }

        setAnalytics({
          referralStats,
          purchaseStats,
          monthlyData,
        });
      } catch (error: any) {
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
          <LoadingSpinner size="lg" text="Loading analytics..." />
        </div>
      </ProtectedRoute>
    );
  }

  if (!analytics) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Analytics Data
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Unable to load analytics data at this time.
            </p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Navigation */}
        <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center space-x-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="ghost"
                  size="sm"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                  Back to Dashboard
                </Button>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Analytics
                </h1>
              </div>
              <div className="flex items-center space-x-2">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  aria-label="Select time range for analytics"
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
            </div>
          </div>
        </nav>

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
                    Conversion Rate
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.referralStats.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    +2.3% from last month
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
                    Monthly Growth
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.referralStats.monthlyGrowth.toFixed(1)}%
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Trending upward
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
                    Credits Earned
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
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Average Purchase
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${analytics.purchaseStats.averagePurchase.toFixed(2)}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    +$12.50 from last month
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
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Monthly Spending
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${analytics.purchaseStats.monthlySpending.toFixed(2)}
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    +15% from last month
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
                    Credits Used
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {analytics.purchaseStats.totalCreditsUsed}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Total lifetime
                  </p>
                </Card>
              </div>
            </motion.div>

            {/* Monthly Trends */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Monthly Trends
                  </h3>
                </div>

                <div className="space-y-6">
                  {analytics.monthlyData.map((month, index) => (
                    <motion.div
                      key={month.month}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-linear-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {month.month.split(" ")[0]}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {month.month}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {month.referrals} referrals • {month.purchases}{" "}
                            purchases
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          +{month.credits} credits
                        </p>
                        <div className="flex items-center space-x-2 mt-1">
                          <ProgressBar value={month.referrals} max={10} />
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {month.referrals}/10
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
