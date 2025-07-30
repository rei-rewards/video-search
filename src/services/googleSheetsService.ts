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

  // Load spreadsheet data from Google Sheets URL
  static async loadFromUrl(url: string): Promise<SpreadsheetData> {
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

  // Load multiple sheets from URLs
  static async loadMultipleFromUrls(urls: string[]): Promise<SpreadsheetData[]> {
    const results: SpreadsheetData[] = [];
    const errors: string[] = [];

    for (const url of urls) {
      try {
        const data = await this.loadFromUrl(url.trim());
        results.push(data);
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