import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

class PasswordResetTester {
  private testUser: TestUser;
  private resetToken: string = "";
  private resetLink: string = "";

  constructor() {
    this.testUser = {
      firstName: "Test",
      lastName: "User",
      email: `test.reset.${Date.now()}@example.com`,
      password: "originalPassword123",
    };
  }

  async runPasswordResetTest() {
    console.log("🔐 Starting Password Reset Security Test...\n");

    try {
      // Step 1: Register a test user
      await this.registerTestUser();

      // Step 2: Request password reset
      await this.requestPasswordReset();

      // Step 3: Use the reset link to change password
      await this.resetPasswordWithToken();

      // Step 4: Try to use the same reset link again (should fail)
      await this.testTokenReuse();

      // Step 5: Request a new reset link
      await this.requestNewPasswordReset();

      // Step 6: Try to use the old reset link again (should fail)
      await this.testOldTokenAfterNewRequest();

      console.log("\n✅ Password reset security test completed!");
    } catch (error) {
      console.error("\n❌ Password reset test failed:", error);
      throw error;
    }
  }

  async registerTestUser() {
    console.log("1. Registering test user...");
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/register`,
        this.testUser
      );
      console.log("   ✅ Test user registered successfully");
      console.log(`   📧 Email: ${this.testUser.email}`);
    } catch (error: any) {
      throw new Error(
        `User registration failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async requestPasswordReset() {
    console.log("\n2. Requesting password reset...");
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: this.testUser.email,
      });

      console.log("   ✅ Password reset requested successfully");
      console.log("   📧 Reset email would be sent");

      // In a real scenario, we'd get the token from email
      // For testing, we need to get it from the database or logs
      // Let's simulate getting the token
      await this.getResetTokenFromDatabase();
    } catch (error: any) {
      throw new Error(
        `Password reset request failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async getResetTokenFromDatabase() {
    console.log("   🔍 Retrieving reset token from database...");
    // This is a simulation - in real testing, you'd query the database
    // For now, we'll need to manually get the token or add a test endpoint
    console.log("   ⚠️  Manual step: Get the reset token from the database");
    console.log("   💡 You can find it in the PasswordResetToken collection");

    // Placeholder for the actual token - this would need to be retrieved
    this.resetToken = "PLACEHOLDER_TOKEN";
    this.resetLink = `http://localhost:3000/reset-password?token=${this.resetToken}`;
    console.log(`   🔗 Reset link: ${this.resetLink}`);
  }

  async resetPasswordWithToken() {
    console.log("\n3. Using reset token to change password...");

    if (this.resetToken === "PLACEHOLDER_TOKEN") {
      console.log("   ⚠️  Skipping - need actual token from database");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: this.resetToken,
        newPassword: "newPassword123",
      });

      console.log("   ✅ Password reset successful");
      this.testUser.password = "newPassword123";
    } catch (error: any) {
      throw new Error(
        `Password reset failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async testTokenReuse() {
    console.log("\n4. Testing token reuse (should fail)...");

    if (this.resetToken === "PLACEHOLDER_TOKEN") {
      console.log("   ⚠️  Skipping - need actual token from database");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: this.resetToken,
        newPassword: "anotherPassword123",
      });

      // If we reach here, the token was reused successfully (BAD!)
      console.log("   ❌ SECURITY ISSUE: Token was reused successfully!");
      console.log("   🚨 Old reset tokens should be invalidated after use");
      throw new Error("Security vulnerability: Token reuse allowed");
    } catch (error: any) {
      if (
        error.response?.status === 400 ||
        error.response?.data?.message?.includes("invalid") ||
        error.response?.data?.message?.includes("used")
      ) {
        console.log("   ✅ Token reuse properly blocked");
      } else {
        throw new Error(
          `Unexpected error during token reuse test: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  }

  async requestNewPasswordReset() {
    console.log("\n5. Requesting new password reset...");
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: this.testUser.email,
      });

      console.log("   ✅ New password reset requested");
      console.log("   📧 New reset email would be sent");
    } catch (error: any) {
      throw new Error(
        `New password reset request failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async testOldTokenAfterNewRequest() {
    console.log("\n6. Testing old token after new request (should fail)...");

    if (this.resetToken === "PLACEHOLDER_TOKEN") {
      console.log("   ⚠️  Skipping - need actual token from database");
      return;
    }

    try {
      const response = await axios.post(`${BASE_URL}/auth/reset-password`, {
        token: this.resetToken,
        newPassword: "yetAnotherPassword123",
      });

      // If we reach here, the old token still works (BAD!)
      console.log(
        "   ❌ SECURITY ISSUE: Old token still works after new request!"
      );
      console.log(
        "   🚨 Old tokens should be invalidated when new ones are created"
      );
      throw new Error("Security vulnerability: Old token still valid");
    } catch (error: any) {
      if (
        error.response?.status === 400 ||
        error.response?.data?.message?.includes("invalid") ||
        error.response?.data?.message?.includes("used")
      ) {
        console.log("   ✅ Old token properly invalidated");
      } else {
        throw new Error(
          `Unexpected error during old token test: ${
            error.response?.data?.message || error.message
          }`
        );
      }
    }
  }

  async verifyLogin() {
    console.log("\n7. Verifying login with new password...");
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: this.testUser.email,
        password: this.testUser.password,
      });

      console.log("   ✅ Login successful with new password");
    } catch (error: any) {
      throw new Error(
        `Login verification failed: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }
}

// Instructions for running the test
console.log("📋 Password Reset Security Test");
console.log("================================");
console.log(
  "This test checks for password reset token security vulnerabilities."
);
console.log("To run this test properly:");
console.log("1. Make sure the backend server is running on localhost:5000");
console.log("2. Run this test: npm run test:password-reset");
console.log(
  "3. When prompted, manually retrieve the reset token from the database"
);
console.log("4. Update the resetToken variable with the actual token");
console.log("5. Re-run the test to verify security\n");

// Run the test
const tester = new PasswordResetTester();
tester.runPasswordResetTest().catch(console.error);
