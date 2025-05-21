import { 
  signIn, 
  signUp, 
  confirmSignUp, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession, 
  resetPassword, 
  confirmResetPassword 
} from 'aws-amplify/auth';
import GoogleCalendarService from './googleCalendar';

// Test user credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test1234!';

// Test user object for mocking authentication
const TEST_USER = {
  username: 'testuser',
  attributes: {
    email: TEST_EMAIL,
    given_name: 'Test',
    family_name: 'User',
    name: 'Test User',
    sub: 'test-user-id-123456789',
    'custom:auth_provider': 'email',
    email_verified: true
  },
  signInDetails: {
    loginId: TEST_EMAIL
  },
  // Add tokens for API calls
  tokens: {
    idToken: {
      toString: () => 'test-id-token'
    },
    accessToken: {
      toString: () => 'test-access-token'
    },
    refreshToken: {
      toString: () => 'test-refresh-token'
    }
  },
  isAuthenticated: true
};

/**
 * Authentication service for handling user authentication
 */
const AuthService = {
  /**
   * Sign in with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<Object>} Sign in result
   */
  signIn: async (email, password) => {
    try {
      // Check if using test credentials
      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        console.log('Using test user credentials');
        // Return the mocked test user
        return TEST_USER;
      }
      
      // Normal authentication flow
      const user = await signIn({ username: email, password });
      return user;
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },

  /**
   * Sign up with email, password and optional attributes
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {Object} attributes - Additional user attributes
   * @returns {Promise<Object>} Sign up result
   */
  signUp: async (email, password, attributes = {}) => {
    try {
      // Allow signing up with test email to create a test account
      if (email === TEST_EMAIL && password === TEST_PASSWORD) {
        return { user: TEST_USER, isSignUpComplete: true };
      }
      
      const result = await signUp({
        username: email,
        password,
        attributes: {
          email,
          ...attributes,
        },
      });
      return result;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },

  /**
   * Confirm sign up with verification code
   * @param {string} email - User's email
   * @param {string} code - Verification code
   * @returns {Promise<Object>} Confirmation result
   */
  confirmSignUp: async (email, code) => {
    try {
      // For test email, bypass verification
      if (email === TEST_EMAIL) {
        return { isSignUpComplete: true };
      }
      
      return await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      console.error('Error confirming sign up:', error);
      throw error;
    }
  },

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  signOut: async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },

  /**
   * Get current authenticated user
   * @returns {Promise<Object>} Current authenticated user
   */
  getCurrentUser: async () => {
    try {
      // Check if we have a test user in localStorage
      const testUserStr = localStorage.getItem('testUser');
      if (testUserStr) {
        const testUser = JSON.parse(testUserStr);
        return testUser;
      }
      
      return await getCurrentUser();
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  /**
   * Get current user session
   * @returns {Promise<Object>} Current user session
   */
  getCurrentSession: async () => {
    try {
      // Check if we have a test user in localStorage
      const testUserStr = localStorage.getItem('testUser');
      if (testUserStr) {
        // Return a mock session for the test user
        return {
          tokens: {
            idToken: {
              toString: () => 'test-id-token'
            },
            accessToken: {
              toString: () => 'test-access-token'
            }
          }
        };
      }
      
      return await fetchAuthSession();
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  },

  /**
   * Reset password
   * @param {string} email - User's email
   * @returns {Promise<Object>} Reset password result
   */
  resetPassword: async (email) => {
    try {
      // For test email, simulate success
      if (email === TEST_EMAIL) {
        return { destination: TEST_EMAIL };
      }
      
      return await resetPassword({ username: email });
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  },

  /**
   * Confirm new password after reset
   * @param {string} email - User's email
   * @param {string} code - Verification code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Confirmation result
   */
  confirmNewPassword: async (email, code, newPassword) => {
    try {
      // For test email, simulate success
      if (email === TEST_EMAIL) {
        return { success: true };
      }
      
      return await confirmResetPassword({ 
        username: email, 
        confirmationCode: code,
        newPassword
      });
    } catch (error) {
      console.error('Error confirming new password:', error);
      throw error;
    }
  },

  /**
   * Handle post-sign-in actions
   * Detects if user signed in with Google and attempts to connect to Google Calendar
   * @returns {Promise<Object>} Result of the post-sign-in actions
   */
  handlePostSignIn: async () => {
    try {
      const user = await getCurrentUser();
      
      // Check if the user signed in with Google
      if (user.attributes && user.attributes['custom:auth_provider'] === 'google') {
        // Attempt to connect Google Calendar
        return await GoogleCalendarService.connectAfterGoogleLogin();
      }
      
      return { message: 'No post sign-in actions needed' };
    } catch (error) {
      console.error('Error handling post sign-in:', error);
      return { error: error.message };
    }
  }
};

export default AuthService; 