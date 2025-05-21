import { Amplify } from 'aws-amplify';

export const authConfig = {
  Cognito: {
    loginWith: {
      email: true,
      phone: false,
      username: false,
      oauth: {
        providers: ['Google'],
        scopes: ['email', 'profile', 'https://www.googleapis.com/auth/calendar'],
      }
    },
    passwordSettings: {
      minLength: 8,
      complexity: {
        requireNumbers: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSpecialCharacters: true,
      },
    },
    mfa: {
      status: 'optional',
      totpEnabled: true,
    },
    // Enable verification for email sign-up
    verificationMechanisms: ['email'],
    // Add user groups configuration
    userAttributes: {
      userGroup: {
        required: true,
        mutable: true,
      },
    },
    // Default new users to 'standard' group
    defaultUserAttributes: {
      userGroup: 'standard',
    },
    // Define the user groups
    userGroupsConfig: {
      groups: ['admin', 'standard', 'guest'],
      defaultGroup: 'standard',
    },
  }
}; 