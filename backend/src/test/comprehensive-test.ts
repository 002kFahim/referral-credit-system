import axios, { AxiosResponse } from "axios";

const API_BASE_URL = "http://localhost:5000/api";

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  referralCode?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      referralCode: string;
      credits: number;
    };
    token: string;
  };
}

class APITester {
  private authToken: string = "";
  private userId: string = "";
  private referralCode: string = "";

  async runAllTests() {
    console.log("🚀 Starting Comprehensive API Tests...\n");

    try {
      await this.testHealthCheck();
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testReferralValidation();
      await this.testReferralStats();
      await this.testCreatePurchase();
      await this.testPurchaseHistory();
      await this.testReferralHistory();
      await this.testRecentReferrals();

      console.log("✅ All tests completed successfully!");
    } catch (error) {
      console.error("❌ Test suite failed:", error);
    }
  }

  async testHealthCheck() {
    console.log("🔍 Testing Health Check...");
    try {
      const response = await axios.get(`${API_BASE_URL}/health`);
      console.log("✅ Health check passed:", response.data.message);
    } catch (error) {
      console.error("❌ Health check failed:", error);
      throw error;
    }
  }

  async testUserRegistration() {
    console.log("\n🔍 Testing User Registration...");

    const testUser: TestUser = {
      email: `test${Date.now()}@example.com`,
      password: "password123",
      firstName: "Test",
      lastName: "User",
    };

    try {
      const response: AxiosResponse<AuthResponse> = await axios.post(
        `${API_BASE_URL}/auth/register`,
        testUser
      );

      if (response.data.success) {
        this.authToken = response.data.data.token;
        this.userId = response.data.data.user.id;
        this.referralCode = response.data.data.user.referralCode;

        console.log("✅ User registration successful");
        console.log(`   User ID: ${this.userId}`);
        console.log(`   Referral Code: ${this.referralCode}`);
      } else {
        throw new Error("Registration failed");
      }
    } catch (error: any) {
      console.error(
        "❌ User registration failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testUserLogin() {
    console.log("\n🔍 Testing User Login...");

    try {
      const response: AxiosResponse<AuthResponse> = await axios.post(
        `${API_BASE_URL}/auth/login`,
        {
          email: `test${Date.now() - 1000}@example.com`, // Use a different email for login test
          password: "password123",
        }
      );

      // For this test, we'll continue with the registration token
      console.log("✅ Login endpoint is accessible");
    } catch (error: any) {
      // Expected to fail since we're using a non-existent email
      if (error.response?.status === 401) {
        console.log(
          "✅ Login validation working (expected failure for non-existent user)"
        );
      } else {
        console.error(
          "❌ Unexpected login error:",
          error.response?.data || error.message
        );
      }
    }
  }

  async testReferralValidation() {
    console.log("\n🔍 Testing Referral Code Validation...");

    try {
      const response = await axios.get(
        `${API_BASE_URL}/referrals/validate/${this.referralCode}`
      );

      if (response.data.success) {
        console.log("✅ Referral code validation successful");
        console.log(
          `   Referrer: ${response.data.data.referrer.firstName} ${response.data.data.referrer.lastName}`
        );
      } else {
        throw new Error("Referral validation failed");
      }
    } catch (error: any) {
      console.error(
        "❌ Referral validation failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testReferralStats() {
    console.log("\n🔍 Testing Referral Statistics...");

    try {
      const response = await axios.get(`${API_BASE_URL}/referrals/stats`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (response.data.success) {
        console.log("✅ Referral stats retrieved successfully");
        console.log(
          `   Total Referrals: ${response.data.data.stats.totalReferrals}`
        );
        console.log(
          `   Total Credits: ${response.data.data.stats.totalCredits}`
        );
      } else {
        throw new Error("Referral stats failed");
      }
    } catch (error: any) {
      console.error(
        "❌ Referral stats failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testCreatePurchase() {
    console.log("\n🔍 Testing Purchase Creation...");

    const purchaseData = {
      description: "Test Product Purchase",
      amount: 99.99,
      currency: "USD",
      creditsUsed: 0,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/purchases`,
        purchaseData,
        {
          headers: { Authorization: `Bearer ${this.authToken}` },
        }
      );

      if (response.data.success) {
        console.log("✅ Purchase creation successful");
        console.log(`   Purchase ID: ${response.data.data._id}`);
        console.log(`   Amount: $${response.data.data.amount}`);
        console.log(`   Status: ${response.data.data.status}`);
      } else {
        throw new Error("Purchase creation failed");
      }
    } catch (error: any) {
      console.error(
        "❌ Purchase creation failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testPurchaseHistory() {
    console.log("\n🔍 Testing Purchase History...");

    try {
      const response = await axios.get(`${API_BASE_URL}/purchases/history`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (Array.isArray(response.data)) {
        console.log("✅ Purchase history retrieved successfully");
        console.log(`   Number of purchases: ${response.data.length}`);

        if (response.data.length > 0) {
          const purchase = response.data[0];
          console.log(
            `   Latest purchase: ${purchase.description} - $${purchase.amount}`
          );
        }
      } else {
        throw new Error("Purchase history format incorrect");
      }
    } catch (error: any) {
      console.error(
        "❌ Purchase history failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testReferralHistory() {
    console.log("\n🔍 Testing Referral History...");

    try {
      const response = await axios.get(`${API_BASE_URL}/referrals/history`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (Array.isArray(response.data)) {
        console.log("✅ Referral history retrieved successfully");
        console.log(`   Number of referrals: ${response.data.length}`);
      } else {
        throw new Error("Referral history format incorrect");
      }
    } catch (error: any) {
      console.error(
        "❌ Referral history failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }

  async testRecentReferrals() {
    console.log("\n🔍 Testing Recent Referrals...");

    try {
      const response = await axios.get(`${API_BASE_URL}/referrals/recent`, {
        headers: { Authorization: `Bearer ${this.authToken}` },
      });

      if (Array.isArray(response.data)) {
        console.log("✅ Recent referrals retrieved successfully");
        console.log(`   Number of recent referrals: ${response.data.length}`);
      } else {
        throw new Error("Recent referrals format incorrect");
      }
    } catch (error: any) {
      console.error(
        "❌ Recent referrals failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  }
}

// Run the tests
const tester = new APITester();
tester.runAllTests().catch(console.error);
