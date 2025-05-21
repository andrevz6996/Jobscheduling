import React, { createContext, useState, useEffect, useContext } from 'react';
import { Amplify } from 'aws-amplify';
import { 
  signIn as amplifySignIn, 
  signOut as amplifySignOut,
  getCurrentUser 
} from 'aws-amplify/auth';
import AuthService from '../services/auth';
import GoogleCalendarService from '../services/googleCalendar';
import ApiService from '../services/api';

// Check for test user in localStorage
const getTestUserFromStorage = () => {
  try {
    const testUserStr = localStorage.getItem('testUser');
    if (!testUserStr) return null;
    
    const testUser = JSON.parse(testUserStr);
    // Validate the test user object has required fields
    if (!testUser.username || !testUser.attributes || !testUser.isAuthenticated) {
      localStorage.removeItem('testUser');
      return null;
    }
    return testUser;
  } catch (error) {
    console.error('Error parsing test user from storage:', error);
    localStorage.removeItem('testUser');
    return null;
  }
};

// Create auth context
const AuthContext = createContext(null);

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  // Initialize auth by checking for current user
  const initAuth = async () => {
    try {
      setLoading(true);
      
      // First check if we have a test user in localStorage
      const testUser = getTestUserFromStorage();
      if (testUser) {
        console.log('Retrieved test user from localStorage');
        setUser(testUser);
        
        // Set default permissions for test user
        if (testUser.attributes?.userGroup === 'admin') {
          setUserPermissions({
            canViewAllJobs: true,
            canEditAllJobs: true,
            canAssignJobs: true,
            canManageUsers: true,
            canManageTeams: true,
            canViewReports: true,
            canManageGuestAccess: true,
          });
        } else if (testUser.attributes?.userGroup === 'standard') {
          setUserPermissions({
            canViewAllJobs: false,
            canEditAllJobs: false,
            canAssignJobs: false,
            canManageUsers: false,
            canManageTeams: false,
            canViewReports: true,
            canManageGuestAccess: false,
          });
        } else if (testUser.attributes?.userGroup === 'guest') {
          setUserPermissions({
            canViewAllJobs: false,
            canEditAllJobs: false,
            canAssignJobs: false,
            canManageUsers: false,
            canManageTeams: false,
            canViewReports: false,
            canManageGuestAccess: false,
          });
        }
        
        setLoading(false);
        return;
      }
      
      // Otherwise, check for real authenticated user
      const currentUser = await AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        
        // Fetch user permissions
        await fetchUserPermissions(currentUser);
      }
    } catch (err) {
      console.error('Error initializing auth:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user permissions from API
  const fetchUserPermissions = async (currentUser) => {
    try {
      // Only fetch permissions for authenticated users
      if (!currentUser || !currentUser.userId) return;
      
      // Fetch user permissions from API
      const response = await ApiService.getUserPermissions(currentUser.userId);
      
      if (response.data) {
        setUserPermissions(response.data);
      } else {
        // Set default permissions based on user group
        const userGroup = currentUser.attributes?.userGroup || 'standard';
        
        if (userGroup === 'admin') {
          setUserPermissions({
            canViewAllJobs: true,
            canEditAllJobs: true,
            canAssignJobs: true,
            canManageUsers: true,
            canManageTeams: true,
            canViewReports: true,
            canManageGuestAccess: true,
          });
        } else if (userGroup === 'standard') {
          setUserPermissions({
            canViewAllJobs: false,
            canEditAllJobs: false,
            canAssignJobs: false,
            canManageUsers: false,
            canManageTeams: false,
            canViewReports: true,
            canManageGuestAccess: false,
          });
        } else if (userGroup === 'guest') {
          // For guests, fetch guest access settings
          const guestAccessResponse = await ApiService.getGuestAccess();
          
          if (guestAccessResponse.data && guestAccessResponse.data.enabled) {
            setUserPermissions({
              canViewAllJobs: guestAccessResponse.data.canViewJobs,
              canEditAllJobs: false,
              canAssignJobs: false,
              canManageUsers: false,
              canManageTeams: false,
              canViewReports: guestAccessResponse.data.canViewReports,
              canManageGuestAccess: false,
            });
          } else {
            // Guest access disabled
            setUserPermissions({
              canViewAllJobs: false,
              canEditAllJobs: false,
              canAssignJobs: false,
              canManageUsers: false,
              canManageTeams: false,
              canViewReports: false,
              canManageGuestAccess: false,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching user permissions:', err);
    }
  };

  // Sign in user
  const login = async (email, password) => {
    try {
      setLoading(true);
      const signedInUser = await AuthService.signIn(email, password);
      
      // If this is our test user, save to localStorage
      if (email === 'test@example.com' && password === 'Test1234!') {
        console.log('Saving test user to localStorage');
        // Set test user as admin
        if (!signedInUser.attributes) {
          signedInUser.attributes = {};
        }
        signedInUser.attributes.userGroup = 'admin';
        localStorage.setItem('testUser', JSON.stringify(signedInUser));
      }
      
      setUser(signedInUser);
      
      // Fetch user permissions for the signed-in user
      await fetchUserPermissions(signedInUser);
      
      return signedInUser;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign up user
  const signUp = async (email, password, name, userGroup = 'standard') => {
    try {
      setLoading(true);
      const result = await AuthService.signUp(email, password, { name, userGroup });
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm sign up
  const confirmSignUp = async (email, code) => {
    try {
      setLoading(true);
      const result = await AuthService.confirmSignUp(email, code);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Sign out user
  const signOut = async () => {
    try {
      setLoading(true);
      
      // Clear test user from localStorage if exists
      localStorage.removeItem('testUser');
      
      await AuthService.signOut();
      setUser(null);
      setUserPermissions(null);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      setLoading(true);
      return await AuthService.resetPassword(email);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Confirm new password
  const confirmResetPassword = async (email, code, newPassword) => {
    try {
      setLoading(true);
      return await AuthService.confirmNewPassword(email, code, newPassword);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Connect to Google Calendar
  const connectGoogleCalendar = async () => {
    try {
      setLoading(true);
      const authUrl = await GoogleCalendarService.getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Handle Google OAuth redirect callback
  const handleGoogleCalendarRedirect = async (code) => {
    try {
      setLoading(true);
      return await GoogleCalendarService.connectWithAuthCode(code);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Create a new user (admin only)
  const createUser = async (userData) => {
    try {
      setLoading(true);
      
      // Check if current user is admin
      if (!user || user.attributes?.userGroup !== 'admin') {
        throw new Error('Only admins can create new users');
      }
      
      const result = await AuthService.createUser(userData);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Check if user has a specific permission
  const hasPermission = (permission) => {
    if (!userPermissions) return false;
    return !!userPermissions[permission];
  };

  // Check if user is in a specific group
  const isInGroup = (group) => {
    if (!user || !user.attributes) return false;
    return user.attributes.userGroup === group;
  };

  // Set up auth change listeners
  useEffect(() => {
    // Initialize authentication
    initAuth();
    
    // Set up event handlers for auth state changes
    const handleAuthStateChange = async () => {
      try {
        // First check for test user
        const testUser = getTestUserFromStorage();
        if (testUser) {
          // Only update user state if it has changed
          if (!user || user.username !== testUser.username) {
            setUser(testUser);
          }
          return;
        }
        
        // Then check for actual authenticated user
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Only update user state if it has changed
          if (!user || user.username !== currentUser.username) {
            setUser(currentUser);
            // Handle post-sign-in actions (Google Calendar)
            await AuthService.handlePostSignIn();
            // Fetch user permissions
            await fetchUserPermissions(currentUser);
          }
        } else if (user) {
          // Only clear user if we currently have one
          setUser(null);
          setUserPermissions(null);
        }
      } catch (error) {
        console.log('No authenticated user');
        if (user) {
          setUser(null);
          setUserPermissions(null);
        }
      }
    };
    
    // Call the handler initially and set up periodic checks
    handleAuthStateChange();
    const interval = setInterval(handleAuthStateChange, 30000);
    
    return () => clearInterval(interval);
  }, [user]); // Add user as a dependency to properly track state changes

  const value = {
    user,
    loading,
    error,
    userPermissions,
    login,
    signUp,
    confirmSignUp,
    signOut,
    resetPassword,
    confirmResetPassword,
    connectGoogleCalendar,
    handleGoogleCalendarRedirect,
    createUser,
    hasPermission,
    isInGroup,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 