import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  TextField,
  MenuItem,
  Button,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  RadioGroup,
  Radio,
  Typography,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { useSyncContext } from '../../contexts/SyncContext';
import './JobForm.css';

const JobForm = () => {
  const { employees, teams, addJob } = useSyncContext();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    id: `JOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    employee: '',
    team: '',
    assignedTo: 'employee',
    description: '',
    startDate: null,
    endDate: null,
    status: 'pending',
    cost: '',
    invoiced: '',
    profit: '',
    margin: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    notes: ''
  });
  
  // Calculated fields
  const [calculatedFields, setCalculatedFields] = useState({
    profit: 0,
    margin: 0
  });
  
  // Update calculated fields when cost or invoiced amount changes
  useEffect(() => {
    const cost = parseFloat(formData.cost) || 0;
    const invoiced = parseFloat(formData.invoiced) || 0;
    
    const profit = invoiced - cost;
    const margin = invoiced > 0 ? (profit / invoiced * 100) : 0;
    
    setCalculatedFields({
      profit,
      margin
    });
    
    // Also update the formData
    setFormData(prev => ({
      ...prev,
      profit: `R ${profit.toFixed(2)}`,
      margin: `${margin.toFixed(2)}%`
    }));
  }, [formData.cost, formData.invoiced]);
  
  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle date changes
  const handleDateChange = (name, date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  // Handle assignment type change
  const handleAssignmentTypeChange = (e) => {
    const assignedTo = e.target.value;
    setFormData(prev => ({
      ...prev,
      assignedTo,
      // Clear the other assignment type when switching
      employee: assignedTo === 'employee' ? prev.employee : '',
      team: assignedTo === 'team' ? prev.team : ''
    }));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.id.trim()) {
      setError('Job card number is required');
      return;
    }
    
    if (formData.assignedTo === 'employee' && !formData.employee) {
      setError('Please select an employee');
      return;
    }
    
    if (formData.assignedTo === 'team' && !formData.team) {
      setError('Please select a team');
      return;
    }
    
    if (!formData.description.trim()) {
      setError('Job description is required');
      return;
    }
    
    if (!formData.startDate || !formData.endDate) {
      setError('Both start and end dates are required');
      return;
    }
    
    if (formData.startDate > formData.endDate) {
      setError('Start date cannot be after end date');
      return;
    }
    
    if (!formData.cost || parseFloat(formData.cost) <= 0) {
      setError('Please enter a valid cost amount');
      return;
    }
    
    if (!formData.invoiced || parseFloat(formData.invoiced) <= 0) {
      setError('Please enter a valid invoiced amount');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      // Prepare job data to match SyncContext format
      const jobData = {
        ...formData,
        startDate: formData.startDate instanceof Date ? formData.startDate.toISOString().split('T')[0] : formData.startDate,
        endDate: formData.endDate instanceof Date ? formData.endDate.toISOString().split('T')[0] : formData.endDate,
        cost: `R ${parseFloat(formData.cost).toFixed(2)}`,
        invoiced: `R ${parseFloat(formData.invoiced).toFixed(2)}`,
      };
      
      // Add job using SyncContext
      addJob(jobData);
      
      console.log('Job added:', jobData);
      
      // Reset form
      setFormData({
        id: `JOB-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        employee: '',
        team: '',
        assignedTo: 'employee',
        description: '',
        startDate: null,
        endDate: null,
        status: 'pending',
        cost: '',
        invoiced: '',
        profit: '',
        margin: '',
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        address: '',
        notes: ''
      });
      
      setSuccess('Job added successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      
    } catch (err) {
      console.error('Error adding job:', err);
      setError('Failed to add job. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format currency for display
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(value);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
      <CardHeader 
        title="Add New Job" 
        sx={{ 
          backgroundColor: '#f9fafb', 
          borderBottom: '1px solid #e5e7eb',
          '& .MuiCardHeader-title': {
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#111827'
          }
        }} 
      />
      <CardContent sx={{ padding: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#4b5563', fontWeight: 600 }}>
              Job Details
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Job Card Number"
                    name="id"
                    value={formData.id}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Job Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: '#6b7280' }}>
                    Assignment Type
                  </Typography>
                  <RadioGroup
                    row
                    name="assignedTo"
                    value={formData.assignedTo}
                    onChange={handleAssignmentTypeChange}
                    sx={{ mb: 2 }}
                  >
                    <FormControlLabel 
                      value="employee" 
                      control={<Radio />} 
                      label="Assign to Employee" 
                      sx={{ mr: 4 }}
                    />
                    <FormControlLabel 
                      value="team" 
                      control={<Radio />} 
                      label="Assign to Team" 
                    />
                  </RadioGroup>
                </Grid>
                
                {formData.assignedTo === 'employee' ? (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="employee-label">Employee</InputLabel>
                      <Select
                        labelId="employee-label"
                        id="employee"
                        name="employee"
                        value={formData.employee}
                        onChange={handleChange}
                        label="Employee"
                        required
                      >
                        <MenuItem value="">Select Employee</MenuItem>
                        {employees.map((employee) => (
                          <MenuItem key={employee.id} value={employee.name}>
                            {employee.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                ) : (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel id="team-label">Team</InputLabel>
                      <Select
                        labelId="team-label"
                        id="team"
                        name="team"
                        value={formData.team}
                        onChange={handleChange}
                        label="Team"
                        required
                      >
                        <MenuItem value="">Select Team</MenuItem>
                        {teams.map((team) => (
                          <MenuItem key={team.id} value={team.name}>
                            {team.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      label="Status"
                    >
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="started">Started</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Start Date"
                      value={formData.startDate}
                      onChange={(date) => handleDateChange('startDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          variant: "outlined"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="End Date"
                      value={formData.endDate}
                      onChange={(date) => handleDateChange('endDate', date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          required: true,
                          variant: "outlined"
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#4b5563', fontWeight: 600 }}>
              Financial Information
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Cost"
                    name="cost"
                    type="number"
                    value={formData.cost}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: 'R',
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Invoiced Amount"
                    name="invoiced"
                    type="number"
                    value={formData.invoiced}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    InputProps={{
                      startAdornment: 'R',
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Profit"
                    value={formatCurrency(calculatedFields.profit)}
                    variant="outlined"
                    disabled
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Margin"
                    value={`${calculatedFields.margin.toFixed(2)}%`}
                    variant="outlined"
                    disabled
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#4b5563', fontWeight: 600 }}>
              Client Information
            </Typography>
            <Paper sx={{ p: 3, borderRadius: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Client Name"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client Phone"
                    name="clientPhone"
                    value={formData.clientPhone}
                    onChange={handleChange}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client Email"
                    name="clientEmail"
                    value={formData.clientEmail}
                    onChange={handleChange}
                    variant="outlined"
                    type="email"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={2}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={3}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting}
              size="large"
              sx={{ 
                minWidth: '150px',
                fontSize: '1rem',
                py: 1,
                boxShadow: 2,
                '&:hover': {
                  boxShadow: 4
                }
              }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Add Job'}
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default JobForm; 