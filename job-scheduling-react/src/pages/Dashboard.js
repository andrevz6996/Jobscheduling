import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { displayDateSA, toSADateFormat } from '../utils/dateUtils';
import { useSyncContext } from '../contexts/SyncContext';
import './Dashboard.css';

const Dashboard = () => {
  const [actionMenuOpen, setActionMenuOpen] = useState(null);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(null);
  const navigate = useNavigate();
  const { jobs, employees, teams, updateJobStatus, deleteJob } = useSyncContext();
  
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
    navigate(`/jobs/${jobId}`);
  };

  // Handler for Edit action
  const handleEdit = (jobId) => {
    setActionMenuOpen(null);
    navigate(`/jobs/${jobId}/edit`);
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

  // Get jobs starting today (using current date for comparison)
  const today = toSADateFormat(new Date());
  
  // Get jobs starting today - use pre-formatted date string for comparison
  const startingToday = jobs.filter(job => job.startDate === today && job.status === 'pending');
  
  // Get jobs finishing today - use pre-formatted date string for comparison
  const finishingToday = jobs.filter(job => job.endDate === today && job.status === 'started');

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

  return (
    <DashboardLayout>
      <h1 className="dashboard-title">Dashboard</h1>
      <p className="dashboard-subtitle">Welcome Test! Here's an overview of your job scheduling.</p>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">👤</span> Employees
          </div>
          <div className="stat-value">{employees.length}</div>
          <Link to="/manage/employees" className="stat-link">View All</Link>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">👥</span> Teams
          </div>
          <div className="stat-value">{teams.length}</div>
          <Link to="/manage/teams" className="stat-link">View All</Link>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">📁</span> Total Jobs
          </div>
          <div className="stat-value">{jobs.length}</div>
          <Link to="/jobs" className="stat-link">View All</Link>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-icon">✓</span> Completed Jobs
          </div>
          <div className="stat-value">{jobs.filter(job => job.status === 'completed').length}</div>
          <Link to="/reports" className="stat-link">View Reports</Link>
        </div>
      </div>

      {/* All Jobs Section */}
      <h2 className="section-title">All Jobs</h2>
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
          {jobs.map(job => (
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
          ))}
        </tbody>
      </table>

      {/* Starting Today Section */}
      <h2 className="section-title">Starting Today</h2>
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
          {startingToday.length > 0 ? (
            startingToday.map(job => (
              <tr key={`start-${job.id}`} onClick={() => handleViewDetails(job.id)} className="clickable-row">
                <td>{job.id}</td>
                <td>{getAssignmentDisplay(job)}</td>
                <td>{job.description}</td>
                <td>{displayDateSA(job.startDate)}</td>
                <td>{displayDateSA(job.endDate)}</td>
                <td>
                  {renderStatus(job, 'start')}
                </td>
                <td>{job.cost}</td>
                <td>{job.invoiced}</td>
                <td>{job.profit}</td>
                <td>{job.margin}</td>
                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="action-menu-container">
                    <button className="action-menu-button" onClick={() => toggleActionMenu(`start-${job.id}`)}>...</button>
                    {actionMenuOpen === `start-${job.id}` && (
                      <div className="action-menu-dropdown">
                        <button className="action-menu-item" onClick={() => handleViewDetails(job.id)}>View Details</button>
                        <button className="action-menu-item" onClick={() => handleEdit(job.id)}>Edit</button>
                        <button className="action-menu-item" onClick={() => handleStartJob(job.id)}>Start Job</button>
                        <button className="action-menu-item" onClick={() => handleDelete(job.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="empty-message">No jobs starting today</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Finishing Today Section */}
      <h2 className="section-title">Finishing Today</h2>
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
          {finishingToday.length > 0 ? (
            finishingToday.map(job => (
              <tr key={`finish-${job.id}`} onClick={() => handleViewDetails(job.id)} className="clickable-row">
                <td>{job.id}</td>
                <td>{getAssignmentDisplay(job)}</td>
                <td>{job.description}</td>
                <td>{displayDateSA(job.startDate)}</td>
                <td>{displayDateSA(job.endDate)}</td>
                <td>
                  {renderStatus(job, 'finish')}
                </td>
                <td>{job.cost}</td>
                <td>{job.invoiced}</td>
                <td>{job.profit}</td>
                <td>{job.margin}</td>
                <td className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <div className="action-menu-container">
                    <button className="action-menu-button" onClick={() => toggleActionMenu(`finish-${job.id}`)}>...</button>
                    {actionMenuOpen === `finish-${job.id}` && (
                      <div className="action-menu-dropdown">
                        <button className="action-menu-item" onClick={() => handleViewDetails(job.id)}>View Details</button>
                        <button className="action-menu-item" onClick={() => handleEdit(job.id)}>Edit</button>
                        <button className="action-menu-item" onClick={() => handleFinishJob(job.id)}>Finish Job</button>
                        <button className="action-menu-item" onClick={() => handleDelete(job.id)}>Delete</button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="11" className="empty-message">No jobs finishing today</td>
            </tr>
          )}
        </tbody>
      </table>
    </DashboardLayout>
  );
};

export default Dashboard; 