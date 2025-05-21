import React, { useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { useSyncContext } from '../contexts/SyncContext';
import { displayDateSA } from '../utils/dateUtils';
import '../pages/Dashboard.css';

const ReportsPage = () => {
  const navigate = useNavigate();
  const { jobs } = useSyncContext();
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  
  // Filter completed jobs only
  const completedJobs = jobs.filter(job => job.status === 'completed');
  
  // Handler for View Details action
  const handleViewDetails = (jobId) => {
    setActionMenuOpen(null);
    navigate(`/jobs/${jobId}`);
  };
  
  // Toggle action menu
  const toggleActionMenu = (jobId) => {
    if (actionMenuOpen === jobId) {
      setActionMenuOpen(null);
    } else {
      setActionMenuOpen(jobId);
    }
  };
  
  // Helper function to display assignment
  const getAssignmentDisplay = (job) => {
    return job.assignedTo === 'employee' ? job.employee : `Team: ${job.team}`;
  };

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Completed Jobs Reports
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and analyze all completed jobs and their performance metrics.
        </Typography>
      </Box>

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
          {completedJobs.length > 0 ? (
            completedJobs.map(job => (
              <tr key={job.id} onClick={() => handleViewDetails(job.id)} className="clickable-row">
                <td>{job.id}</td>
                <td>{getAssignmentDisplay(job)}</td>
                <td>{job.description}</td>
                <td>{displayDateSA(job.startDate)}</td>
                <td>{displayDateSA(job.endDate)}</td>
                <td>
                  <span className="status-pill status-completed">completed</span>
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
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="empty-message">No completed jobs found</td>
            </tr>
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default ReportsPage; 