import axios from 'axios';

const BASE_URL = 'http://localhost:5000/api';

interface TestUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  referralCode?: string;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: any;
    token: string;
  };
}

class APITester {
  private tokens: { [key: string]: string } = {};

  async runTests() {
    console.log('🚀 Starting API Tests...\n');

    try {
      // Test 1: Health Check
      await this.testHealthCheck();

      // Test 2: User Registration
      await this.testUserRegistration();

      // Test 3: User Login
      await this.testUserLogin();

      // Test 4: Profile Retrieval
      await this.testGetProfile();

      // Test 5: Referral Code Validation
      await this.testReferralCodeValidation();

      // Test 6: Referral Registration
      await this.testReferralRegistration();

      // Test 7: Referral Statistics
      await this.testReferralStats();

      // Test 8: Purchase Creation
      await this.testPurchaseCreation();

      // Test 9: Purchase History
      await this.testPurchaseHistory();

      // Test 10: Referral History
      await this.testReferralHistory();

      console.log('\n✅ All tests completed successfully!');
    } catch (error) {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('1. Testing Health Check...');
    try {
      const response = await axios.get('http://localhost:5000/health');
      console.log('   ✅ Health check passed:', response.data);
    } catch (error) {
      throw new Error(`Health check failed: ${error}`);
    }
  }

  async testUserRegistration() {
    console.log('2. Testing User Registration...');
    
    const testUser: TestUser = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: 'password123'
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, testUser);
      const data: AuthResponse = response.data;
      
      this.tokens.john = data.data.token;
      console.log('   ✅ User registration successful');
      console.log('   📝 User ID:', data.data.user.id);
      console.log('   🎫 Referral Code:', data.data.user.referralCode);
    } catch (error: any) {
      throw new Error(`User registration failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testUserLogin() {
    console.log('3. Testing User Login...');
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'john.doe@example.com',
        password: 'password123'
      });
      
      const data: AuthResponse = response.data;
      console.log('   ✅ User login successful');
      console.log('   👤 User:', data.data.user.firstName, data.data.user.lastName);
    } catch (error: any) {
      throw new Error(`User login failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testGetProfile() {
    console.log('4. Testing Get Profile...');
    
    try {
      const response = await axios.get(`${BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${this.tokens.john}` }
      });
      
      console.log('   ✅ Profile retrieval successful');
      console.log('   📊 Credits:', response.data.data.user.credits);
    } catch (error: any) {
      throw new Error(`Get profile failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testReferralCodeValidation() {
    console.log('5. Testing Referral Code Validation...');
    
    // First get John's referral code
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${this.tokens.john}` }
    });
    
    const referralCode = profileResponse.data.data.user.referralCode;
    
    try {
      const response = await axios.get(`${BASE_URL}/referrals/validate/${referralCode}`);
      console.log('   ✅ Referral code validation successful');
      console.log('   👤 Referrer:', response.data.data.referrer.firstName, response.data.data.referrer.lastName);
    } catch (error: any) {
      throw new Error(`Referral code validation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testReferralRegistration() {
    console.log('6. Testing Referral Registration...');
    
    // Get John's referral code
    const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${this.tokens.john}` }
    });
    
    const referralCode = profileResponse.data.data.user.referralCode;
    
    const referredUser: TestUser = {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: 'password123',
      referralCode: referralCode
    };

    try {
      const response = await axios.post(`${BASE_URL}/auth/register`, referredUser);
      const data: AuthResponse = response.data;
      
      this.tokens.jane = data.data.token;
      console.log('   ✅ Referral registration successful');
      console.log('   👤 Referred User:', data.data.user.firstName, data.data.user.lastName);
    } catch (error: any) {
      throw new Error(`Referral registration failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testReferralStats() {
    console.log('7. Testing Referral Statistics...');
    
    try {
      const response = await axios.get(`${BASE_URL}/referrals/stats`, {
        headers: { Authorization: `Bearer ${this.tokens.john}` }
      });
      
      console.log('   ✅ Referral stats retrieval successful');
      console.log('   📊 Total Referrals:', response.data.data.stats.totalReferrals);
      console.log('   ⏳ Pending Referrals:', response.data.data.stats.pendingReferrals);
    } catch (error: any) {
      throw new Error(`Referral stats failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testPurchaseCreation() {
    console.log('8. Testing Purchase Creation (by referred user)...');
    
    try {
      const response = await axios.post(`${BASE_URL}/purchases`, {
        productName: 'Premium Plan',
        amount: 99.99,
        currency: 'USD'
      }, {
        headers: { Authorization: `Bearer ${this.tokens.jane}` }
      });
      
      console.log('   ✅ Purchase creation successful');
      console.log('   💰 Amount:', response.data.data.purchase.amount);
      console.log('   🎁 Referral Credit:', response.data.data.purchase.referralCredit?.amount || 'None');
    } catch (error: any) {
      throw new Error(`Purchase creation failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testPurchaseHistory() {
    console.log('9. Testing Purchase History...');
    
    try {
      const response = await axios.get(`${BASE_URL}/purchases/history`, {
        headers: { Authorization: `Bearer ${this.tokens.jane}` }
      });
      
      console.log('   ✅ Purchase history retrieval successful');
      console.log('   📦 Total Purchases:', response.data.data.summary.totalPurchases);
      console.log('   💵 Total Spent:', response.data.data.summary.totalSpent);
    } catch (error: any) {
      throw new Error(`Purchase history failed: ${error.response?.data?.message || error.message}`);
    }
  }

  async testReferralHistory() {
    console.log('10. Testing Referral History...');
    
    try {
      const response = await axios.get(`${BASE_URL}/referrals/history`, {
        headers: { Authorization: `Bearer ${this.tokens.john}` }
      });
      
      console.log('   ✅ Referral history retrieval successful');
      console.log('   👥 Total Referrals:', response.data.data.pagination.totalReferrals);
      
      // Check updated referral stats after purchase
      const statsResponse = await axios.get(`${BASE_URL}/referrals/stats`, {
        headers: { Authorization: `Bearer ${this.tokens.john}` }
      });
      
      console.log('   📊 Updated Stats:');
      console.log('       - Successful Referrals:', statsResponse.data.data.stats.successfulReferrals);
      console.log('       - Total Credits:', statsResponse.data.data.stats.totalCredits);
    } catch (error: any) {
      throw new Error(`Referral history failed: ${error.response?.data?.message || error.message}`);
    }
  }
}

// Run tests
const tester = new APITester();
tester.runTests();