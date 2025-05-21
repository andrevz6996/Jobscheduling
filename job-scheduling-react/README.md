# Job Scheduling React App

This project is a React-based frontend for a job scheduling application, using AWS Amplify for authentication and data storage. It integrates with a Flask backend API for existing business logic.

## Features

- User authentication with email/password and Google social login
- Management of employees, teams, job descriptions, jobs, and actuals
- Google Calendar integration for job scheduling
- Comprehensive reporting and dashboard
- Real-time updates using Amplify DataStore

## Technology Stack

- React.js (Functional components and hooks)
- AWS Amplify (Authentication, DataStore, Storage)
- Material-UI for UI components
- Axios for API calls to Flask backend
- React Router for routing

## Project Structure

```
job-scheduling-react/
├── src/
│   ├── amplify/              # Amplify configuration
│   │   ├── auth/             # Authentication configuration
│   │   └── data/             # DataStore models
│   ├── components/           # React components
│   │   ├── auth/             # Authentication components
│   │   ├── common/           # Shared components
│   │   ├── employees/        # Employee management components
│   │   ├── teams/            # Team management components
│   │   ├── jobDescriptions/  # Job description components
│   │   ├── jobs/             # Job management components
│   │   ├── actuals/          # Actuals tracking components
│   │   ├── reports/          # Reporting components
│   │   └── layouts/          # Layout components
│   ├── contexts/             # React contexts
│   ├── hooks/                # Custom React hooks
│   ├── pages/                # Page components
│   ├── services/             # API and service integrations
│   └── utils/                # Utility functions
├── public/                   # Public assets
└── package.json              # Dependencies and scripts
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- npm or yarn
- AWS account
- Amplify CLI installed globally
- Flask backend running (existing API)

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd job-scheduling-react
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file based on `.env.example`
   - Fill in your AWS Amplify and API configuration

4. Initialize Amplify:
   ```
   amplify init
   ```

5. Add authentication:
   ```
   amplify add auth
   ```
   - Configure with email and social provider (Google)

6. Add API:
   ```
   amplify add api
   ```
   - Select GraphQL API
   - Use the schema defined in `src/amplify/data/resource.js`

7. Add storage for attachments:
   ```
   amplify add storage
   ```
   - Select S3 storage

8. Push Amplify resources:
   ```
   amplify push
   ```

9. Start the development server:
   ```
   npm start
   ```

## Migration Plan from Flask to AWS Amplify + React

### Step 1: Set up Amplify Models

1. Define Amplify models matching your SQLAlchemy models
2. Configure relationships between models
3. Configure authentication with email and Google social login

### Step 2: Set up React Frontend

1. Create React project structure
2. Implement authentication components
3. Implement layout and common components
4. Create service layer to communicate with Flask API
5. Implement main features as React components

### Step 3: Google Calendar Integration

1. Implement OAuth flow for Google Calendar
2. Create service for syncing jobs with calendar
3. Handle automatic sync on Google sign-in

### Step 4: Testing and Deployment

1. Test all features to ensure parity with Flask implementation
2. Deploy React frontend (using Amplify hosting)
3. Configure environment variables for production
4. Monitor transition and integration points

## Google Calendar Integration

The application allows two methods for connecting to Google Calendar:

1. **Automatic**: When users sign up/in with Google OAuth, their Google Calendar is automatically connected.
2. **Manual**: Users who sign up with email can manually connect their Google Calendar from the Settings page.

## License

[Your License Here]
