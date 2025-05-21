import { Amplify } from 'aws-amplify';
import { authConfig } from './auth/resource';
import { schema, authRules } from './data/resource';

// Configure Amplify
export const configureAmplify = () => {
  Amplify.configure({
    Auth: authConfig,
    API: {
      GraphQL: {
        endpoint: process.env.REACT_APP_GRAPHQL_ENDPOINT,
        region: process.env.REACT_APP_AWS_REGION,
        defaultAuthMode: 'userPool',
        authorizationConfig: {
          authRules: authRules,
        },
      }
    },
    Storage: {
      region: process.env.REACT_APP_AWS_REGION,
      bucket: process.env.REACT_APP_S3_BUCKET,
    },
    DataStore: {
      schema: schema,
      errorHandler: (error) => {
        console.error('Amplify DataStore error', error);
      },
      authModes: {
        defaultMode: 'userPool',
        userPoolConfig: {
          userPoolId: process.env.REACT_APP_USER_POOL_ID,
        },
      },
    }
  });
}; 