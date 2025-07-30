# Quick Azure Client ID Setup for Adobe Users

## The Issue You're Seeing

You're getting this error because the app is using a demo Azure Client ID that doesn't exist in your Adobe organization:

```
AADSTS700016: Application with identifier 'demo-client-id' was not found in the directory 'Adobe'
```

## Quick Solutions

### Option 1: Use Public SharePoint Links (Recommended)

Instead of private file URLs, use **SharePoint sharing links**:

1. In SharePoint, right-click your file → **Share**
2. Set permissions to **"Anyone with the link"** or **"People in Adobe"**
3. Copy the sharing link (looks like: `https://adobe.sharepoint.com/:x:/s/sitename/EabcdefG...`)
4. Use this sharing link in the app

### Option 2: Set Up Your Own Azure Client ID

1. **Go to Azure Portal**: https://portal.azure.com (sign in with your Adobe account)
2. **Navigate to**: Azure Active Directory → App registrations
3. **Create New Registration**:
   - Name: "Personal Spreadsheet Tool"
   - Redirect URI: `http://localhost:3000` (Single-page application)
4. **Copy the Client ID** from the Overview page
5. **Create `.env` file** in your project root:
   ```
   REACT_APP_AZURE_CLIENT_ID=your-actual-client-id-here
   ```

### Option 3: Use Local File Upload Only

Skip SharePoint integration entirely and just use the file upload feature:
1. Go to Dashboard
2. Click "Upload Spreadsheet" 
3. Drag & drop your Excel/CSV files
4. Search works the same way

## For Adobe IT Restrictions

If your IT department blocks Azure app registrations:
- Use **Option 1** (public sharing links) - this usually works
- Request IT approval for a personal development app
- Use **Option 3** (local files only)

## Testing

After setup, restart the app and try again:
```bash
npm start
```