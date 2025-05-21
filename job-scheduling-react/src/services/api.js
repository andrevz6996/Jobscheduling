import axios from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';

// Set base URL for API
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include authentication token
api.interceptors.request.use(async (config) => {
  try {
    // Check if we have a test user in localStorage
    const testUserStr = localStorage.getItem('testUser');
    if (testUserStr) {
      const testUser = JSON.parse(testUserStr);
      // Use the test token for authentication
      if (testUser.tokens && testUser.tokens.idToken) {
        config.headers.Authorization = `Bearer ${testUser.tokens.idToken.toString()}`;
        return config;
      }
    }
    
    // Regular authentication flow
    const session = await fetchAuthSession();
    const token = session.tokens.idToken.toString();
    config.headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    // No authenticated user
    console.log('No authenticated user');
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// API service object with methods matching the Flask API
const ApiService = {
  // Jobs
  getTodaysJobs: () => api.get('/jobs/today'),
  addJob: (data) => api.post('/job', data),
  updateJobStatus: (data) => api.post('/job/status', data),
  getJobs: () => api.get('/jobs'),
  
  // Employees
  getEmployees: () => api.get('/employees'),
  addEmployee: (data) => api.post('/employee', data),
  deleteEmployee: (id) => api.delete(`/employee/${id}`),
  
  // Teams
  getTeams: () => api.get('/teams'),
  addTeam: (data) => api.post('/team', data),
  deleteTeam: (id) => api.delete(`/team/${id}`),
  
  // Descriptions
  getDescriptions: () => api.get('/descriptions'),
  addDescription: (data) => api.post('/description', data),
  deleteDescription: (id) => api.delete(`/description/${id}`),
  
  // User Management
  listUsers: () => api.get('/users'),
  getUserPermissions: (userId) => api.get(`/users/${userId}/permissions`),
  updateUserPermissions: (userId, permissions) => api.put(`/users/${userId}/permissions`, permissions),
  
  // Guest Access
  getGuestAccess: () => api.get('/settings/guest-access'),
  updateGuestAccess: (settings) => api.put('/settings/guest-access', settings),
  
  // Google Calendar
  getCalendarAuthUrl: () => api.get('/calendar/auth-url'),
  connectWithAuthCode: (code) => api.post('/calendar/connect', { code }),
  disconnect: () => api.delete('/calendar/connection'),
  syncJobs: () => api.post('/calendar/sync'),
  updateCalendarSettings: (settings) => api.put('/calendar/settings', settings),
  addToCalendar: (jobId) => api.post(`/job/${jobId}/calendar`),
  
  // Analysis
  getAnalysis: (params) => {
    const queryParams = new URLSearchParams();
    
    if (params.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    
    if (params.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    
    if (params.employee_id) {
      queryParams.append('employee_id', params.employee_id);
    }
    
    return api.get(`/analysis?${queryParams.toString()}`);
  },
  
  // Mock API for demo/development
  mockApi: {
    getTodaysJobs: () => {
      return Promise.resolve({
        data: {
          starting: [
            {
              id: 1,
              job_card_number: 'JOB-2024-001',
              employee: 'John Smith',
              description: 'AC Maintenance',
              start_date: '2024-07-25',
              end_date: '2024-07-26',
              status: 'pending',
              cost: 1500,
              invoiced_amount: 2200,
              profit: 700,
              margin: 31.82
            }
          ],
          finishing: [
            {
              id: 2,
              job_card_number: 'JOB-2024-002',
              employee: 'Sarah Johnson',
              description: 'Electrical Repair',
              start_date: '2024-07-20',
              end_date: '2024-07-25',
              status: 'started',
              cost: 2500,
              invoiced_amount: 3500,
              profit: 1000,
              margin: 28.57
            }
          ],
          overdue: [
            {
              id: 3,
              job_card_number: 'JOB-2024-003',
              employee: 'Michael Brown',
              description: 'Solar Installation',
              start_date: '2024-07-15',
              end_date: '2024-07-20',
              status: 'started',
              cost: 5000,
              invoiced_amount: 7500,
              profit: 2500,
              margin: 33.33
            }
          ]
        }
      });
    },
    getEmployees: () => {
      return Promise.resolve({
        data: [
          { id: 1, name: 'John Smith', email: 'john@example.com', phone: '0812345678' },
          { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '0823456789' },
          { id: 3, name: 'Michael Brown', email: 'michael@example.com', phone: '0834567890' }
        ]
      });
    },
    getTeams: () => {
      return Promise.resolve({
        data: [
          { id: 1, name: 'Electrical Team' },
          { id: 2, name: 'HVAC Team' },
          { id: 3, name: 'Solar Team' }
        ]
      });
    },
    getDescriptions: () => {
      return Promise.resolve({
        data: [
          { id: 1, description: 'AC Maintenance', category: 'Service' },
          { id: 2, description: 'Electrical Repair', category: 'Repair' },
          { id: 3, description: 'Solar Installation', category: 'Installation' },
          { id: 4, description: 'HVAC Inspection', category: 'Inspection' },
          { id: 5, description: 'Wiring Installation', category: 'Installation' },
          { id: 6, description: 'Generator Service', category: 'Service' }
        ]
      });
    },
    getAnalysis: () => {
      return Promise.resolve({
        data: {
          success: true,
          jobs: [
            {
              job_card_number: 'JOB-2024-001',
              start_date: '2024-07-01',
              end_date: '2024-07-02',
              cost: 1500,
              invoiced_amount: 2200,
              status: 'finished'
            },
            {
              job_card_number: 'JOB-2024-002',
              start_date: '2024-07-05',
              end_date: '2024-07-06',
              cost: 2500,
              invoiced_amount: 3500,
              status: 'finished'
            },
            {
              job_card_number: 'JOB-2024-003',
              start_date: '2024-07-10',
              end_date: '2024-07-12',
              cost: 5000,
              invoiced_amount: 7500,
              status: 'finished'
            }
          ],
          summary: {
            total_jobs: 3,
            total_cost: 9000,
            total_invoiced: 13200,
            total_profit: 4200,
            average_margin: 31.82
          }
        }
      });
    },
    getJobs: () => {
      return Promise.resolve({
        data: [
          {
            id: 1,
            job_card_number: 'JOB-2024-001',
            employee: 'John Smith',
            description: 'AC Maintenance',
            start_date: '2024-07-25',
            end_date: '2024-07-26',
            status: 'pending',
            cost: 1500,
            invoiced_amount: 2200,
            profit: 700,
            margin: 31.82
          },
          {
            id: 2,
            job_card_number: 'JOB-2024-002',
            employee: 'Sarah Johnson',
            description: 'Electrical Repair',
            start_date: '2024-07-20',
            end_date: '2024-07-25',
            status: 'started',
            cost: 2500,
            invoiced_amount: 3500,
            profit: 1000,
            margin: 28.57
          },
          {
            id: 3,
            job_card_number: 'JOB-2024-003',
            employee: 'Michael Brown',
            description: 'Solar Installation',
            start_date: '2024-07-15',
            end_date: '2024-07-20',
            status: 'finished',
            cost: 5000,
            invoiced_amount: 7500,
            profit: 2500,
            margin: 33.33
          }
        ]
      });
    },
    listUsers: () => {
      return Promise.resolve({
        data: [
          { id: 1, name: 'John Smith', email: 'john@example.com', userGroup: 'admin' },
          { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', userGroup: 'standard' },
          { id: 3, name: 'Michael Brown', email: 'michael@example.com', userGroup: 'standard' },
          { id: 4, name: 'Guest User', email: 'guest@example.com', userGroup: 'guest' }
        ]
      });
    },
    getUserPermissions: (userId) => {
      const permissions = {
        1: { // Admin
          canViewAllJobs: true,
          canEditAllJobs: true,
          canAssignJobs: true,
          canManageUsers: true,
          canManageTeams: true,
          canViewReports: true,
          canManageGuestAccess: true
        },
        2: { // Standard - Sarah
          canViewAllJobs: true,
          canEditAllJobs: false,
          canAssignJobs: true,
          canManageUsers: false,
          canManageTeams: true,
          canViewReports: true,
          canManageGuestAccess: false
        },
        3: { // Standard - Michael
          canViewAllJobs: false,
          canEditAllJobs: false,
          canAssignJobs: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: true,
          canManageGuestAccess: false
        },
        4: { // Guest
          canViewAllJobs: false,
          canEditAllJobs: false,
          canAssignJobs: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: false,
          canManageGuestAccess: false
        }
      };
      
      return Promise.resolve({
        data: permissions[userId] || {
          canViewAllJobs: false,
          canEditAllJobs: false,
          canAssignJobs: false,
          canManageUsers: false,
          canManageTeams: false,
          canViewReports: false,
          canManageGuestAccess: false
        }
      });
    },
    updateUserPermissions: (userId, permissions) => {
      return Promise.resolve({
        data: {
          success: true,
          message: `Permissions updated for user ${userId}`
        }
      });
    },
    getGuestAccess: () => {
      return Promise.resolve({
        data: {
          enabled: true,
          canViewJobs: true,
          canViewEmployees: false,
          canViewReports: false
        }
      });
    },
    updateGuestAccess: (settings) => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Guest access settings updated'
        }
      });
    },
    getCalendarAuthUrl: () => {
      return Promise.resolve({
        data: {
          url: 'https://accounts.google.com/o/oauth2/auth?example-params',
          is_connected: false,
          auto_sync: false
        }
      });
    },
    connectWithAuthCode: (code) => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Connected to Google Calendar'
        }
      });
    },
    disconnect: () => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Disconnected from Google Calendar'
        }
      });
    },
    syncJobs: () => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Jobs synced with Google Calendar',
          synced_count: 3
        }
      });
    },
    updateCalendarSettings: (settings) => {
      return Promise.resolve({
        data: {
          success: true,
          message: 'Calendar settings updated'
        }
      });
    }
  }
};

// For development, use the mock API
const isDevelopment = process.env.NODE_ENV === 'development';

// Export the API service with real or mock implementations
export default isDevelopment ? {
  ...ApiService,
  ...ApiService.mockApi
} : ApiService; 