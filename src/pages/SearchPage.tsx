import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Paper,
  TextField,
  Typography,
  Chip,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  BookmarkAdd as BookmarkAddIcon,
  LocalOffer as TagIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import EnhancedSearchResults from '../components/Search/EnhancedSearchResults';
import { useSearchEngine } from '../hooks/useSearchEngine';

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>('all');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  
  const { 
    spreadsheets, 
    searchHistory, 
    addSearchHistory,
    searchSettings,
  } = useAppStore();

  const { searchResults, isSearching, performSearch } = useSearchEngine();

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        performSearch(searchQuery, selectedSpreadsheet);
        
        // Add to search history
        addSearchHistory({
          id: Date.now().toString(),
          query: searchQuery,
          timestamp: Date.now(),
          resultsCount: searchResults.length,
        });
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, selectedSpreadsheet, performSearch, addSearchHistory, searchResults.length]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSpreadsheetChange = (event: any) => {
    setSelectedSpreadsheet(event.target.value);
  };

  const handleSaveSearch = () => {
    // TODO: Implement save search functionality
    console.log('Save search:', searchQuery);
  };

  const handleFilterClick = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterMenuAnchor(null);
  };

  const recentSearches = useMemo(() => 
    searchHistory.slice(0, 5), [searchHistory]
  );

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
        Search Spreadsheets
      </Typography>

      {/* Search Interface */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search across all your spreadsheets..."
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                endAdornment: searchQuery && (
                  <IconButton onClick={handleSaveSearch} size="small">
                    <BookmarkAddIcon />
                  </IconButton>
                ),
              }}
              sx={{ '& .MuiOutlinedInput-root': { fontSize: '1.1rem' } }}
            />
          </Grid>
          
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Spreadsheet</InputLabel>
              <Select
                value={selectedSpreadsheet}
                label="Spreadsheet"
                onChange={handleSpreadsheetChange}
              >
                <MenuItem value="all">All Spreadsheets</MenuItem>
                {spreadsheets.map((sheet) => (
                  <MenuItem key={sheet.id} value={sheet.id}>
                    {sheet.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={3}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterClick}
                fullWidth
              >
                Filters
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Search Tips */}
        {!searchQuery && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              <strong>Search Tips:</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary">
              • Use quotes for exact phrases: "video production"
              <br />
              • Exclude terms with minus: -draft
              <br />
              • Search specific columns: title:marketing
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Recent Searches */}
      {!searchQuery && recentSearches.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Recent Searches
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {recentSearches.map((search) => (
              <Chip
                key={search.id}
                label={search.query}
                onClick={() => setSearchQuery(search.query)}
                variant="outlined"
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </Paper>
      )}

      {/* Search Results */}
      {searchQuery && (
        <EnhancedSearchResults
          results={searchResults}
          isLoading={isSearching}
          searchQuery={searchQuery}
          highlightResults={searchSettings.highlightResults}
        />
      )}

      {/* No spreadsheets message */}
      {spreadsheets.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Spreadsheets Available
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Upload spreadsheets or connect to SharePoint to start searching.
          </Typography>
          <Button variant="contained" onClick={() => console.log('Upload')}>
            Upload Spreadsheet
          </Button>
        </Paper>
      )}

      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterClose}
      >
        <MenuItem onClick={handleFilterClose}>
          <TagIcon sx={{ mr: 1 }} />
          Search in Tags
        </MenuItem>
        <MenuItem onClick={handleFilterClose}>
          Advanced Filters
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default SearchPage; 