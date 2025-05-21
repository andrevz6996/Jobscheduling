import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { displayDateSA } from '../utils/dateUtils';
import { useSyncContext } from '../contexts/SyncContext';
import './JobDetails.css';

const JobDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const { getJob } = useSyncContext();

  // Fetch job data from SyncContext
  useEffect(() => {
    const fetchJob = () => {
      setLoading(true);
      
      // Get job data from context
      const jobData = getJob(jobId);
      
      if (jobData) {
        // Format dates for display
        const formattedJob = {
          ...jobData,
          startDate: displayDateSA(jobData.startDate),
          endDate: displayDateSA(jobData.endDate)
        };
        
        setJob(formattedJob);
      } else {
        // Job not found
        alert('Job not found!');
        navigate('/');
      }
      
      setLoading(false);
    };

    fetchJob();
  }, [jobId, navigate, getJob]);

  const handleEdit = () => {
    navigate(`/jobs/${jobId}/edit`);
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <DashboardLayout>
      {loading ? (
        <div className="loading">Loading job details...</div>
      ) : job ? (
        <div className="job-details-container">
          <div className="job-details-header">
            <h1>{job.id}: {job.description}</h1>
            <div className="job-details-actions">
              <button className="btn btn-primary" onClick={handleEdit}>Edit Job</button>
              <button className="btn btn-secondary" onClick={handleBack}>Back</button>
            </div>
          </div>
          
          <div className="job-status-bar">
            <span className={`status-badge status-${job.status}`}>{job.status}</span>
          </div>
          
          <div className="job-details-grid">
            <div className="job-details-card">
              <h2>Job Information</h2>
              <div className="job-info-grid">
                <div className="job-info-item">
                  <label>Assignment:</label>
                  <span>
                    {job.assignedTo === 'employee' 
                      ? `Employee: ${job.employee}` 
                      : `Team: ${job.team}`}
                  </span>
                </div>
                <div className="job-info-item">
                  <label>Start Date:</label>
                  <span>{job.startDate}</span>
                </div>
                <div className="job-info-item">
                  <label>End Date:</label>
                  <span>{job.endDate}</span>
                </div>
                <div className="job-info-item">
                  <label>Status:</label>
                  <span>{job.status}</span>
                </div>
              </div>
            </div>
            
            <div className="job-details-card">
              <h2>Financial Information</h2>
              <div className="job-info-grid">
                <div className="job-info-item">
                  <label>Cost:</label>
                  <span>{job.cost}</span>
                </div>
                <div className="job-info-item">
                  <label>Invoiced:</label>
                  <span>{job.invoiced}</span>
                </div>
                <div className="job-info-item">
                  <label>Profit:</label>
                  <span>{job.profit}</span>
                </div>
                <div className="job-info-item">
                  <label>Margin:</label>
                  <span>{job.margin}</span>
                </div>
              </div>
            </div>
            
            <div className="job-details-card full-width">
              <h2>Client Information</h2>
              <div className="job-info-grid">
                <div className="job-info-item">
                  <label>Client Name:</label>
                  <span>{job.clientName}</span>
                </div>
                <div className="job-info-item">
                  <label>Phone:</label>
                  <span>{job.clientPhone}</span>
                </div>
                <div className="job-info-item">
                  <label>Email:</label>
                  <span>{job.clientEmail}</span>
                </div>
                <div className="job-info-item">
                  <label>Address:</label>
                  <span>{job.address}</span>
                </div>
              </div>
            </div>
            
            <div className="job-details-card full-width">
              <h2>Notes</h2>
              <p className="job-notes">{job.notes}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="not-found">Job not found.</div>
      )}
    </DashboardLayout>
  );
};

export default JobDetails; 