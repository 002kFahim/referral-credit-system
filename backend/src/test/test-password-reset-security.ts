import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

async function testPasswordResetSecurity() {
  console.log("🔐 Testing Password Reset Security Fix...\n");

  const testEmail = `security.test.${Date.now()}@example.com`;
  const originalPassword = "originalPassword123";
  const newPassword = "newPassword123";

  try {
    // Step 1: Register a test user
    console.log("1. Registering test user...");
    await axios.post(`${BASE_URL}/auth/register`, {
      firstName: "Security",
      lastName: "Test",
      email: testEmail,
      password: originalPassword,
    });
    console.log("   ✅ User registered successfully");

    // Step 2: Request password reset
    console.log("\n2. Requesting password reset...");
    await axios.post(`${BASE_URL}/auth/forgot-password`, {
      email: testEmail,
    });
    console.log("   ✅ Password reset requested");
    console.log("   📧 Check the backend logs for the reset token");

    console.log("\n🔍 MANUAL TESTING REQUIRED:");
    console.log("1. Check the backend server logs for the reset token");
    console.log("2. Use the token to reset the password once");
    console.log("3. Try to use the same token again - it should fail");
    console.log("4. Request a new reset token");
    console.log("5. Try to use the old token - it should fail");

    console.log("\n📝 Expected behavior:");
    console.log("- First password reset should succeed");
    console.log(
      "- Second attempt with same token should fail with 'Token has already been used or expired'"
    );
    console.log("- After requesting new reset, old token should be invalid");
  } catch (error: any) {
    console.error("❌ Test failed:", error.response?.data || error.message);
  }
}

testPasswordResetSecurity();
