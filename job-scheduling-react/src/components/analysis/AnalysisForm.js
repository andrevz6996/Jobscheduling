import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
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
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { format, parseISO, isBefore, isAfter, eachMonthOfInterval, eachWeekOfInterval, isWithinInterval, addDays } from 'date-fns';
import Chart from 'chart.js/auto';
import { useSyncContext } from '../../contexts/SyncContext';
import './AnalysisForm.css';

const AnalysisForm = () => {
  const { jobs, employees, teams } = useSyncContext();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Chart references
  const cumulativeChartRef = useRef(null);
  const marginChartRef = useRef(null);
  
  // Chart instances
  const [cumulativeChart, setCumulativeChart] = useState(null);
  const [marginChart, setMarginChart] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    filter_type: 'all', // 'all', 'employee', or 'team'
    employee_id: '',
    team_id: '',
    start_date: new Date('2024-01-01'),
    end_date: new Date('2024-12-31')
  });
  
  // Get team ID for a given employee
  const getEmployeeTeam = (employeeId) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? employee.teamId : null;
  };
  
  // Helper function to parse dates safely
  const parseDateSafely = (dateValue) => {
    if (!dateValue) return null;
    
    // If it's already a Date object
    if (dateValue instanceof Date) return dateValue;
    
    // If it's a string, parse it
    const parsedDate = new Date(dateValue);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  };

  // Filter jobs by date range and employee/team selection
  const filteredJobs = jobs.filter(job => {
    // Skip jobs with missing dates
    if (!job.startDate || !job.endDate) return false;
    
    const jobStart = parseDateSafely(job.startDate);
    const jobEnd = parseDateSafely(job.endDate);
    const rangeStart = parseDateSafely(formData.start_date);
    const rangeEnd = parseDateSafely(formData.end_date);
    
    // Check for valid dates
    if (!jobStart || !jobEnd || !rangeStart || !rangeEnd) return false;
    
    const inDateRange = jobEnd >= rangeStart && jobStart <= rangeEnd;
    
    // Filter based on selection type
    if (formData.filter_type === 'all') {
      return inDateRange;
    } else if (formData.filter_type === 'employee') {
      // Get the selected employee name
      const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
      const selectedEmployeeName = selectedEmployee ? selectedEmployee.name : '';
      
      // Compare with job.employee (which contains the name)
      return inDateRange && job.employee === selectedEmployeeName;
    } else if (formData.filter_type === 'team') {
      // Get the selected team name
      const selectedTeam = teams.find(team => team.id === formData.team_id);
      const selectedTeamName = selectedTeam ? selectedTeam.name : '';
      
      // Compare with job.team (which contains the name)
      return inDateRange && job.team === selectedTeamName;
    }
    
    return inDateRange;
  });

  // Console log for debugging
  console.log('Filtered Jobs:', filteredJobs);
  console.log('Filter Criteria:', formData);
  
  // Additional debugging for employee/team filtering
  if (formData.filter_type === 'employee') {
    const selectedEmployee = employees.find(emp => emp.id === formData.employee_id);
    console.log('Selected Employee:', selectedEmployee);
    console.log('Jobs with matching employee:', jobs.filter(job => job.employee === selectedEmployee?.name));
  } else if (formData.filter_type === 'team') {
    const selectedTeam = teams.find(team => team.id === formData.team_id);
    console.log('Selected Team:', selectedTeam);
    console.log('Jobs with matching team:', jobs.filter(job => job.team === selectedTeam?.name));
  }

  // Helper function to safely parse numeric values from job data
  const parseJobValue = (value, removePrefix = false) => {
    if (value === undefined || value === null) return 0;
    
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Remove currency symbol, percentage sign, and commas if needed
      let cleanValue = value;
      if (removePrefix) {
        cleanValue = value.replace(/[R%,\s]/g, '');
      }
      const parsed = parseFloat(cleanValue);
      return isNaN(parsed) ? 0 : parsed;
    }
    
    return 0;
  };

  // Calculate summary metrics from filteredJobs with more robust handling
  const totalJobs = filteredJobs.length;
  
  // Log details of job financial values for debugging
  console.log('Job financial details:', filteredJobs.map(job => ({
    id: job.id,
    cost: job.cost,
    parsedCost: parseJobValue(job.cost, true),
    invoiced: job.invoiced,
    parsedInvoiced: parseJobValue(job.invoiced, true),
    profit: job.profit, 
    parsedProfit: parseJobValue(job.profit, true),
    margin: job.margin,
    parsedMargin: parseJobValue(job.margin, true)
  })));
  
  const totalCost = filteredJobs.reduce((sum, job) => 
    sum + parseJobValue(job.cost, true), 0);
  
  const totalInvoiced = filteredJobs.reduce((sum, job) => 
    sum + parseJobValue(job.invoiced, true), 0);
  
  const totalProfit = filteredJobs.reduce((sum, job) => 
    sum + parseJobValue(job.profit, true), 0);
  
  const averageMargin = filteredJobs.length > 0
    ? (filteredJobs.reduce((sum, job) => 
        sum + parseJobValue(job.margin, true), 0) / filteredJobs.length)
    : 0;
    
  // Log calculated metrics
  console.log('Calculated metrics:', {
    totalJobs,
    totalCost,
    totalInvoiced,
    totalProfit,
    averageMargin
  });

  // Generate chart data intervals based on date range
  const generateChartIntervals = (startDate, endDate) => {
    const start = parseDateSafely(startDate);
    const end = parseDateSafely(endDate);
    
    if (!start || !end) {
      console.error('Invalid date range in generateChartIntervals:', startDate, endDate);
      return [new Date(), new Date()]; // Return current date as fallback
    }
    
    const diffInDays = Math.max(1, (end - start) / (1000 * 60 * 60 * 24));

    let intervals = [];
    try {
      if (diffInDays <= 31) {
        // Use weekly intervals for short ranges
        intervals = eachWeekOfInterval({ start, end });
      } else if (diffInDays <= 120) {
        // Use biweekly intervals for medium ranges
        intervals = eachWeekOfInterval({ start, end }).filter((_, i) => i % 2 === 0);
      } else {
        // Use monthly intervals for long ranges
        intervals = eachMonthOfInterval({ start, end });
      }

      // Make sure to include the end date if it's not already in intervals
      if (intervals.length === 0 || intervals[intervals.length - 1] < end) {
        intervals.push(end);
      }

      // Always make sure we have at least 2 intervals
      if (intervals.length < 2) {
        intervals = [start, end];
      }
    } catch (error) {
      console.error('Error generating intervals:', error, { start, end });
      intervals = [start, end]; // Fallback to simple range
    }

    return intervals;
  };

  // Generate chart data from filteredJobs
  const generateChartData = () => {
    // If no jobs, return empty chart data with at least two points
    if (filteredJobs.length === 0) {
      const start = parseDateSafely(formData.start_date);
      const end = parseDateSafely(formData.end_date);
      if (!start || !end) {
        console.error('Invalid date range:', formData.start_date, formData.end_date);
        return {
          labels: ['Start', 'End'],
          costData: [0, 0],
          revenueData: [0, 0],
          profitData: [0, 0],
          marginData: [0, 0]
        };
      }
      return {
        labels: [formatDateSafely(start), formatDateSafely(end)],
        costData: [0, 0],
        revenueData: [0, 0],
        profitData: [0, 0],
        marginData: [0, 0]
      };
    }
    
    // Log sorted dates of all filtered jobs for debugging
    console.log('Job dates:', filteredJobs.map(job => ({
      id: job.id,
      startDate: job.startDate,
      endDate: job.endDate,
      parsedStartDate: parseDateSafely(job.startDate),
      parsedEndDate: parseDateSafely(job.endDate)
    })).sort((a, b) => {
      if (!a.parsedEndDate) return -1;
      if (!b.parsedEndDate) return 1;
      return a.parsedEndDate - b.parsedEndDate;
    }));
    
    const intervals = generateChartIntervals(formData.start_date, formData.end_date);
    console.log('Chart intervals:', intervals.map(d => formatDateSafely(d)));
    
    let cumulativeCost = 0;
    let cumulativeRevenue = 0;
    let cumulativeProfit = 0;
    
    const labels = intervals.map(date => formatDateSafely(date));
    const costData = [];
    const revenueData = [];
    const profitData = [];
    const marginData = [];

    intervals.forEach((interval, index) => {
      // Get jobs that ended before or on this interval
      const jobsUntilInterval = filteredJobs.filter(job => {
        try {
          const jobEnd = parseDateSafely(job.endDate);
          return jobEnd && jobEnd <= interval;
        } catch (e) {
          console.error('Error processing job date:', job, e);
          return false;
        }
      });

      console.log(`Interval ${formatDateSafely(interval)}: ${jobsUntilInterval.length} jobs`);

      // Calculate cumulative metrics
      cumulativeCost = jobsUntilInterval.reduce((sum, job) => 
        sum + parseJobValue(job.cost, true), 0);
      
      cumulativeRevenue = jobsUntilInterval.reduce((sum, job) => 
        sum + parseJobValue(job.invoiced, true), 0);
      
      cumulativeProfit = jobsUntilInterval.reduce((sum, job) => 
        sum + parseJobValue(job.profit, true), 0);
      
      // Calculate interval margin
      const intervalJobs = jobsUntilInterval.filter(job => {
        if (index === 0) return true;
        try {
          const jobEnd = parseDateSafely(job.endDate);
          return jobEnd && jobEnd > intervals[index - 1] && jobEnd <= interval;
        } catch (e) {
          return false;
        }
      });
      
      const intervalMargin = intervalJobs.length > 0
        ? (intervalJobs.reduce((sum, job) => 
            sum + parseJobValue(job.margin, true), 0) / intervalJobs.length)
        : index > 0 ? marginData[index - 1] : 0; // Use previous margin if no new jobs
      
      costData.push(cumulativeCost);
      revenueData.push(cumulativeRevenue);
      profitData.push(cumulativeProfit);
      marginData.push(intervalMargin);
    });

    console.log('Chart data generated:', {
      labels,
      costData,
      revenueData,
      profitData,
      marginData
    });

    return {
      labels,
      costData,
      revenueData,
      profitData,
      marginData
    };
  };

  // Clean up charts when component unmounts
  useEffect(() => {
    return () => {
      destroyCharts();
    };
  }, []);

  // Initialize charts after component has rendered
  useEffect(() => {
    // Ensure charts are destroyed before trying to create new ones
    destroyCharts();
    
    // Only create charts if refs are available
    if (cumulativeChartRef.current && marginChartRef.current) {
      try {
        // Generate data from filtered jobs
        const { labels, profitData, costData, revenueData, marginData } = generateChartData();
        
        // Initialize cumulative chart
        const cumulativeCtx = cumulativeChartRef.current.getContext('2d');
        const newCumulativeChart = new Chart(cumulativeCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                label: 'Cumulative Profit',
                data: profitData,
                borderColor: '#10b981',
                backgroundColor: '#10b981',
                tension: 0.1,
                fill: false
              },
              {
                label: 'Cumulative Cost',
                data: costData,
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                tension: 0.1,
                fill: false
              },
              {
                label: 'Cumulative Revenue',
                data: revenueData,
                borderColor: '#3b82f6',
                backgroundColor: '#3b82f6',
                tension: 0.1,
                fill: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Cumulative Financial Metrics'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: value => 'R' + (value / 1000) + 'k'
                }
              }
            }
          }
        });
        
        setCumulativeChart(newCumulativeChart);
        
        // Initialize margin chart
        const marginCtx = marginChartRef.current.getContext('2d');
        const newMarginChart = new Chart(marginCtx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [{
              label: 'Margin %',
              data: marginData,
              borderColor: '#8b5cf6',
              backgroundColor: '#8b5cf6',
              tension: 0.1,
              fill: false
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Margin Trend'
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  callback: value => value.toFixed(1) + '%'
                }
              }
            }
          }
        });
        
        setMarginChart(newMarginChart);
      } catch (error) {
        console.error("Error creating charts:", error);
      }
    }
  }, [formData, filteredJobs.length]); // Include filteredJobs.length to update when jobs filter changes

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Reset employee or team selection when filter type changes
    if (name === 'filter_type') {
      if (value === 'all') {
        setFormData(prev => ({
          ...prev,
          filter_type: value,
          employee_id: '',
          team_id: ''
        }));
      } else if (value === 'employee') {
        setFormData(prev => ({
          ...prev,
          filter_type: value,
          team_id: '',
          employee_id: employees.length > 0 ? employees[0].id : ''
        }));
      } else if (value === 'team') {
        setFormData(prev => ({
          ...prev,
          filter_type: value,
          employee_id: '',
          team_id: teams.length > 0 ? teams[0].id : ''
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle date changes
  const handleDateChange = (name) => (date) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };

  // Destroy existing charts - enhanced to be more thorough
  const destroyCharts = () => {
    if (cumulativeChart) {
      cumulativeChart.destroy();
      setCumulativeChart(null);
    }
    if (marginChart) {
      marginChart.destroy();
      setMarginChart(null);
    }
    
    // Additional cleanup for any zombie chart instances
    if (cumulativeChartRef.current) {
      const canvas = cumulativeChartRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Ensure chart data is removed from canvas
      canvas.width = canvas.width;
    }
    
    if (marginChartRef.current) {
      const canvas = marginChartRef.current;
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      // Ensure chart data is removed from canvas
      canvas.width = canvas.width;
    }
  };
  
  // Handle form submission - update charts and data
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      try {
        console.log('Generating report with:', formData);
        setError('');
      } catch (err) {
        console.error('Error generating report:', err);
        setError('Failed to generate report. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500); // Simulate loading for 500ms
  };
  
  // Add dummy data if no jobs are in the system to demonstrate UI
  useEffect(() => {
    if (jobs.length === 0) {
      console.log('No jobs found, but using sync context instead of adding demo data');
      // We now use SyncContext's initialJobs instead of manually adding demo data here
    }
  }, [jobs, employees]);
  
  // Helper function to safely format dates
  const formatDateSafely = (dateValue, formatStr = 'yyyy-MM-dd') => {
    const parsedDate = parseDateSafely(dateValue);
    if (!parsedDate) return 'Invalid date';
    try {
      return format(parsedDate, formatStr);
    } catch (error) {
      console.error('Error formatting date:', error, dateValue);
      return 'Invalid date';
    }
  };
  
  useEffect(() => {
    // Log all jobs for debugging
    console.log('All available jobs:', jobs);
    console.log('All available employees:', employees);
    console.log('All available teams:', teams);
  }, [jobs, employees, teams]);
  
  return (
    <div>
      {error && <div className="error-message">{error}</div>}
      
      {/* Analysis Form */}
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="filter_type" className="form-label">Filter By</label>
              <select 
                id="filter_type"
                name="filter_type"
                value={formData.filter_type}
                onChange={handleChange}
                className="form-select"
              >
                <option value="all">All Jobs</option>
                <option value="employee">Employee</option>
                <option value="team">Team</option>
              </select>
            </div>
            
            {formData.filter_type === 'employee' && (
              <div className="form-group">
                <label htmlFor="employee" className="form-label">Select Employee</label>
                <select 
                  id="employee"
                  name="employee_id"
                  value={formData.employee_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {formData.filter_type === 'team' && (
              <div className="form-group">
                <label htmlFor="team" className="form-label">Select Team</label>
                <select 
                  id="team"
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="start_date" className="form-label">Start Date</label>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.start_date}
                  onChange={handleDateChange('start_date')}
                  inputFormat="yyyy-MM-dd"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="form-control"
                      style={{ width: '200px' }}
                    />
                  )}
                />
              </LocalizationProvider>
            </div>
            
            <div className="form-group">
              <label htmlFor="end_date" className="form-label">End Date</label>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  value={formData.end_date}
                  onChange={handleDateChange('end_date')}
                  inputFormat="yyyy-MM-dd"
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      className="form-control"
                      style={{ width: '200px' }}
                    />
                  )}
                />
              </LocalizationProvider>
            </div>
            
            <button 
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
            
            <Link to="/reports" className="btn-secondary">
              View All Reports
            </Link>
          </div>
        </form>
      </div>
      
      {/* Summary Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-title">Total Jobs</div>
          <div className="metric-value">{totalJobs}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Cost</div>
          <div className="metric-value">{'R' + totalCost.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Invoiced</div>
          <div className="metric-value">{'R' + totalInvoiced.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Total Profit</div>
          <div className="metric-value">{'R' + totalProfit.toFixed(2)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-title">Average Margin</div>
          <div className="metric-value">{averageMargin.toFixed(1) + '%'}</div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="charts-container">
        <div className="chart-card">
          <div className="chart-title">Cumulative Metrics Over Time</div>
          <canvas ref={cumulativeChartRef}></canvas>
        </div>
        
        <div className="chart-card">
          <div className="chart-title">Margin Trends</div>
          <canvas ref={marginChartRef}></canvas>
        </div>
      </div>
      
      {/* Jobs Table */}
      <table className="jobs-table">
        <thead>
          <tr>
            <th>Job Card</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Cost</th>
            <th>Invoiced</th>
            <th>Profit</th>
            <th>Margin</th>
          </tr>
        </thead>
        <tbody>
          {filteredJobs.map(job => (
            <tr key={job.id}>
              <td>{job.id}</td>
              <td>{formatDateSafely(job.startDate)}</td>
              <td>{formatDateSafely(job.endDate)}</td>
              <td>{typeof job.cost === 'string' ? job.cost : `R${job.cost.toFixed(2)}`}</td>
              <td>{typeof job.invoiced === 'string' ? job.invoiced : `R${job.invoiced.toFixed(2)}`}</td>
              <td>{typeof job.profit === 'string' ? job.profit : `R${job.profit.toFixed(2)}`}</td>
              <td>{typeof job.margin === 'string' ? job.margin : `${job.margin.toFixed(1)}%`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AnalysisForm; 