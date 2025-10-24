"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { useReferralStore } from "@/store/referralStore";
import { referralAPI } from "@/lib/api";
import toast from "react-hot-toast";

export default function DashboardPage() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { stats, recentReferrals, setStats, setRecentReferrals, setLoading } =
    useReferralStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    loadReferralStats();
  }, [isAuthenticated]);

  const loadReferralStats = async () => {
    setLoading(true);
    try {
      const response = await referralAPI.getStats();
      setStats(response.data.data.stats);
      setRecentReferrals(response.data.data.recentReferrals);
    } catch (error: any) {
      toast.error("Failed to load referral stats");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const copyReferralLink = () => {
    const referralLink = `${window.location.origin}/register?r=${user?.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-700 dark:text-gray-300">
              Welcome, {user.firstName}!
            </span>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Referrals
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {stats?.totalReferrals || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Successful Referrals
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {stats?.successfulReferrals || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Credits
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {stats?.totalCredits || 0}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Conversion Rate
            </h3>
            <p className="text-3xl font-bold text-purple-600">
              {stats?.conversionRate || 0}%
            </p>
          </motion.div>
        </div>

        {/* Referral Link Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Your Referral Link
          </h2>
          <div className="flex items-center gap-4">
            <input
              type="text"
              aria-label="Referral link"
              value={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/register?r=${user.referralCode}`}
              readOnly
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <button
              onClick={copyReferralLink}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Copy Link
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Share this link with friends to earn 2 credits when they make their
            first purchase!
          </p>
        </motion.div>

        {/* Recent Referrals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow"
        >
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Recent Referrals
            </h2>
          </div>
          <div className="p-6">
            {recentReferrals.length > 0 ? (
              <div className="space-y-4">
                {recentReferrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {referral.referredUser.firstName}{" "}
                        {referral.referredUser.lastName}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {referral.referredUser.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          referral.status === "completed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {referral.status}
                      </span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400">
                  No referrals yet. Start sharing your referral link to earn
                  credits!
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
