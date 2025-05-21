import { Amplify } from 'aws-amplify';

// Define schema for Employee
const employeeSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  name: {
    type: 'String',
    required: true,
  },
  email: {
    type: 'String',
    required: true,
  },
  phone: {
    type: 'String',
    required: true,
  },
  isActive: {
    type: 'Boolean',
    defaultValue: true,
  },
  userGroup: {
    type: 'String',
    required: true,
    defaultValue: 'standard',
  },
};

// Define schema for Team
const teamSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  name: {
    type: 'String',
    required: true,
  },
};

// Define schema for EmployeeTeam (junction table for many-to-many)
const employeeTeamSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  teamId: {
    type: 'ID',
    required: true,
  },
  employeeId: {
    type: 'ID',
    required: true,
  },
};

// Define schema for Description
const descriptionSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  description: {
    type: 'String',
    required: true,
  },
  category: {
    type: 'String',
    required: false,
  },
};

// Define schema for Job
const jobSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  job_card_number: {
    type: 'String',
    required: true,
  },
  employeeId: {
    type: 'ID',
    required: true,
  },
  descriptionId: {
    type: 'ID',
    required: true,
  },
  start_date: {
    type: 'AWSDate',
    required: true,
  },
  end_date: {
    type: 'AWSDate',
    required: true,
  },
  status: {
    type: 'String',
    required: true,
    defaultValue: 'pending',
  },
  cost: {
    type: 'Float',
    required: true,
    defaultValue: 0.0,
  },
  invoiced_amount: {
    type: 'Float',
    required: true,
    defaultValue: 0.0,
  },
  profit: {
    type: 'Float',
    required: true,
    defaultValue: 0.0,
  },
  margin: {
    type: 'Float',
    required: true,
    defaultValue: 0.0,
  },
  googleCalendarEventId: {
    type: 'String',
    required: false,
  },
  createdBy: {
    type: 'ID',
    required: true,
  },
  assignedUsers: {
    type: 'List',
    itemType: 'ID',
    required: false,
  },
};

// Define schema for Actual
const actualSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  jobId: {
    type: 'ID',
    required: true,
  },
  cost: {
    type: 'Float',
    required: true,
  },
  completion_date: {
    type: 'AWSDateTime',
    required: true,
  },
};

// Define schema for UserPermissions
const userPermissionsSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  userId: {
    type: 'ID',
    required: true,
  },
  canViewAllJobs: {
    type: 'Boolean',
    defaultValue: false,
  },
  canEditAllJobs: {
    type: 'Boolean',
    defaultValue: false,
  },
  canAssignJobs: {
    type: 'Boolean',
    defaultValue: false,
  },
  canManageUsers: {
    type: 'Boolean',
    defaultValue: false,
  },
  canManageTeams: {
    type: 'Boolean',
    defaultValue: false,
  },
  canViewReports: {
    type: 'Boolean',
    defaultValue: false,
  },
  canManageGuestAccess: {
    type: 'Boolean',
    defaultValue: false,
  },
};

// Define schema for GuestAccess
const guestAccessSchema = {
  id: {
    type: 'ID',
    required: true,
  },
  enabled: {
    type: 'Boolean',
    defaultValue: false,
  },
  canViewJobs: {
    type: 'Boolean',
    defaultValue: false,
  },
  canViewEmployees: {
    type: 'Boolean',
    defaultValue: false,
  },
  canViewReports: {
    type: 'Boolean',
    defaultValue: false,
  },
  lastModifiedBy: {
    type: 'ID',
    required: true,
  },
  lastModifiedDate: {
    type: 'AWSDateTime',
    required: true,
  },
};

// Export Schema
export const schema = {
  Employee: employeeSchema,
  Team: teamSchema,
  EmployeeTeam: employeeTeamSchema,
  Description: descriptionSchema,
  Job: jobSchema,
  Actual: actualSchema,
  UserPermissions: userPermissionsSchema,
  GuestAccess: guestAccessSchema,
};

