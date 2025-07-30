import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SpreadsheetData {
  id: string;
  name: string;
  filename?: string;
  data: any[][];
  headers: string[];
  lastModified: number;
  source: 'upload' | 'sharepoint' | 'onedrive' | 'google-sheets' | 'sharepoint-direct';
  tags: Record<number, string[]>; // row index -> tags array
  metadata: Record<number, Record<string, any>> | {
    // For cloud sources, allow global metadata
    originalUrl?: string;
    exportUrl?: string;
    loadMethod?: string;
    sheetId?: string;
    gid?: string;
    [key: string]: any;
  };
}

export interface SearchHistory {
  id: string;
  query: string;
  timestamp: number;
  resultsCount: number;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: Record<string, any>;
  createdAt: number;
}

interface AppState {
  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Data State
  spreadsheets: SpreadsheetData[];
  addSpreadsheet: (sheet: SpreadsheetData) => void;
  addMultipleSpreadsheets: (sheets: SpreadsheetData[]) => void;
  removeSpreadsheet: (id: string) => void;
  updateSpreadsheetTags: (sheetId: string, rowIndex: number, tags: string[]) => void;
  updateSpreadsheetMetadata: (sheetId: string, rowIndex: number, metadata: Record<string, any>) => void;
  
  // Workspace Management
  savedWorkspaces: {
    id: string;
    name: string;
    urls: string[];
    createdAt: number;
    lastUsed: number;
  }[];
  addWorkspace: (name: string, urls: string[]) => void;
  loadWorkspace: (workspaceId: string) => string[];
  removeWorkspace: (workspaceId: string) => void;
  
  // Search State
  searchHistory: SearchHistory[];
  addSearchHistory: (search: SearchHistory) => void;
  clearSearchHistory: () => void;
  
  savedSearches: SavedSearch[];
  addSavedSearch: (search: SavedSearch) => void;
  removeSavedSearch: (id: string) => void;
  
  // User Preferences
  searchSettings: {
    fuzzyThreshold: number;
    searchInTags: boolean;
    searchInMetadata: boolean;
    maxResults: number;
    highlightResults: boolean;
  };
  updateSearchSettings: (settings: Partial<AppState['searchSettings']>) => void;
  
  // Authentication
  user: {
    id?: string;
    name?: string;
    email?: string;
    accessToken?: string;
  } | null;
  setUser: (user: AppState['user']) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // UI State
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      // Data State
      spreadsheets: [],
      addSpreadsheet: (sheet) => set((state) => ({
        spreadsheets: [...state.spreadsheets, sheet]
      })),
      addMultipleSpreadsheets: (sheets) => set((state) => ({
        spreadsheets: [...state.spreadsheets, ...sheets]
      })),
      removeSpreadsheet: (id) => set((state) => ({
        spreadsheets: state.spreadsheets.filter(sheet => sheet.id !== id)
      })),
      updateSpreadsheetTags: (sheetId, rowIndex, tags) => set((state) => ({
        spreadsheets: state.spreadsheets.map(sheet => 
          sheet.id === sheetId 
            ? { ...sheet, tags: { ...sheet.tags, [rowIndex]: tags } }
            : sheet
        )
      })),
      updateSpreadsheetMetadata: (sheetId, rowIndex, metadata) => set((state) => ({
        spreadsheets: state.spreadsheets.map(sheet => 
          sheet.id === sheetId 
            ? { ...sheet, metadata: { ...sheet.metadata, [rowIndex]: metadata } }
            : sheet
        )
      })),
      
      // Workspace Management
      savedWorkspaces: [],
      addWorkspace: (name, urls) => set((state) => ({
        savedWorkspaces: [...state.savedWorkspaces, {
          id: `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          urls,
          createdAt: Date.now(),
          lastUsed: Date.now(),
        }]
      })),
      loadWorkspace: (workspaceId) => {
        const state = get();
        const workspace = state.savedWorkspaces.find(w => w.id === workspaceId);
        if (workspace) {
          // Update last used timestamp
          set((state) => ({
            savedWorkspaces: state.savedWorkspaces.map(w => 
              w.id === workspaceId ? { ...w, lastUsed: Date.now() } : w
            )
          }));
          return workspace.urls;
        }
        return [];
      },
      removeWorkspace: (workspaceId) => set((state) => ({
        savedWorkspaces: state.savedWorkspaces.filter(w => w.id !== workspaceId)
      })),
      
      // Search State
      searchHistory: [],
      addSearchHistory: (search) => set((state) => ({
        searchHistory: [search, ...state.searchHistory.slice(0, 49)] // Keep last 50
      })),
      clearSearchHistory: () => set({ searchHistory: [] }),
      
      savedSearches: [],
      addSavedSearch: (search) => set((state) => ({
        savedSearches: [...state.savedSearches, search]
      })),
      removeSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(search => search.id !== id)
      })),
      
      // User Preferences
      searchSettings: {
        fuzzyThreshold: 0.4,
        searchInTags: true,
        searchInMetadata: true,
        maxResults: 1000,
        highlightResults: true,
      },
      updateSearchSettings: (settings) => set((state) => ({
        searchSettings: { ...state.searchSettings, ...settings }
      })),
      
      // Authentication
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
    }),
    {
      name: 'spreadsheet-search-storage',
      partialize: (state) => ({
        spreadsheets: state.spreadsheets,
        searchHistory: state.searchHistory,
        savedSearches: state.savedSearches,
        savedWorkspaces: state.savedWorkspaces,
        searchSettings: state.searchSettings,
        user: state.user,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
); 