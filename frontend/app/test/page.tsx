"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { authAPI, referralAPI, purchaseAPI } from "@/lib/api";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import toast from "react-hot-toast";

interface TestResult {
  name: string;
  status: "pending" | "success" | "error";
  message: string;
  duration?: number;
}

export default function TestPage() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateTest = (
    name: string,
    status: TestResult["status"],
    message: string,
    duration?: number
  ) => {
    setTests((prev) => {
      const existing = prev.find((t) => t.name === name);
      if (existing) {
        existing.status = status;
        existing.message = message;
        existing.duration = duration;
        return [...prev];
      } else {
        return [...prev, { name, status, message, duration }];
      }
    });
  };

  const runTest = async (name: string, testFn: () => Promise<void>) => {
    const startTime = Date.now();
    updateTest(name, "pending", "Running...");

    try {
      await testFn();
      const duration = Date.now() - startTime;
      updateTest(name, "success", "Passed", duration);
    } catch (error: any) {
      const duration = Date.now() - startTime;
      updateTest(name, "error", error.message || "Failed", duration);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([]);

    try {
      // Test 1: Health Check
      await runTest("Health Check", async () => {
        const response = await fetch("/api/health");
        if (!response.ok) throw new Error("Health check failed");
      });

      // Test 2: Registration
      let authToken = "";
      await runTest("User Registration", async () => {
        const testUser = {
          email: `test${Date.now()}@example.com`,
          password: "password123",
          firstName: "Test",
          lastName: "User",
        };

        const response = await authAPI.register(testUser);
        authToken = response.data.token;

        // Store token for subsequent tests
        localStorage.setItem("token", authToken);
      });

      // Test 3: Referral Stats
      await runTest("Referral Stats", async () => {
        await referralAPI.getStats();
      });

      // Test 4: Recent Referrals
      await runTest("Recent Referrals", async () => {
        await referralAPI.getHistory();
      });

      // Test 5: Create Purchase
      await runTest("Create Purchase", async () => {
        await purchaseAPI.create({
          productName: "Test Purchase",
          amount: 99.99,
          currency: "USD",
        });
      });

      // Test 6: Purchase History
      await runTest("Purchase History", async () => {
        await purchaseAPI.getHistory();
      });

      // Test 7: Referral History
      await runTest("Referral History", async () => {
        await referralAPI.getHistory();
      });

      toast.success("All tests completed!");
    } catch (error) {
      toast.error("Test suite failed");
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return (
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      case "success":
        return (
          <svg
            className="w-4 h-4 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-4 h-4 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
    }
  };

  const getStatusColor = (status: TestResult["status"]) => {
    switch (status) {
      case "pending":
        return "text-blue-600 dark:text-blue-400";
      case "success":
        return "text-green-600 dark:text-green-400";
      case "error":
        return "text-red-600 dark:text-red-400";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            API Integration Tests
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Test the integration between frontend and backend APIs
          </p>

          <Button
            onClick={runAllTests}
            loading={isRunning}
            disabled={isRunning}
            variant="primary"
            size="lg"
          >
            {isRunning ? "Running Tests..." : "Run All Tests"}
          </Button>
        </motion.div>

        {tests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Test Results
              </h2>

              <div className="space-y-4">
                {tests.map((test, index) => (
                  <motion.div
                    key={test.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {test.name}
                        </h3>
                        <p className={`text-sm ${getStatusColor(test.status)}`}>
                          {test.message}
                        </p>
                      </div>
                    </div>

                    {test.duration && (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {test.duration}ms
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-600">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {tests.filter((t) => t.status === "success").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Passed
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {tests.filter((t) => t.status === "error").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Failed
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {tests.filter((t) => t.status === "pending").length}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Running
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
