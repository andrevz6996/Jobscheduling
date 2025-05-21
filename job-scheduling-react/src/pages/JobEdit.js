import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { formatDateSA, toSADateFormat, parseDateInput } from '../utils/dateUtils';
import { useSyncContext } from '../contexts/SyncContext';
import './JobEdit.css';

const JobEdit = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [assignmentType, setAssignmentType] = useState('employee');
  const [formData, setFormData] = useState({
    id: '',
    employee: '',
    team: '',
    assignedTo: 'employee', // 'employee' or 'team'
    description: '',
    startDate: '',
    endDate: '',
    status: '',
    cost: '',
    invoiced: '',
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    address: '',
    notes: ''
  });

  const { getJob, updateJob, teams, employees } = useSyncContext();

  // Format a date to the correct input format (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return toSADateFormat(dateString);
  };

  // Get job data from SyncContext
  useEffect(() => {
    const fetchJob = () => {
      setLoading(true);
      
      // Get job data from context
      const job = getJob(jobId);
      
      if (job) {
        // Ensure dates are in SA format
        const formattedJob = {
          ...job,
          startDate: formatDateForInput(job.startDate),
          endDate: formatDateForInput(job.endDate)
        };
        
        setFormData(formattedJob);
        setAssignmentType(formattedJob.assignedTo);
      } else {
        // Job not found
        alert('Job not found!');
        navigate('/');
      }
      
      setLoading(false);
    };

    fetchJob();
  }, [jobId, navigate, getJob]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    
    // Allow typing with or without hyphens
    let inputValue = value;
    
    // If user is typing digits without hyphens, add them automatically
    if (/^\d+$/.test(value)) {
      if (value.length > 4) {
        // Insert first hyphen after year (YYYY-MM)
        inputValue = value.substring(0, 4) + '-' + value.substring(4);
      }
      if (value.length > 6) {
        // Insert second hyphen after month (YYYY-MM-DD)
        inputValue = inputValue.substring(0, 7) + '-' + inputValue.substring(7);
      }
    }
    
    // Limit to 10 characters (YYYY-MM-DD)
    if (inputValue.length > 10) {
      inputValue = inputValue.substring(0, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
  };

  const handleDateBlur = (e) => {
    const { name, value } = e.target;
    
    // If empty, that's fine
    if (!value) return;
    
    // Check if the date matches YYYY-MM-DD format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      // If not in correct format, try to parse and format it
      const formattedDate = parseDateInput(value);
      
      if (formattedDate) {
        // Update with the properly formatted date
        setFormData(prev => ({
          ...prev,
          [name]: formattedDate
        }));
      } else {
        // If we can't parse it, alert the user
        alert(`Please enter the date in YYYY-MM-DD format (e.g., 2024-07-25)`);
        
        // Clear the invalid input
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    } else {
      // Validate the date components
      const [year, month, day] = value.split('-').map(Number);
      
      // Create a date object and check if it's valid
      const date = new Date(year, month - 1, day);
      if (
        date.getFullYear() !== year || 
        date.getMonth() !== month - 1 || 
        date.getDate() !== day
      ) {
        alert('Please enter a valid date');
        
        // Clear the invalid date
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    }
  };

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    setFormData(prev => ({
      ...prev,
      assignedTo: type,
      // Clear the other field when switching assignment types
      ...(type === 'employee' ? { team: '' } : { employee: '' })
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Ensure dates are in SA format before submission
    const updatedData = {
      ...formData,
      startDate: formatDateForInput(formData.startDate),
      endDate: formatDateForInput(formData.endDate)
    };
    
    // Update job in SyncContext
    updateJob(updatedData);
    
    alert('Job updated successfully!');
    navigate(`/jobs/${jobId}`);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleDateIconClick = (id) => {
    // Find the hidden date picker and click it
    const hiddenDatePicker = document.querySelector(`#${id}-picker`);
    if (hiddenDatePicker) {
      hiddenDatePicker.click();
    }
  };

  return (
    <DashboardLayout>
      <div className="job-edit-container">
        <div className="job-edit-header">
          <h1>Edit Job: {formData.id}</h1>
          <div className="job-edit-actions">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading job details...</div>
        ) : (
          <form className="job-edit-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-section">
                <h2>Job Information</h2>
                
                <div className="form-group">
                  <label htmlFor="description">Job Description</label>
                  <input
                    type="text"
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Assignment Type</label>
                  <div className="assignment-toggle">
                    <label className={`toggle-option ${assignmentType === 'employee' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="assignmentType"
                        value="employee"
                        checked={assignmentType === 'employee'}
                        onChange={() => handleAssignmentTypeChange('employee')}
                      />
                      <span>Assign to Employee</span>
                    </label>
                    <label className={`toggle-option ${assignmentType === 'team' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="assignmentType"
                        value="team"
                        checked={assignmentType === 'team'}
                        onChange={() => handleAssignmentTypeChange('team')}
                      />
                      <span>Assign to Team</span>
                    </label>
                  </div>
                </div>
                
                {assignmentType === 'employee' ? (
                  <div className="form-group">
                    <label htmlFor="employee">Employee</label>
                    <select
                      id="employee"
                      name="employee"
                      value={formData.employee}
                      onChange={handleChange}
                      required={assignmentType === 'employee'}
                    >
                      <option value="">Select Employee</option>
                      {employees.map(employee => (
                        <option key={employee.id} value={employee.name}>{employee.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label htmlFor="team">Team</label>
                    <select
                      id="team"
                      name="team"
                      value={formData.team}
                      onChange={handleChange}
                      required={assignmentType === 'team'}
                    >
                      <option value="">Select Team</option>
                      {teams.map(team => (
                        <option key={team.id} value={team.name}>{team.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="startDate">Start Date (YYYY-MM-DD)</label>
                    <div className="date-input-wrapper">
                      <input
                        type="text"
                        id="startDate"
                        name="startDate"
                        value={formData.startDate}
                        onChange={handleDateChange}
                        onBlur={handleDateBlur}
                        required
                        placeholder="YYYY-MM-DD"
                        pattern="\d{4}-\d{2}-\d{2}"
                        className="date-input"
                      />
                      <div className="date-picker-trigger" onClick={() => handleDateIconClick('startDate')}>
                        <input 
                          type="date" 
                          id="startDate-picker"
                          className="hidden-date-picker"
                          value={formData.startDate}
                          onChange={(e) => {
                            const formattedDate = toSADateFormat(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              startDate: formattedDate
                            }));
                          }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="date-icon">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                    </div>
                    <small className="date-format-hint">Format: YYYY-MM-DD</small>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="endDate">End Date (YYYY-MM-DD)</label>
                    <div className="date-input-wrapper">
                      <input
                        type="text"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleDateChange}
                        onBlur={handleDateBlur}
                        required
                        placeholder="YYYY-MM-DD"
                        pattern="\d{4}-\d{2}-\d{2}"
                        className="date-input"
                      />
                      <div className="date-picker-trigger" onClick={() => handleDateIconClick('endDate')}>
                        <input 
                          type="date" 
                          id="endDate-picker"
                          className="hidden-date-picker"
                          value={formData.endDate}
                          onChange={(e) => {
                            const formattedDate = toSADateFormat(e.target.value);
                            setFormData(prev => ({
                              ...prev,
                              endDate: formattedDate
                            }));
                          }}
                        />
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="date-icon">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                      </div>
                    </div>
                    <small className="date-format-hint">Format: YYYY-MM-DD</small>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h2>Financial Information</h2>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cost">Cost (R)</label>
                    <input
                      type="text"
                      id="cost"
                      name="cost"
                      value={formData.cost}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="invoiced">Invoiced Amount (R)</label>
                    <input
                      type="text"
                      id="invoiced"
                      name="invoiced"
                      value={formData.invoiced}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="form-section full-width">
                <h2>Client Information</h2>
                
                <div className="form-group">
                  <label htmlFor="clientName">Client Name</label>
                  <input
                    type="text"
                    id="clientName"
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="clientPhone">Phone</label>
                    <input
                      type="text"
                      id="clientPhone"
                      name="clientPhone"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="clientEmail">Email</label>
                    <input
                      type="email"
                      id="clientEmail"
                      name="clientEmail"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="form-section full-width">
                <h2>Notes</h2>
                <div className="form-group">
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="4"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Save Changes
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobEdit; 