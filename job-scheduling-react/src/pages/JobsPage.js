import React, { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper
} from '@mui/material';
import DashboardLayout from '../components/layouts/DashboardLayout';
import JobForm from '../components/jobs/JobForm';
import { useSyncContext } from '../contexts/SyncContext';
import { displayDateSA } from '../utils/dateUtils';
import '../pages/Dashboard.css';

const JobsPage = ({ action, filter }) => {
  const location = useLocation();
  const params = useParams();
  const { jobs, updateJobStatus, deleteJob } = useSyncContext();
  const [actionMenuOpen, setActionMenuOpen] = React.useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = React.useState(null);
  
  // For debugging - log more detailed information
  useEffect(() => {
    console.log('JobsPage rendered with:', { 
      action, 
      filter, 
      path: location.pathname,
      params,
      routeKey: location.key // Each unique location has a unique key
    });
  }, [action, filter, location, params]);

  // Action menu and status dropdown handlers
  const toggleActionMenu = (jobId) => {
    if (actionMenuOpen === jobId) {
      setActionMenuOpen(null);
    } else {
      setActionMenuOpen(jobId);
      // Close status dropdown if open
      setStatusDropdownOpen(null);
    }
  };

  const toggleStatusDropdown = (e, jobId) => {
    e.stopPropagation();
    if (statusDropdownOpen === jobId) {
      setStatusDropdownOpen(null);
    } else {
      setStatusDropdownOpen(jobId);
      // Close action menu if open
      setActionMenuOpen(null);
    }
  };

  // Handler for changing job status
  const handleStatusChange = (e, jobId, newStatus) => {
    e.stopPropagation();
    updateJobStatus(jobId, newStatus);
    setStatusDropdownOpen(null);
  };

  // Handler for View Details action
  const handleViewDetails = (jobId) => {
    setActionMenuOpen(null);
    window.location.href = `/jobs/${jobId}`;
  };

  // Handler for Edit action
  const handleEdit = (jobId) => {
    setActionMenuOpen(null);
    window.location.href = `/jobs/${jobId}/edit`;
  };

  // Handler for Start Job action
  const handleStartJob = (jobId) => {
    setActionMenuOpen(null);
    updateJobStatus(jobId, 'started');
  };

  // Handler for Finish Job action
  const handleFinishJob = (jobId) => {
    setActionMenuOpen(null);
    updateJobStatus(jobId, 'completed');
  };

  // Handler for Reopen Job action
  const handleReopenJob = (jobId) => {
    setActionMenuOpen(null);
    updateJobStatus(jobId, 'started');
  };

  // Handler for Delete action
  const handleDelete = (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      setActionMenuOpen(null);
      deleteJob(jobId);
    }
  };

  // Helper function to display assignment
  const getAssignmentDisplay = (job) => {
    return job.assignedTo === 'employee' ? job.employee : `Team: ${job.team}`;
  };

  // Render status with dropdown
  const renderStatus = (job, prefix = '') => {
    const dropdownId = prefix ? `${prefix}-${job.id}` : job.id;
    
    return (
      <div className="status-dropdown-container" onClick={(e) => e.stopPropagation()}>
        <span 
          className={`status-pill status-${job.status}`} 
          onClick={(e) => toggleStatusDropdown(e, dropdownId)}
        >
          {job.status}
        </span>
        {statusDropdownOpen === dropdownId && (
          <div className="status-dropdown">
            <button 
              className="status-dropdown-item status-pending-item" 
              onClick={(e) => handleStatusChange(e, job.id, 'pending')}
            >
              pending
            </button>
            <button 
              className="status-dropdown-item status-started-item" 
              onClick={(e) => handleStatusChange(e, job.id, 'started')}
            >
              started
            </button>
            <button 
              className="status-dropdown-item status-completed-item" 
              onClick={(e) => handleStatusChange(e, job.id, 'completed')}
            >
              completed
            </button>
          </div>
        )}
      </div>
    );
  };

  // Sort the jobs by status: pending, started, completed
  const sortedJobs = [...jobs].sort((a, b) => {
    const statusOrder = { pending: 1, started: 2, completed: 3 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  // Determine what content to show based on action or filter
  const renderContent = () => {
    // Use the URL to determine the mode if props are not provided
    const pathAction = location.pathname.includes('/add') ? 'add' : action;
    const pathFilter = location.pathname.includes('/today') ? 'today' : filter;
    
    console.log('Rendering content with:', { pathAction, pathFilter });
    
    if (pathAction === 'add') {
      return (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Add New Job
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Create a new job in the scheduling system
            </Typography>
          </Box>
          <JobForm />
        </Paper>
      );
    } else if (pathFilter === 'today') {
      return (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Today's Jobs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage jobs scheduled for today
            </Typography>
          </Box>
          <Typography>Today's jobs will be displayed here</Typography>
        </Paper>
      );
    } else {
      return (
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              All Jobs
            </Typography>
            <Typography variant="body1" color="text.secondary">
              View and manage all scheduled jobs
            </Typography>
          </Box>
          
          {/* Jobs Table */}
          <table className="job-table">
            <thead>
              <tr>
                <th>Job Card</th>
                <th>Assigned To</th>
                <th>Description</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Cost</th>
                <th>Invoiced</th>
                <th>Profit</th>
                <th>Margin</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.length > 0 ? (
                sortedJobs.map(job => (
                  <tr key={job.id} onClick={() => handleViewDetails(job.id)} className="clickable-row">
                    <td>{job.id}</td>
                    <td>{getAssignmentDisplay(job)}</td>
                    <td>{job.description}</td>
                    <td>{displayDateSA(job.startDate)}</td>
                    <td>{displayDateSA(job.endDate)}</td>
                    <td>
                      {renderStatus(job)}
                    </td>
                    <td>{job.cost}</td>
                    <td>{job.invoiced}</td>
                    <td>{job.profit}</td>
                    <td>{job.margin}</td>
                    <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                      <div className="action-menu-container">
                        <button className="action-menu-button" onClick={() => toggleActionMenu(job.id)}>...</button>
                        {actionMenuOpen === job.id && (
                          <div className="action-menu-dropdown">
                            <button className="action-menu-item" onClick={() => handleViewDetails(job.id)}>View Details</button>
                            <button className="action-menu-item" onClick={() => handleEdit(job.id)}>Edit</button>
                            {job.status === 'pending' && (
                              <button className="action-menu-item" onClick={() => handleStartJob(job.id)}>Start Job</button>
                            )}
                            {job.status === 'started' && (
                              <button className="action-menu-item" onClick={() => handleFinishJob(job.id)}>Finish Job</button>
                            )}
                            {job.status === 'completed' && (
                              <button className="action-menu-item" onClick={() => handleReopenJob(job.id)}>Reopen</button>
                            )}
                            <button className="action-menu-item" onClick={() => handleDelete(job.id)}>Delete</button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="11" className="empty-message">No jobs found</td>
                </tr>
              )}
            </tbody>
          </table>
        </Paper>
      );
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
};

export default JobsPage; 