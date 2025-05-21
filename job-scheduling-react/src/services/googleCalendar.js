import ApiService from './api';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';

/**
 * Google Calendar Service for handling integration with Google Calendar
 */
const GoogleCalendarService = {
  /**
   * Get the Google Calendar authentication URL
   * @returns {Promise<string>} The authentication URL
   */
  getAuthUrl: async () => {
    try {
      const response = await ApiService.getCalendarAuthUrl();
      return response.data.auth_url;
    } catch (error) {
      console.error('Error getting Google Calendar auth URL:', error);
      throw error;
    }
  },

  /**
   * Connect to Google Calendar using the auth code
   * @param {string} authCode - The authorization code from Google OAuth
   * @returns {Promise<Object>} The connection result
   */
  connectWithAuthCode: async (authCode) => {
    try {
      const response = await ApiService.connectGoogleCalendar(authCode);
      return response.data;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      throw error;
    }
  },

  /**
   * Disconnect from Google Calendar
   * @returns {Promise<Object>} The disconnection result
   */
  disconnect: async () => {
    try {
      const response = await ApiService.disconnectGoogleCalendar();
      return response.data;
    } catch (error) {
      console.error('Error disconnecting from Google Calendar:', error);
      throw error;
    }
  },

  /**
   * Sync jobs with Google Calendar
   * @returns {Promise<Object>} The sync result
   */
  syncJobs: async () => {
    try {
      const response = await ApiService.syncWithGoogleCalendar();
      return response.data;
    } catch (error) {
      console.error('Error syncing with Google Calendar:', error);
      throw error;
    }
  },

  /**
   * Connect Google Calendar after initial Google OAuth login
   * This is used when the user logs in with Google OAuth
   * @returns {Promise<Object>} The connection result
   */
  connectAfterGoogleLogin: async () => {
    try {
      // Get the current auth user info
      const user = await getCurrentUser();
      
      // If the user signed in with Google, we can attempt to connect their calendar
      if (user.attributes['custom:auth_provider'] === 'google') {
        // Get user's access token if available
        const session = await fetchAuthSession();
        const accessToken = session.tokens.accessToken.toString();
        
        // Call the backend to connect with this token
        const response = await ApiService.connectGoogleCalendar(accessToken);
        return response.data;
      }
      
      return { message: 'User did not sign in with Google' };
    } catch (error) {
      console.error('Error connecting Google Calendar after login:', error);
      throw error;
    }
  }
};

export default GoogleCalendarService; 