// Define authorization rules
export const authRules = {
  Employee: {
    // Admin can perform all operations
    // Standard users can read their own data and other employees assigned to the same jobs
    // Guest users can only view if given permission
    queries: {
      getEmployee: {
        roles: ['admin', 'standard', 'guest'],
        conditions: {
          admin: true, // No conditions for admin
          standard: (user, item) => user.sub === item.id || isAssignedToSameJob(user.sub, item.id),
          guest: (_, _2, context) => hasGuestPermission(context, 'canViewEmployees'),
        },
      },
      listEmployees: {
        roles: ['admin', 'standard', 'guest'],
        conditions: {
          admin: true, // No conditions for admin
          standard: true, // Standard users can list employees
          guest: (_, _2, context) => hasGuestPermission(context, 'canViewEmployees'),
        },
      },
    },
    mutations: {
      createEmployee: {
        roles: ['admin'],
      },
      updateEmployee: {
        roles: ['admin'],
        conditions: {
          standard: (user, item) => user.sub === item.id, // Standard users can update their own info
        },
      },
      deleteEmployee: {
        roles: ['admin'],
      },
    },
  },
  Job: {
    queries: {
      getJob: {
        roles: ['admin', 'standard', 'guest'],
        conditions: {
          admin: true, // No conditions for admin
          standard: (user, item) => user.sub === item.employeeId || isAssignedToJob(user.sub, item.id),
          guest: (_, _2, context) => hasGuestPermission(context, 'canViewJobs'),
        },
      },
      listJobs: {
        roles: ['admin', 'standard', 'guest'],
        conditions: {
          admin: true, // No conditions for admin
          standard: (user, _, context) => hasPermission(user.sub, 'canViewAllJobs') || filterJobsByEmployee(user.sub, context),
          guest: (_, _2, context) => hasGuestPermission(context, 'canViewJobs'),
        },
      },
    },
    mutations: {
      createJob: {
        roles: ['admin', 'standard'],
        conditions: {
          standard: (user, _) => hasPermission(user.sub, 'canAssignJobs'),
        },
      },
      updateJob: {
        roles: ['admin', 'standard'],
        conditions: {
          admin: true, // No conditions for admin
          standard: (user, item) => user.sub === item.employeeId || hasPermission(user.sub, 'canEditAllJobs'),
        },
      },
      deleteJob: {
        roles: ['admin'],
      },
    },
  },
  UserPermissions: {
    queries: {
      getUserPermissions: {
        roles: ['admin', 'standard'],
        conditions: {
          admin: true, // No conditions for admin
          standard: (user, item) => user.sub === item.userId,
        },
      },
      listUserPermissions: {
        roles: ['admin'],
      },
    },
    mutations: {
      createUserPermissions: {
        roles: ['admin'],
      },
      updateUserPermissions: {
        roles: ['admin'],
      },
      deleteUserPermissions: {
        roles: ['admin'],
      },
    },
  },
  GuestAccess: {
    queries: {
      getGuestAccess: {
        roles: ['admin', 'standard', 'guest'],
      },
      listGuestAccess: {
        roles: ['admin'],
      },
    },
    mutations: {
      createGuestAccess: {
        roles: ['admin'],
      },
      updateGuestAccess: {
        roles: ['admin'],
        conditions: {
          standard: (user, _) => hasPermission(user.sub, 'canManageGuestAccess'),
        },
      },
      deleteGuestAccess: {
        roles: ['admin'],
      },
    },
  },
};

// Utility functions for authorization checks
const isAssignedToSameJob = (userId, employeeId) => {
  // Logic to check if both users are assigned to the same job
  // Would be implemented in the resolver
  return false;
};

const isAssignedToJob = (userId, jobId) => {
  // Logic to check if user is assigned to the job
  // Would be implemented in the resolver
  return false;
};

const hasPermission = (userId, permission) => {
  // Logic to check user permissions
  // Would be implemented in the resolver
  return false;
};

const hasGuestPermission = (context, permission) => {
  // Logic to check guest permissions
  // Would be implemented in the resolver
  return false;
};

const filterJobsByEmployee = (userId, context) => {
  // Logic to filter jobs by employee ID
  // Would be implemented in the resolver
  return {};
};

export default schema; 