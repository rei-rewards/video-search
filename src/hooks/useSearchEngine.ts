import { useState, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useAppStore } from '../store/appStore';

interface SearchResult {
  id: string;
  spreadsheetId: string;
  spreadsheetName: string;
  spreadsheetSource: 'upload' | 'sharepoint' | 'onedrive' | 'google-sheets' | 'sharepoint-direct';
  rowIndex: number;
  data: Record<string, any>;
  tags: string[];
  score: number;
  metadata?: Record<string, any>;
}

export const useSearchEngine = () => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const { spreadsheets, searchSettings } = useAppStore();

  // Create search index
  const searchIndex = useMemo(() => {
    const allSearchableData: Array<{
      id: string;
      spreadsheetId: string;
      spreadsheetName: string;
      spreadsheetSource: string;
      rowIndex: number;
      data: Record<string, any>;
      tags: string[];
      metadata: Record<string, any>;
      searchableText: string;
    }> = [];

    spreadsheets.forEach(sheet => {
      sheet.data.forEach((row, rowIndex) => {
        // Convert row data to key-value pairs using headers
        const rowData: Record<string, any> = {};
        sheet.headers.forEach((header, colIndex) => {
          rowData[header] = row[colIndex] || '';
        });

        // Get tags for this row
        const rowTags = sheet.tags[rowIndex] || [];
        
        // Get metadata for this row
        const rowMetadata = (() => {
          if (typeof sheet.metadata === 'object' && sheet.metadata !== null) {
            // Check if it's row-based metadata (has numeric keys)
            if (typeof (sheet.metadata as Record<number, any>)[rowIndex] === 'object') {
              return (sheet.metadata as Record<number, Record<string, any>>)[rowIndex];
            }
          }
          return {};
        })();

        // Create searchable text by combining all values
        const searchableValues: string[] = [];
        
        // Add row data
        Object.values(rowData).forEach(value => {
          if (value !== null && value !== undefined) {
            searchableValues.push(value.toString());
          }
        });

        // Add tags if enabled
        if (searchSettings.searchInTags) {
          searchableValues.push(...rowTags);
        }

        // Add metadata if enabled
        if (searchSettings.searchInMetadata) {
          Object.values(rowMetadata).forEach(value => {
            if (value !== null && value !== undefined) {
              searchableValues.push(value.toString());
            }
          });
        }

        allSearchableData.push({
          id: `${sheet.id}-${rowIndex}`,
          spreadsheetId: sheet.id,
          spreadsheetName: sheet.name,
          spreadsheetSource: sheet.source,
          rowIndex,
          data: rowData,
          tags: rowTags,
          metadata: rowMetadata,
          searchableText: searchableValues.join(' '),
        });
      });
    });

    // Create Fuse.js index
    const fuseOptions = {
      keys: ['searchableText'],
      threshold: searchSettings.fuzzyThreshold,
      includeScore: true,
      ignoreLocation: true,
      findAllMatches: true,
    };

    return new Fuse(allSearchableData, fuseOptions);
  }, [spreadsheets, searchSettings]);

  const performSearch = useCallback(async (query: string, spreadsheetFilter: string = 'all') => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    try {
      // Use setTimeout to make search non-blocking
      await new Promise(resolve => setTimeout(resolve, 0));

      let results = searchIndex.search(query);

      // Apply spreadsheet filter
      if (spreadsheetFilter !== 'all') {
        results = results.filter(result => 
          result.item.spreadsheetId === spreadsheetFilter
        );
      }

      // Limit results
      results = results.slice(0, searchSettings.maxResults);

      // Convert to SearchResult format
      const searchResults: SearchResult[] = results.map(result => ({
        id: result.item.id,
        spreadsheetId: result.item.spreadsheetId,
        spreadsheetName: result.item.spreadsheetName,
        spreadsheetSource: result.item.spreadsheetSource as any,
        rowIndex: result.item.rowIndex,
        data: result.item.data,
        tags: result.item.tags,
        metadata: result.item.metadata,
        score: 1 - (result.score || 0), // Invert score so higher is better
      }));

      setSearchResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchIndex, searchSettings.maxResults]);

  const clearResults = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    searchResults,
    isSearching,
    performSearch,
    clearResults,
  };
}; 