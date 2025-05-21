import React, { createContext, useState, useContext, useEffect } from 'react';

// Initial job data
const initialJobs = [
  {
    id: 'JOB-2024-001',
    employee: 'John Smith',
    team: '',
    assignedTo: 'employee',
    description: 'AC Maintenance',
    startDate: '2024-07-25',
    endDate: '2024-07-26',
    status: 'pending',
    cost: 'R 1500.00',
    invoiced: 'R 2200.00',
    profit: 'R 700.00',
    margin: '31.82%',
    clientName: 'Acme Corp',
    clientPhone: '555-123-4567',
    clientEmail: 'contact@acmecorp.com',
    address: '123 Main St, Johannesburg',
    notes: 'Annual maintenance for 3 office units.'
  },
  {
    id: 'JOB-2024-002',
    employee: '',
    team: 'Electrical Team',
    assignedTo: 'team',
    description: 'Electrical Repair',
    startDate: '2024-07-20',
    endDate: '2024-07-25',
    status: 'started',
    cost: 'R 2500.00',
    invoiced: 'R 3500.00',
    profit: 'R 1000.00',
    margin: '28.57%',
    clientName: 'XYZ Industries',
    clientPhone: '555-987-6543',
    clientEmail: 'support@xyzindustries.com',
    address: '456 Oak Avenue, Cape Town',
    notes: 'Factory circuit board replacement and wiring updates.'
  },
  {
    id: 'JOB-2024-003',
    employee: 'Mike Williams',
    team: '',
    assignedTo: 'employee',
    description: 'Plumbing Installation',
    startDate: '2024-07-15',
    endDate: '2024-07-18',
    status: 'completed',
    cost: 'R 3200.00',
    invoiced: 'R 4800.00',
    profit: 'R 1600.00',
    margin: '33.33%',
    clientName: 'Sunshine Hotels',
    clientPhone: '555-456-7890',
    clientEmail: 'maintenance@sunshinehotels.com',
    address: '789 Beach Road, Durban',
    notes: 'New bathroom fixtures for 5 hotel rooms.'
  }
];

// Initial teams data
const initialTeams = [
  { id: '1', name: 'Electrical Team' },
  { id: '2', name: 'HVAC Team' },
  { id: '3', name: 'Plumbing Team' }
];

// Initial employees data
const initialEmployees = [
  { id: '1', name: 'John Smith', email: 'john@example.com', phone: '555-123-4567', teamId: '1' },
  { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '555-987-6543', teamId: '2' },
  { id: '3', name: 'Mike Williams', email: 'mike@example.com', phone: '555-456-7890', teamId: '3' }
];

// Create the context
export const SyncContext = createContext();

// Create a provider component
export const SyncProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [teams, setTeams] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Initialize data from localStorage or use initial data
  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      
      // Load jobs
      const savedJobs = localStorage.getItem('jobs');
      if (savedJobs) {
        setJobs(JSON.parse(savedJobs));
      } else {
        setJobs(initialJobs);
      }
      
      // Load teams
      const savedTeams = localStorage.getItem('teams');
      if (savedTeams) {
        setTeams(JSON.parse(savedTeams));
      } else {
        setTeams(initialTeams);
      }
      
      // Load employees
      const savedEmployees = localStorage.getItem('employees');
      if (savedEmployees) {
        setEmployees(JSON.parse(savedEmployees));
      } else {
        setEmployees(initialEmployees);
      }
      
      setLoading(false);
    };
    
    loadData();
  }, []);
  
  // Save data to localStorage whenever they change
  useEffect(() => {
    if (jobs.length > 0) {
      localStorage.setItem('jobs', JSON.stringify(jobs));
    }
  }, [jobs]);
  
  useEffect(() => {
    if (teams.length > 0) {
      localStorage.setItem('teams', JSON.stringify(teams));
    }
  }, [teams]);
  
  useEffect(() => {
    if (employees.length > 0) {
      localStorage.setItem('employees', JSON.stringify(employees));
    }
  }, [employees]);
  
  // Fetch all data (for refreshing from API/mock data in the future)
  const fetchAllData = () => {
    setLoading(true);
    // In a real app, this would fetch from API
    // For now, just use the initial data if nothing in localStorage
    
    if (jobs.length === 0) {
      setJobs(initialJobs);
    }
    
    if (teams.length === 0) {
      setTeams(initialTeams);
    }
    
    if (employees.length === 0) {
      setEmployees(initialEmployees);
    }
    
    setLoading(false);
  };
  
  // Sync with backend (placeholder for future implementation)
  const syncWithAmplify = async () => {
    // This would be implemented to sync with backend
    return Promise.resolve();
  };
  
  // === JOB OPERATIONS ===
  
  // Get a job by ID
  const getJob = (jobId) => {
    return jobs.find(job => job.id === jobId) || null;
  };
  
  // Update a job
  const updateJob = (updatedJob) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );
  };
  
  // Add a new job
  const addJob = (newJob) => {
    setJobs(prevJobs => [...prevJobs, newJob]);
  };
  
  // Delete a job
  const deleteJob = (jobId) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };
  
  // Update job status
  const updateJobStatus = (jobId, newStatus) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === jobId ? { ...job, status: newStatus } : job
      )
    );
  };
  
  // === TEAM OPERATIONS ===
  
  // Add a team
  const addTeam = (newTeam) => {
    // Generate an ID if not provided
    if (!newTeam.id) {
      newTeam.id = `team-${Date.now()}`;
    }
    setTeams(prevTeams => [...prevTeams, newTeam]);
    return newTeam.id;
  };
  
  // Update a team
  const updateTeam = (teamId, updatedData) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, ...updatedData } : team
      )
    );
  };
  
  // Delete a team
  const deleteTeam = (teamId) => {
    setTeams(prevTeams => prevTeams.filter(team => team.id !== teamId));
  };
  
  // === EMPLOYEE OPERATIONS ===
  
  // Add an employee
  const addEmployee = (newEmployee) => {
    // Generate an ID if not provided
    if (!newEmployee.id) {
      newEmployee.id = `emp-${Date.now()}`;
    }
    setEmployees(prevEmployees => [...prevEmployees, newEmployee]);
    return newEmployee.id;
  };
  
  // Update an employee
  const updateEmployee = (employeeId, updatedData) => {
    setEmployees(prevEmployees => 
      prevEmployees.map(employee => 
        employee.id === employeeId ? { ...employee, ...updatedData } : employee
      )
    );
  };
  
  // Delete an employee
  const deleteEmployee = (employeeId) => {
    setEmployees(prevEmployees => prevEmployees.filter(employee => employee.id !== employeeId));
  };
  
  const value = {
    // Data
    jobs,
    teams,
    employees,
    loading,
    error,
    
    // Job operations
    getJob,
    updateJob,
    addJob,
    deleteJob,
    updateJobStatus,
    
    // Team operations
    addTeam,
    updateTeam,
    deleteTeam,
    
    // Employee operations
    addEmployee,
    updateEmployee,
    deleteEmployee,
    
    // Sync operations
    fetchAllData,
    syncWithAmplify
  };
  
  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

// Custom hook to use the SyncContext
export const useSyncContext = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSyncContext must be used within a SyncProvider');
  }
  return context;
};