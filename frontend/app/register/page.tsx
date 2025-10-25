"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";
import { authAPI, referralAPI } from "@/lib/api";
import FormInput from "@/components/ui/FormInput";
import Button from "@/components/ui/Button";
import { ValidationErrors } from "@/lib/validation";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingReferral, setIsValidatingReferral] = useState(false);
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referrerInfo, setReferrerInfo] = useState<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser, setToken, isAuthenticated } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  const commonRules = {
    name: {
      required: true,
      minLength: 2,
      pattern: /^[a-zA-Z\s]+$/,
      message: "Name must contain only letters and spaces",
    },
    email: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: "Please enter a valid email address",
    },
    password: {
      required: true,
      minLength: 8,
    },
    referralCode: {
      pattern: /^[A-Za-z0-9]{6,10}$/,
      message: "Referral code must be 6-10 characters (letters and numbers)",
    },
  };

  const validationRules = {
    firstName: commonRules.name,
    lastName: commonRules.name,
    email: commonRules.email,
    password: {
      required: true,
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
        }
        return null;
      },
    },

    referralCode: {
      ...commonRules.referralCode,
      required: false,
    },
  };

  // Check for referral code in URL
  useEffect(() => {
    const referralFromUrl = searchParams.get("ref");
    if (referralFromUrl) {
      setFormData((prev) => ({ ...prev, referralCode: referralFromUrl }));
      validateReferralCode(referralFromUrl);
    }
  }, [searchParams]);

  const validateField = (name: string, value: string) => {
    const rules = validationRules[name as keyof typeof validationRules];
    if (!rules) return null;

    if ("required" in rules && rules.required && !value.trim()) {
      return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
    }

    if (
      "minLength" in rules &&
      rules.minLength &&
      value.trim() &&
      value.length < rules.minLength
    ) {
      return `${
        name.charAt(0).toUpperCase() + name.slice(1)
      } must be at least ${rules.minLength} characters`;
    }

    if (
      "maxLength" in rules &&
      rules.maxLength &&
      typeof rules.maxLength === "number" &&
      value.length > rules.maxLength
    ) {
      return `${
        name.charAt(0).toUpperCase() + name.slice(1)
      } must be no more than ${rules.maxLength} characters`;
    }

    if (
      "pattern" in rules &&
      rules.pattern &&
      value.trim() &&
      !rules.pattern.test(value)
    ) {
      return ("message" in rules && rules.message) || `Invalid ${name}`;
    }

    if ("custom" in rules && rules.custom) {
      return rules.custom(value);
    }

    return null;
  };

  const validateReferralCode = async (code: string) => {
    if (!code) {
      setReferrerInfo(null);
      return;
    }

    setIsValidatingReferral(true);
    try {
      const response = await referralAPI.validateCode(code);
      setReferrerInfo(response.data.data.referrer);
      toast.success(
        `Valid referral code from ${response.data.data.referrer.firstName}!`
      );
    } catch (error: any) {
      setReferrerInfo(null);
      const errorMessage =
        error.response?.data?.message || "Invalid referral code";
      toast.error(errorMessage);
    } finally {
      setIsValidatingReferral(false);
    }
  };

  const handleReferralBlur = () => {
    if (formData.referralCode) {
      validateReferralCode(formData.referralCode);
    }
  };

  const validateFormData = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.entries(formData).forEach(([key, value]) => {
      if (key === "confirmPassword") return; // Skip confirmPassword in this loop

      const error = validateField(key, value);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    // Validate confirmPassword separately with current password value
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "Confirm password is required";
      isValid = false;
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormData()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsLoading(true);

    try {
      const { confirmPassword, referralCode, ...baseData } = formData;

      // Only include referralCode if it's not empty
      const submitData = {
        ...baseData,
        ...(referralCode && referralCode.trim() ? { referralCode } : {}),
      };

      const response = await authAPI.register(submitData);
      const { user, token } = response.data.data;

      setUser(user);
      setToken(token);

      toast.success("Registration successful!");
      router.push("/dashboard");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || "Registration failed";
      toast.error(errorMessage);

      // Handle field-specific errors from server
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Reset referral validation when code changes
    if (name === "referralCode") {
      setReferralValid(null);
      // Debounce referral validation
      const timeoutId = setTimeout(() => {
        validateReferralCode(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Join FileSure
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Create your account and start earning credits
          </p>
        </div>

        {referrerInfo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6"
          >
            <p className="text-green-800 dark:text-green-200 text-sm">
              🎉 You're joining through{" "}
              <strong>
                {referrerInfo.firstName} {referrerInfo.lastName}
              </strong>
              's referral! You'll both earn 2 credits when you make your first
              purchase.
            </p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormInput
              name="firstName"
              label="First Name"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              error={errors.firstName}
              placeholder="First name"
              required
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
            <FormInput
              name="lastName"
              label="Last Name"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              error={errors.lastName}
              placeholder="Last name"
              required
              icon={
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              }
            />
          </div>

          <FormInput
            name="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter your email"
            required
            icon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
          />

          <FormInput
            name="password"
            label="Password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Create a password"
            required
          />

          <FormInput
            name="confirmPassword"
            label="Confirm Password"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Confirm your password"
            required
          />

          <div>
            <label
              htmlFor="referralCode"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Referral Code (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                id="referralCode"
                name="referralCode"
                value={formData.referralCode}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm pr-10"
                placeholder="Enter referral code"
              />
              {isValidatingReferral && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
              {referrerInfo && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <svg
                    className="h-4 w-4 text-green-500"
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
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
          >
            ← Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
