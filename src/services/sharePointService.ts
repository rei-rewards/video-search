import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';
import { Client } from '@microsoft/microsoft-graph-client';
import { msalInstance, graphScopes, minimalGraphScopes, loginRequest } from '../utils/authConfig';
import * as XLSX from 'xlsx';
import { SpreadsheetData } from '../store/appStore';

class SharePointService {
  private graphClient: Client | null = null;
  private account: AccountInfo | null = null;

  async initialize() {
    await msalInstance.initialize();
    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      this.account = accounts[0];
      this.setupGraphClient();
    }
  }

  async signIn() {
    try {
      const response = await msalInstance.loginPopup(loginRequest);
      this.account = response.account;
      this.setupGraphClient();
      return {
        id: this.account.localAccountId,
        name: this.account.name || '',
        email: this.account.username,
        accessToken: response.accessToken,
      };
    } catch (error) {
      console.error('SignIn failed:', error);
      throw error;
    }
  }

  async signOut() {
    if (this.account) {
      await msalInstance.logoutPopup({
        account: this.account,
      });
      this.account = null;
      this.graphClient = null;
    }
  }

  private setupGraphClient() {
    if (!this.account) return;

    this.graphClient = Client.init({
      authProvider: async (done) => {
        try {
          // Use minimal scopes for enterprise environments
          const scopes = process.env.REACT_APP_USE_MINIMAL_PERMISSIONS === 'true' ? minimalGraphScopes : graphScopes;
          const response = await msalInstance.acquireTokenSilent({
            scopes,
            account: this.account!,
          });
          done(null, response.accessToken);
        } catch (error) {
          console.error('Token acquisition failed:', error);
          done(error, null);
        }
      },
    });
  }

  // Load ALL worksheets from a SharePoint file URL (enhanced for multi-worksheet support)
  async loadAllWorksheetsFromUrl(fileUrl: string): Promise<SpreadsheetData[]> {
    // First, try loading without authentication for public/shared links
    try {
      return await this.loadAllWorksheetsDirectly(fileUrl);
    } catch (directError) {
      console.log('Direct download failed, trying authenticated access...', directError);
      
      // If direct download fails, try authenticated approach
      if (!this.graphClient) {
        throw new Error('File requires authentication. Please sign in to your Microsoft account first using the "Connect to SharePoint" button above.');
      }
    }

    try {
      // Extract the file path from SharePoint URL
      const urlPattern = /https:\/\/[^\/]+\/sites\/[^\/]+\/[^\/]+\/(.+)/;
      const match = fileUrl.match(urlPattern);
      
      if (!match) {
        throw new Error('Invalid SharePoint URL format');
      }

      // Get file metadata and download URL
      const fileInfo = await this.graphClient
        .api(`/me/drive/root:/${match[1]}`)
        .get();

      // Download the file content
      const fileContent = await this.graphClient
        .api(`/me/drive/items/${fileInfo.id}/content`)
        .getStream();

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileContent) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Parse all worksheets from the file
      const fileName = fileInfo.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      
      return this.parseAllWorksheetsFromBuffer(buffer, fileName, fileExtension, {
        lastModified: new Date(fileInfo.lastModifiedDateTime).getTime(),
        originalUrl: fileUrl,
        source: 'sharepoint'
      });
    } catch (error) {
      console.error('Failed to load file from SharePoint:', error);
      throw error;
    }
  }

  // Load single worksheet for backward compatibility
  async loadFileFromUrl(fileUrl: string): Promise<SpreadsheetData> {
    // First, try loading without authentication for public/shared links
    try {
      return await this.loadFileDirectly(fileUrl);
    } catch (directError) {
      console.log('Direct download failed, trying authenticated access...', directError);
      
      // If direct download fails, try authenticated approach
      if (!this.graphClient) {
        throw new Error('File requires authentication. Please sign in to your Microsoft account first using the "Connect to SharePoint" button above.');
      }
    }

    try {
      // Extract the file path from SharePoint URL
      const urlPattern = /https:\/\/[^\/]+\/sites\/[^\/]+\/[^\/]+\/(.+)/;
      const match = fileUrl.match(urlPattern);
      
      if (!match) {
        throw new Error('Invalid SharePoint URL format');
      }

      // Get file metadata and download URL
      const fileInfo = await this.graphClient
        .api(`/me/drive/root:/${match[1]}`)
        .get();

      // Download the file content
      const fileContent = await this.graphClient
        .api(`/me/drive/items/${fileInfo.id}/content`)
        .getStream();

      // Convert stream to buffer
      const chunks: Buffer[] = [];
      for await (const chunk of fileContent) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Parse the file based on its type
      const fileName = fileInfo.name;
      const fileExtension = fileName.split('.').pop()?.toLowerCase();

      let data: any[][];
      let headers: string[];

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
        }) as any[][];
        
        headers = jsonData[0]?.map(h => h?.toString() || '') || [];
        data = jsonData.slice(1);
      } else if (fileExtension === 'csv') {
        // For CSV files, we'll need to parse the text
        const text = buffer.toString('utf-8');
        const lines = text.split('\n').filter(line => line.trim());
        const parsedData = lines.map(line => line.split(','));
        headers = parsedData[0] || [];
        data = parsedData.slice(1);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }

      return {
        id: `sharepoint_${Date.now()}`,
        name: fileName.replace(/\.[^/.]+$/, ''),
        filename: fileName,
        data,
        headers,
        lastModified: new Date(fileInfo.lastModifiedDateTime).getTime(),
        source: 'sharepoint',
        tags: {},
        metadata: {},
      };
    } catch (error) {
      console.error('Failed to load file from SharePoint:', error);
      throw error;
    }
  }

  async listRecentFiles() {
    if (!this.graphClient) {
      throw new Error('Not authenticated. Please sign in first.');
    }

    try {
      const recentFiles = await this.graphClient
        .api('/me/drive/recent')
        .filter("file ne null and (endswith(name,'.xlsx') or endswith(name,'.xls') or endswith(name,'.csv'))")
        .top(10)
        .get();

      return recentFiles.value.map((file: any) => ({
        id: file.id,
        name: file.name,
        webUrl: file.webUrl,
        lastModified: file.lastModifiedDateTime,
      }));
    } catch (error) {
      console.error('Failed to list recent files:', error);
      throw error;
    }
  }

  getCurrentUser() {
    return this.account ? {
      id: this.account.localAccountId,
      name: this.account.name || '',
      email: this.account.username,
    } : null;
  }

  isAuthenticated() {
    return this.account !== null && this.graphClient !== null;
  }

  // Helper method to parse all worksheets from a buffer
  private parseAllWorksheetsFromBuffer(buffer: Buffer | ArrayBuffer, fileName: string, fileExtension: string | undefined, metadata: any): SpreadsheetData[] {
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = XLSX.read(buffer, { type: buffer instanceof Buffer ? 'buffer' : 'array' });
      const results: SpreadsheetData[] = [];
      
      // Process each worksheet
      workbook.SheetNames.forEach((sheetName, index) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
        }) as any[][];
        
        const headers = jsonData[0]?.map(h => h?.toString() || '') || [];
        const data = jsonData.slice(1);
        
        results.push({
          id: `${metadata.source}_${Date.now()}_${index}`,
          name: `${fileName.replace(/\.[^/.]+$/, '')} - ${sheetName}`,
          filename: fileName,
          data,
          headers,
          lastModified: metadata.lastModified || Date.now(),
          source: metadata.source as any,
          tags: {},
          metadata: {
            ...metadata,
            worksheetName: sheetName,
            worksheetIndex: index,
          },
        });
      });
      
      return results;
    } else if (fileExtension === 'csv') {
      // CSV files only have one "sheet"
      const text = buffer instanceof Buffer ? buffer.toString('utf-8') : new TextDecoder().decode(buffer);
      const lines = text.split('\n').filter(line => line.trim());
      const parsedData = lines.map(line => line.split(','));
      const headers = parsedData[0] || [];
      const data = parsedData.slice(1);
      
      return [{
        id: `${metadata.source}_${Date.now()}`,
        name: fileName.replace(/\.[^/.]+$/, ''),
        filename: fileName,
        data,
        headers,
        lastModified: metadata.lastModified || Date.now(),
        source: metadata.source as any,
        tags: {},
        metadata,
      }];
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
  }

  // Load all worksheets directly for public/shared links
  private async loadAllWorksheetsDirectly(fileUrl: string): Promise<SpreadsheetData[]> {
    // Try to load file directly for public/shared SharePoint links
    let downloadUrl = fileUrl;
    
    // Convert SharePoint sharing URLs to direct download URLs
    if (fileUrl.includes('sharepoint.com')) {
      // Handle different SharePoint URL formats
      if (fileUrl.includes('/_layouts/15/guestaccess.aspx')) {
        // Already a guest access URL, try to use it directly
        downloadUrl = fileUrl;
      } else if (fileUrl.includes('?')) {
        // Add download parameter to existing URL
        downloadUrl = fileUrl + '&download=1';
      } else {
        // Add download parameter to direct file URL
        downloadUrl = fileUrl + '?download=1';
      }
    }
    
    console.log('Attempting direct download from:', downloadUrl);
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`Direct download failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract filename from URL or response headers
    let fileName = 'sharepoint-file';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    } else {
      // Extract from URL
      const urlParts = fileUrl.split('/');
      fileName = urlParts[urlParts.length - 1].split('?')[0];
    }
    
    // Parse all worksheets from the file
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    return this.parseAllWorksheetsFromBuffer(arrayBuffer, fileName, fileExtension, {
      lastModified: Date.now(),
      originalUrl: fileUrl,
      source: 'sharepoint'
    });
  }

  private async loadFileDirectly(fileUrl: string): Promise<SpreadsheetData> {
    // Try to load file directly for public/shared SharePoint links
    let downloadUrl = fileUrl;
    
    // Convert SharePoint sharing URLs to direct download URLs
    if (fileUrl.includes('sharepoint.com')) {
      // Handle different SharePoint URL formats
      if (fileUrl.includes('/_layouts/15/guestaccess.aspx')) {
        // Already a guest access URL, try to use it directly
        downloadUrl = fileUrl;
      } else if (fileUrl.includes('?')) {
        // Add download parameter to existing URL
        downloadUrl = fileUrl + '&download=1';
      } else {
        // Add download parameter to direct file URL
        downloadUrl = fileUrl + '?download=1';
      }
    }
    
    console.log('Attempting direct download from:', downloadUrl);
    
    const response = await fetch(downloadUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'include', // Include cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error(`Direct download failed: ${response.status} ${response.statusText}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    
    // Extract filename from URL or response headers
    let fileName = 'sharepoint-file';
    const contentDisposition = response.headers.get('content-disposition');
    if (contentDisposition) {
      const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (match && match[1]) {
        fileName = match[1].replace(/['"]/g, '');
      }
    } else {
      // Extract from URL
      const urlParts = fileUrl.split('/');
      fileName = urlParts[urlParts.length - 1].split('?')[0];
    }
    
    // Parse the file based on its type
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    let data: any[][];
    let headers: string[];
    
    if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
      }) as any[][];
      
      headers = jsonData[0]?.map(h => h?.toString() || '') || [];
      data = jsonData.slice(1);
    } else if (fileExtension === 'csv') {
      const text = new TextDecoder().decode(arrayBuffer);
      const lines = text.split('\n').filter(line => line.trim());
      const parsedData = lines.map(line => line.split(','));
      headers = parsedData[0] || [];
      data = parsedData.slice(1);
    } else {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }
    
    return {
      id: `sharepoint_direct_${Date.now()}`,
      name: fileName.replace(/\.[^/.]+$/, ''),
      filename: fileName,
      data,
      headers,
      lastModified: Date.now(),
      source: 'sharepoint',
      tags: {},
      metadata: {},
    };
  }
}

export const sharePointService = new SharePointService();