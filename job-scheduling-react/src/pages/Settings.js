import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Checkbox,
} from '@mui/material';
import {
  Google as GoogleIcon,
  CalendarMonth as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Group as GroupIcon,
  PersonOutline as GuestIcon,
} from '@mui/icons-material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import GoogleCalendarService from '../services/googleCalendar';
import ApiService from '../services/api';

// TabPanel component for tabs
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Settings = () => {
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [userList, setUserList] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [userPermissions, setUserPermissions] = useState({});
  const [guestAccess, setGuestAccess] = useState({
    enabled: false,
    canViewJobs: false,
    canViewEmployees: false,
    canViewReports: false,
  });
  const [guestAccessChanged, setGuestAccessChanged] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Check if there's a code parameter in URL (Google OAuth callback)
  useEffect(() => {
    const checkGoogleAuthCallback = async () => {
      const params = new URLSearchParams(location.search);
      const code = params.get('code');
      const state = params.get('state');
      
      // If there's a code and it's for Google Calendar
      if (code && state === 'google_calendar') {
        try {
          setLoading(true);
          setError('');
          const result = await GoogleCalendarService.connectWithAuthCode(code);
          setIsGoogleConnected(true);
          setSuccess('Successfully connected to Google Calendar');
          
          // Clear the URL parameters
          window.history.replaceState({}, document.title, '/settings');
        } catch (err) {
          console.error('Error connecting to Google Calendar:', err);
          setError('Failed to connect to Google Calendar: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };
    
    checkGoogleAuthCallback();
  }, [location]);

  // Check if user already has Google Calendar connected
  useEffect(() => {
    const checkGoogleCalendarConnection = async () => {
      try {
        setLoading(true);
        // Call API to check if Google Calendar is connected
        const response = await ApiService.getCalendarAuthUrl();
        setIsGoogleConnected(response.data.is_connected || false);
        setAutoSync(response.data.auto_sync || false);
      } catch (err) {
        console.error('Error checking Google Calendar connection:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      checkGoogleCalendarConnection();
    }
  }, [user]);

  // Fetch users when admin tab is selected
  useEffect(() => {
    const fetchUsers = async () => {
      if (tabValue === 1 && user && user.attributes?.userGroup === 'admin') {
        try {
          setLoading(true);
          const response = await ApiService.listUsers();
          setUserList(response.data || []);
        } catch (err) {
          console.error('Error fetching users:', err);
          setError('Failed to fetch users: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUsers();
  }, [tabValue, user]);

  // Fetch guest access settings
  useEffect(() => {
    const fetchGuestAccess = async () => {
      if (tabValue === 2 && user && (user.attributes?.userGroup === 'admin' || user.attributes?.userGroup === 'standard')) {
        try {
          setLoading(true);
          const response = await ApiService.getGuestAccess();
          if (response.data) {
            setGuestAccess(response.data);
          }
        } catch (err) {
          console.error('Error fetching guest access settings:', err);
          setError('Failed to fetch guest access settings: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGuestAccess();
  }, [tabValue, user]);

  // Fetch user permissions when a user is selected
  useEffect(() => {
    const fetchUserPermissions = async () => {
      if (selectedUser && user && user.attributes?.userGroup === 'admin') {
        try {
          setLoading(true);
          const response = await ApiService.getUserPermissions(selectedUser);
          setUserPermissions(response.data || {
            canViewAllJobs: false,
            canEditAllJobs: false,
            canAssignJobs: false,
            canManageUsers: false,
            canManageTeams: false,
            canViewReports: false,
            canManageGuestAccess: false,
          });
        } catch (err) {
          console.error('Error fetching user permissions:', err);
          setError('Failed to fetch user permissions: ' + err.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserPermissions();
  }, [selectedUser, user]);

  // Handle connect to Google Calendar
  const handleConnectGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      const authUrl = await GoogleCalendarService.getAuthUrl();
      window.location.href = authUrl;
    } catch (err) {
      console.error('Error getting Google Calendar auth URL:', err);
      setError('Failed to get Google Calendar authorization URL: ' + err.message);
      setLoading(false);
    }
  };

  // Handle disconnect from Google Calendar
  const handleDisconnectGoogle = async () => {
    try {
      setLoading(true);
      setError('');
      await GoogleCalendarService.disconnect();
      setIsGoogleConnected(false);
      setSuccess('Successfully disconnected from Google Calendar');
    } catch (err) {
      console.error('Error disconnecting from Google Calendar:', err);
      setError('Failed to disconnect from Google Calendar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle manual sync with Google Calendar
  const handleSyncCalendar = async () => {
    try {
      setIsSyncing(true);
      setError('');
      setSyncSuccess(false);
      await GoogleCalendarService.syncJobs();
      setSyncSuccess(true);
      setSuccess('Successfully synced jobs with Google Calendar');
    } catch (err) {
      console.error('Error syncing with Google Calendar:', err);
      setError('Failed to sync with Google Calendar: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle toggle for auto-sync
  const handleAutoSyncToggle = async (event) => {
    const newAutoSync = event.target.checked;
    try {
      // Call API to update auto-sync setting
      await ApiService.updateCalendarSettings({ auto_sync: newAutoSync });
      setAutoSync(newAutoSync);
      setSuccess(`Auto-sync ${newAutoSync ? 'enabled' : 'disabled'} successfully`);
    } catch (err) {
      console.error('Error updating auto-sync setting:', err);
      setError('Failed to update auto-sync setting: ' + err.message);
    }
  };

  // Handle user selection change
  const handleUserChange = (event) => {
    setSelectedUser(event.target.value);
  };

  // Handle permission change for a user
  const handlePermissionChange = (permission) => (event) => {
    setUserPermissions({
      ...userPermissions,
      [permission]: event.target.checked,
    });
  };

  // Save user permissions
  const handleSaveUserPermissions = async () => {
    try {
      setLoading(true);
      await ApiService.updateUserPermissions(selectedUser, userPermissions);
      setSuccess('User permissions updated successfully');
    } catch (err) {
      console.error('Error updating user permissions:', err);
      setError('Failed to update user permissions: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle guest access toggle
  const handleGuestAccessToggle = (field) => (event) => {
    setGuestAccess({
      ...guestAccess,
      [field]: event.target.checked,
    });
    setGuestAccessChanged(true);
  };

  // Save guest access settings
  const handleSaveGuestAccess = async () => {
    try {
      setLoading(true);
      await ApiService.updateGuestAccess(guestAccess);
      setSuccess('Guest access settings updated successfully');
      setGuestAccessChanged(false);
    } catch (err) {
      console.error('Error updating guest access:', err);
      setError('Failed to update guest access: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin
  const isAdmin = user?.attributes?.userGroup === 'admin';
  
  // Check if user can manage guest access
  const canManageGuestAccess = isAdmin || (user?.attributes?.userGroup === 'standard' && user?.permissions?.canManageGuestAccess);

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your application settings and integrations
        </Typography>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab label="Integrations" icon={<CalendarIcon />} iconPosition="start" />
          {isAdmin && <Tab label="User Management" icon={<SecurityIcon />} iconPosition="start" />}
          {canManageGuestAccess && <Tab label="Guest Access" icon={<GuestIcon />} iconPosition="start" />}
        </Tabs>
      </Box>

      {/* Integrations Tab */}
      <TabPanel value={tabValue} index={0}>
        {/* Google Calendar Integration */}
        <Paper elevation={3} sx={{ mb: 4 }}>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item>
                <CalendarIcon fontSize="large" color="primary" />
              </Grid>
              <Grid item xs>
                <Typography variant="h5">Google Calendar Integration</Typography>
                <Typography variant="body2" color="text.secondary">
                  Connect your Google Calendar to automatically sync jobs
                </Typography>
              </Grid>
              <Grid item>
                {isGoogleConnected ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body2" color="success.main">
                      Connected
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CancelIcon color="error" />
                    <Typography variant="body2" color="error.main">
                      Not Connected
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 2 }} />
            
            <Grid container spacing={2}>
              {isGoogleConnected ? (
                <>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<GoogleIcon />}
                      onClick={handleDisconnectGoogle}
                      disabled={loading}
                      fullWidth
                    >
                      {loading ? <CircularProgress size={24} /> : 'Disconnect Google Calendar'}
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<CalendarIcon />}
                      onClick={handleSyncCalendar}
                      disabled={isSyncing}
                      fullWidth
                    >
                      {isSyncing ? <CircularProgress size={24} color="inherit" /> : 'Sync Now'}
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={autoSync}
                          onChange={handleAutoSyncToggle}
                          color="primary"
                        />
                      }
                      label="Automatically sync new and updated jobs"
                    />
                  </Grid>
                </>
              ) : (
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<GoogleIcon />}
                    onClick={handleConnectGoogle}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? <CircularProgress size={24} color="inherit" /> : 'Connect Google Calendar'}
                  </Button>
                </Grid>
              )}
            </Grid>
          </Box>
        </Paper>
      </TabPanel>

      {/* User Management Tab - only for admins */}
      {isAdmin && (
        <TabPanel value={tabValue} index={1}>
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                User Permissions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage permissions for users in the system
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel id="user-select-label">Select User</InputLabel>
                    <Select
                      labelId="user-select-label"
                      value={selectedUser}
                      onChange={handleUserChange}
                      label="Select User"
                    >
                      <MenuItem value="">
                        <em>Select a user</em>
                      </MenuItem>
                      {userList.map((user) => (
                        <MenuItem key={user.id} value={user.id}>
                          {user.name} ({user.email}) - {user.userGroup}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              {selectedUser && (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                    Permissions
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canViewAllJobs || false}
                            onChange={handlePermissionChange('canViewAllJobs')}
                          />
                        }
                        label="Can view all jobs"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canEditAllJobs || false}
                            onChange={handlePermissionChange('canEditAllJobs')}
                          />
                        }
                        label="Can edit all jobs"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canAssignJobs || false}
                            onChange={handlePermissionChange('canAssignJobs')}
                          />
                        }
                        label="Can assign jobs"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canManageUsers || false}
                            onChange={handlePermissionChange('canManageUsers')}
                          />
                        }
                        label="Can manage users"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canManageTeams || false}
                            onChange={handlePermissionChange('canManageTeams')}
                          />
                        }
                        label="Can manage teams"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canViewReports || false}
                            onChange={handlePermissionChange('canViewReports')}
                          />
                        }
                        label="Can view reports"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={userPermissions.canManageGuestAccess || false}
                            onChange={handlePermissionChange('canManageGuestAccess')}
                          />
                        }
                        label="Can manage guest access"
                      />
                    </Grid>
                  </Grid>
                  
                  <Box sx={{ mt: 3 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSaveUserPermissions}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Permissions'}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Paper>
        </TabPanel>
      )}

      {/* Guest Access Tab - for admins and users with permission */}
      {canManageGuestAccess && (
        <TabPanel value={tabValue} index={isAdmin ? 2 : 1}>
          <Paper elevation={3} sx={{ mb: 4 }}>
            <Box sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Guest Access Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Configure what guest users can access in the system
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={guestAccess.enabled}
                        onChange={handleGuestAccessToggle('enabled')}
                        color="primary"
                      />
                    }
                    label="Enable Guest Access"
                  />
                </Grid>
                
                {guestAccess.enabled && (
                  <>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={guestAccess.canViewJobs}
                            onChange={handleGuestAccessToggle('canViewJobs')}
                          />
                        }
                        label="Can view jobs"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={guestAccess.canViewEmployees}
                            onChange={handleGuestAccessToggle('canViewEmployees')}
                          />
                        }
                        label="Can view employees"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={guestAccess.canViewReports}
                            onChange={handleGuestAccessToggle('canViewReports')}
                          />
                        }
                        label="Can view reports"
                      />
                    </Grid>
                  </>
                )}
              </Grid>
              
              <Box sx={{ mt: 3 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveGuestAccess}
                  disabled={loading || !guestAccessChanged}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Guest Access Settings'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </TabPanel>
      )}
    </DashboardLayout>
  );
};

export default Settings; 