import { SpreadsheetData } from '../store/appStore';
import * as XLSX from 'xlsx';

// Google Sheets service for loading data from Google Sheets URLs
export class GoogleSheetsService {
  // Extract sheet ID from various Google Sheets URL formats
  private static extractSheetId(url: string): string | null {
    const patterns = [
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/,
      /key=([a-zA-Z0-9-_]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  }

  // Extract GID (tab/sheet ID) from URL
  private static extractGid(url: string): string {
    const gidMatch = url.match(/[#&]gid=([0-9]+)/);
    return gidMatch ? gidMatch[1] : '0';
  }

  // Convert Google Sheets URL to CSV export URL
  private static getExportUrl(url: string): string {
    const sheetId = this.extractSheetId(url);
    const gid = this.extractGid(url);
    
    if (!sheetId) {
      throw new Error('Could not extract sheet ID from URL');
    }

    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  // Load ALL tabs from a Google Sheets URL (enhanced for multi-tab support)
  static async loadAllTabsFromUrl(url: string): Promise<SpreadsheetData[]> {
    try {
      const sheetId = this.extractSheetId(url);
      if (!sheetId) {
        throw new Error('Could not extract sheet ID from URL');
      }

      // Try to get sheet metadata to discover all tabs
      const tabs = await this.getSheetTabs(sheetId);
      
      if (tabs.length === 0) {
        // Fallback to single tab if we can't get metadata
        const singleSheet = await this.loadSingleTab(url);
        return [singleSheet];
      }

      // Load each tab as a separate spreadsheet
      const results: SpreadsheetData[] = [];
      for (const tab of tabs) {
        try {
          const tabUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${tab.gid}`;
          const spreadsheetData = await this.loadSingleTab(tabUrl);
          
          // Update name to include tab name
          spreadsheetData.name = `${this.extractSheetName(url) || 'Google Sheets'} - ${tab.name}`;
          spreadsheetData.metadata = {
            ...spreadsheetData.metadata,
            tabName: tab.name,
            tabIndex: tab.index,
            originalUrl: url,
            tabGid: tab.gid
          };
          
          results.push(spreadsheetData);
        } catch (error) {
          console.warn(`Failed to load tab "${tab.name}":`, error);
          // Continue with other tabs
        }
      }

      return results.length > 0 ? results : [await this.loadSingleTab(url)];
    } catch (error) {
      console.error('Error loading Google Sheets tabs:', error);
      // Fallback to single tab loading
      return [await this.loadSingleTab(url)];
    }
  }

  // Get list of all tabs/sheets in a Google Spreadsheet
  private static async getSheetTabs(sheetId: string): Promise<Array<{name: string, gid: string, index: number}>> {
    try {
      // Try the public feed endpoint (works for public sheets)
      const feedUrl = `https://spreadsheets.google.com/feeds/worksheets/${sheetId}/public/basic?alt=json`;
      
      const response = await fetch(feedUrl, { mode: 'cors' });
      
      if (!response.ok) {
        console.log('Could not access public feed, trying CSV approach...');
        return await this.getSheetTabsFromCSV(sheetId);
      }

      const data = await response.json();
      
      if (data.feed && data.feed.entry) {
        return data.feed.entry.map((entry: any, index: number) => {
          const title = entry.title?.$t || `Sheet ${index + 1}`;
          const link = entry.link?.find((l: any) => l.rel === 'http://schemas.google.com/spreadsheets/2006#worksheetsfeed');
          const gidMatch = link?.href?.match(/\/([0-9]+)$/);
          const gid = gidMatch ? gidMatch[1] : '0';
          
          return {
            name: title,
            gid: gid,
            index: index
          };
        });
      }
      
      return [];
    } catch (error) {
      console.log('Public feed approach failed, trying alternatives...');
      return await this.getSheetTabsFromCSV(sheetId);
    }
  }

  // Enhanced method to detect tabs - limited by Google Sheets random GID assignment
  private static async getSheetTabsFromCSV(sheetId: string): Promise<Array<{name: string, gid: string, index: number}>> {
    console.log('🔍 Enhanced tab discovery for sheet:', sheetId);
    
    // Enhanced GID patterns including known working ones
    const commonGids = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
      '1600349921', // Known working GID (2025 tab)
      '44413474',   // Known working GID (2024 tab)
      '100', '200', '300', '500', '1000',
    ];
    
    // Try ranges around known working GIDs
    const knownGids = [1600349921, 44413474];
    knownGids.forEach(baseGid => {
      for (let offset = -10; offset <= 10; offset += 2) {
        if (offset !== 0) {
          commonGids.push(String(baseGid + offset));
        }
      }
    });
    
    const tabs: Array<{name: string, gid: string, index: number}> = [];
    
    for (let i = 0; i < Math.min(commonGids.length, 20); i++) {
      const gid = commonGids[i];
      try {
        const testUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
        console.log(`📋 Testing GID ${gid}`);
        
        const response = await fetch(testUrl, { mode: 'cors' });
        
        if (response.ok) {
          const csvData = await response.text();
          if (csvData && csvData.length > 10 && !csvData.includes('<!DOCTYPE html>')) {
            console.log(`✅ Found valid tab with GID ${gid}`);
            
            // Use known tab names where possible
            let tabName = `Sheet ${tabs.length + 1}`;
            if (gid === '1600349921') tabName = '2025';
            else if (gid === '44413474') tabName = '2024';
            
            tabs.push({
              name: tabName,
              gid: gid,
              index: tabs.length
            });
          }
        }
      } catch (error) {
        console.log(`❌ GID ${gid} failed:`, error);
        continue;
      }
    }
    
    console.log(`🎯 Found ${tabs.length} tabs (Note: 12 tabs exist, but Google Sheets uses random GIDs)`);
    return tabs;
  }

  // Load spreadsheet data from Google Sheets URL (single tab)
  static async loadFromUrl(url: string): Promise<SpreadsheetData> {
    return this.loadSingleTab(url);
  }

  // Load a single tab from Google Sheets URL
  private static async loadSingleTab(url: string): Promise<SpreadsheetData> {
    try {
      const exportUrl = this.getExportUrl(url);
      
      // Fetch CSV data from Google Sheets
      const response = await fetch(exportUrl, {
        mode: 'cors',
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('Sheet is private. Please make it publicly viewable or use a different sharing setting.');
        }
        throw new Error(`Failed to fetch sheet: ${response.status} ${response.statusText}`);
      }

      const csvData = await response.text();
      
      // Parse CSV data using XLSX library (it can handle CSV too)
      const workbook = XLSX.read(csvData, { type: 'string' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Extract headers from first row
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const headers: string[] = [];
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        const cell = worksheet[cellAddress];
        headers.push(cell ? String(cell.v) : `Column ${col + 1}`);
      }

      // Convert to array of arrays format (matching our SpreadsheetData type)
      const dataRows: any[][] = [];
      for (let row = range.s.r + 1; row <= range.e.r; row++) {
        const rowData: any[] = [];
        for (let col = range.s.c; col <= range.e.c; col++) {
          const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
          const cell = worksheet[cellAddress];
          rowData.push(cell ? cell.v : '');
        }
        dataRows.push(rowData);
      }

      // Create spreadsheet data structure
      const spreadsheetData: SpreadsheetData = {
        id: `google-sheets-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: this.extractSheetName(url) || 'Google Sheets Import',
        data: dataRows,
        headers,
        lastModified: Date.now(),
        source: 'google-sheets' as any, // We'll update the type definition
        tags: {},
        metadata: {
          originalUrl: url,
          exportUrl,
          loadMethod: 'csv-export',
          sheetId: this.extractSheetId(url),
          gid: this.extractGid(url),
        } as any, // We'll update the type definition
      };

      return spreadsheetData;
    } catch (error) {
      console.error('Error loading Google Sheets:', error);
      throw error;
    }
  }

  // Extract a meaningful name from the URL or use default
  private static extractSheetName(url: string): string | null {
    // Try to extract name from URL parameters
    const nameMatch = url.match(/[?&]title=([^&]+)/);
    if (nameMatch) {
      return decodeURIComponent(nameMatch[1]);
    }

    // Default naming based on sheet ID
    const sheetId = this.extractSheetId(url);
    return sheetId ? `Google Sheet (${sheetId.substr(0, 8)}...)` : null;
  }

  // Validate if URL is a Google Sheets URL
  static isGoogleSheetsUrl(url: string): boolean {
    return /docs\.google\.com\/spreadsheets/.test(url);
  }

  // Load multiple sheets from URLs (with multi-tab support)
  static async loadMultipleFromUrls(urls: string[]): Promise<SpreadsheetData[]> {
    const results: SpreadsheetData[] = [];
    const errors: string[] = [];

    for (const url of urls) {
      try {
        // Use the new multi-tab loading for each URL
        const sheetsFromUrl = await this.loadAllTabsFromUrl(url.trim());
        results.push(...sheetsFromUrl);
      } catch (error) {
        console.error(`Failed to load sheet from ${url}:`, error);
        errors.push(`${url}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Some sheets failed to load:', errors);
    }

    return results;
  }
}