"use client";

import { useState } from "react";

export default function TestEmailPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runEmailTests = async () => {
    setIsLoading(true);
    setTestResults([]);

    const tests = [
      {
        name: "Register User (Should send welcome email)",
        test: async () => {
          const response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firstName: "Test",
                lastName: "User",
                email: `test${Date.now()}@example.com`,
                password: "password123",
              }),
            }
          );
          return response.json();
        },
      },
      {
        name: "Register with Referral (Should send referral emails)",
        test: async () => {
          // First get a referral code
          const user1Response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firstName: "Referrer",
                lastName: "User",
                email: `referrer${Date.now()}@example.com`,
                password: "password123",
              }),
            }
          );
          const user1Data = await user1Response.json();

          // Then register with referral code
          const user2Response = await fetch(
            "http://localhost:5000/api/auth/register",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                firstName: "Referred",
                lastName: "User",
                email: `referred${Date.now()}@example.com`,
                password: "password123",
                referralCode: user1Data.data.user.referralCode,
              }),
            }
          );
          return user2Response.json();
        },
      },
    ];

    for (const test of tests) {
      try {
        const startTime = Date.now();
        const result = await test.test();
        const duration = Date.now() - startTime;

        setTestResults((prev) => [
          ...prev,
          {
            name: test.name,
            status: result.success ? "success" : "error",
            duration,
            result,
          },
        ]);
      } catch (error) {
        setTestResults((prev) => [
          ...prev,
          {
            name: test.name,
            status: "error",
            duration: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          },
        ]);
      }
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            📧 Email System Test
          </h1>

          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              This page tests the email functionality of the referral system.
              Make sure to configure your email settings in the backend .env
              file.
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Email Configuration Required:
              </h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• EMAIL_USER: Your Gmail address</li>
                <li>
                  • EMAIL_PASS: Your Gmail app password (not regular password)
                </li>
                <li>• EMAIL_SERVICE: gmail (default)</li>
                <li>• EMAIL_FROM: Sender email address</li>
              </ul>
            </div>

            <button
              onClick={runEmailTests}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              {isLoading ? "Running Tests..." : "Run Email Tests"}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Test Results:
              </h2>

              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${
                    result.status === "success"
                      ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {result.status === "success" ? "✅" : "❌"} {result.name}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {result.duration}ms
                    </span>
                  </div>

                  {result.error && (
                    <p className="text-red-600 dark:text-red-400 text-sm">
                      Error: {result.error}
                    </p>
                  )}

                  {result.result && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
                        View Response
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                        {JSON.stringify(result.result, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">
              📧 Email Types Tested:
            </h3>
            <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
              <li>
                • <strong>Welcome Email:</strong> Sent when a user registers
                normally
              </li>
              <li>
                • <strong>Referral Success Email:</strong> Sent to referrer when
                someone uses their code
              </li>
              <li>
                • <strong>Referral Welcome Email:</strong> Sent to referred user
                with referrer info
              </li>
              <li>
                • <strong>Credits Earned Email:</strong> Sent when referrer
                earns credits from purchases
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
