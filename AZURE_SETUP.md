# Azure SharePoint Setup Instructions

## Setting Up Real SharePoint Authentication

To enable real SharePoint authentication instead of the current mock implementation, follow these steps:

### 1. Azure App Registration

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Fill in the details:
   - **Name**: "Spreadsheet Search Pro"
   - **Supported account types**: "Accounts in any organizational directory and personal Microsoft accounts"
   - **Redirect URI**: Select "Single-page application (SPA)" and enter `http://localhost:3000`

### 2. Configure API Permissions

After creating the app:
1. Go to **API permissions**
2. Click **Add a permission**
3. Select **Microsoft Graph**
4. Choose **Delegated permissions**
5. Add these permissions:
   - `User.Read`
   - `Files.Read.All`
   - `Files.ReadWrite.All`
   - `Sites.Read.All`
   - `Sites.ReadWrite.All`
6. Click **Grant admin consent** (if you have admin privileges)

### 3. Enable Implicit Flow

1. Go to **Authentication**
2. Under **Implicit grant and hybrid flows**, check:
   - ✅ Access tokens
   - ✅ ID tokens

### 4. Get Your Client ID

1. Go to **Overview**
2. Copy the **Application (client) ID**

### 5. Configure Your App

Create a `.env` file in your project root with:

```bash
REACT_APP_AZURE_CLIENT_ID=your-copied-client-id-here
```

### 6. Test the Integration

1. Restart your development server: `npm start`
2. Go to Settings page
3. Click "Connect to SharePoint"
4. You should see a Microsoft login popup
5. After login, you can paste SharePoint file URLs to load them

## Troubleshooting

### Common Issues:

**"AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"**
- Make sure your redirect URI in Azure matches exactly: `http://localhost:3000`

**"AADSTS65001: The user or administrator has not consented to use the application"**
- Make sure to grant admin consent in Azure Portal
- Or have users consent individually when they first sign in

**"Permission denied when accessing SharePoint files"**
- Ensure the user has access to the SharePoint site/file
- Check that all required Graph API permissions are granted

### SharePoint URL Format

The app expects SharePoint URLs in this format:
```
https://yourtenant.sharepoint.com/sites/sitename/Shared%20Documents/yourfile.xlsx
```

## Enterprise Environments (Company-Controlled Azure)

### If You Can't Grant Admin Consent:

**Option 1: Individual User Consent**
- Users can consent to basic permissions when they first sign in
- Often works for `User.Read` and `Files.Read.All`
- Test with your company account to see what's allowed

**Option 2: Reduced Permission Set**
Create an app with minimal permissions:
- `User.Read` only (just for authentication)
- `Files.Read` (instead of Files.Read.All)
- Skip Sites permissions initially

**Option 3: Request IT Approval**
- Share this documentation with your IT team
- Explain that it's read-only access to files the user already has access to
- Emphasize that no data is stored on external servers

### Testing in Restricted Environments:
1. Use your work Microsoft account
2. Try signing in - even if some permissions are denied, basic file access often works
3. If you can view a SharePoint file in your browser, the app can likely access it too

## Production Deployment

For production:
1. Add your production domain to redirect URIs in Azure
2. Update environment variables for production
3. Consider using environment-specific client IDs