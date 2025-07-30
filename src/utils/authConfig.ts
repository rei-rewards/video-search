import { Configuration, PublicClientApplication } from '@azure/msal-browser';

// MSAL configuration for Microsoft 365 authentication
export const msalConfig: Configuration = {
  auth: {
    clientId: process.env.REACT_APP_AZURE_CLIENT_ID || 'demo-client-id', // Replace with your actual client ID
    authority: 'https://login.microsoftonline.com/fa7b1b5a-7b34-4387-94ae-d2c178decee1', // Adobe's tenant ID
    redirectUri: window.location.origin,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
};

// Check if Azure configuration is properly set up
export const isAzureConfigured = () => {
  const clientId = process.env.REACT_APP_AZURE_CLIENT_ID;
  console.log('Azure Client ID check:', {
    clientId,
    exists: !!clientId,
    notDefault: clientId !== 'your-azure-client-id-here',
    notDemo: clientId !== 'demo-client-id',
    isConfigured: !!(clientId && clientId !== 'your-azure-client-id-here' && clientId !== 'demo-client-id')
  });
  
  return clientId && 
         clientId !== 'your-azure-client-id-here' &&
         clientId !== 'demo-client-id';
};

// Initialize MSAL instance
export const msalInstance = new PublicClientApplication(msalConfig);

// SharePoint and Graph API scopes
// Full permissions (for admin-consented environments)
export const graphScopes = [
  'User.Read',
  'Files.Read.All',
  'Files.ReadWrite.All',
  'Sites.Read.All',
  'Sites.ReadWrite.All',
];

// Minimal permissions (for enterprise environments without admin consent)
export const minimalGraphScopes = [
  'User.Read',
  'Files.Read.All',
];

// Login request configuration
export const loginRequest = {
  scopes: ['User.Read'],
};

// Graph API request configuration for SharePoint
export const sharePointRequest = {
  scopes: process.env.REACT_APP_USE_MINIMAL_PERMISSIONS === 'true' ? minimalGraphScopes : graphScopes,
};