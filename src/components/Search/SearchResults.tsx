import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  LocalOffer as TagIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRowParams } from '@mui/x-data-grid';

interface SearchResult {
  id: string;
  spreadsheetId: string;
  spreadsheetName: string;
  rowIndex: number;
  data: Record<string, any>;
  tags: string[];
  score: number;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  searchQuery: string;
  highlightResults: boolean;
}

const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  searchQuery,
  highlightResults,
}) => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; rowId: string } | null>(null);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [currentRowId, setCurrentRowId] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, rowId: string) => {
    setMenuAnchor({ el: event.currentTarget, rowId });
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleAddTag = (rowId: string) => {
    setCurrentRowId(rowId);
    setTagDialogOpen(true);
    handleMenuClose();
  };

  const handleTagSubmit = () => {
    if (newTag.trim() && currentRowId) {
      // TODO: Implement tag addition to store
      console.log('Adding tag:', newTag, 'to row:', currentRowId);
      setNewTag('');
      setTagDialogOpen(false);
      setCurrentRowId(null);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!highlightResults || !query.trim()) return text;
    
    const searchTerms = query.split(' ').filter(term => term.length > 0);
    let highlightedText = text;
    
    searchTerms.forEach(term => {
      const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      highlightedText = highlightedText.replace(regex, '|||HIGHLIGHT_START|||$1|||HIGHLIGHT_END|||');
    });
    
    const parts = highlightedText.split('|||');
    
    return (
      <span>
        {parts.map((part, index) => {
          if (part === 'HIGHLIGHT_START') return null;
          if (part === 'HIGHLIGHT_END') return null;
          if (parts[index - 1] === 'HIGHLIGHT_START') {
            return (
              <span 
                key={index} 
                style={{ 
                  backgroundColor: '#ff5722', 
                  color: 'white',
                  fontWeight: 'bold',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.9em'
                }}
              >
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const renderCellValue = (value: any, fieldName?: string) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    
    const stringValue = value.toString();
    const containsSearchTerm = fieldContainsSearchTerm(stringValue);
    
    return (
      <Box sx={{ 
        maxWidth: 250, 
        p: 1,
        bgcolor: containsSearchTerm ? 'yellow.50' : 'transparent',
        borderLeft: containsSearchTerm ? '3px solid #ffeb3b' : 'none',
        borderRadius: 1
      }}>
        {containsSearchTerm ? (
          <Box>
            <Typography variant="caption" color="primary" sx={{ fontWeight: 'bold', display: 'block' }}>
              📍 Match in {fieldName}
            </Typography>
            {highlightText(stringValue, searchQuery)}
          </Box>
        ) : (
          <Typography variant="body2" sx={{ 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {stringValue}
          </Typography>
        )}
      </Box>
    );
  };

  // Helper function to check if a field contains the search term
  const fieldContainsSearchTerm = (value: string): boolean => {
    if (!searchQuery) return false;
    const searchTerms = searchQuery.toLowerCase().split(' ').filter(term => term.length > 0);
    const lowerValue = value.toLowerCase();
    return searchTerms.some(term => lowerValue.includes(term));
  };

  const renderTagsCell = (tags: string[]) => (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', maxWidth: 200 }}>
      {tags.map((tag, index) => (
        <Chip
          key={index}
          label={tag}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.7rem', height: 20 }}
        />
      ))}
    </Box>
  );

  // Generate columns dynamically from results
  const columns: GridColDef[] = React.useMemo(() => {
    if (results.length === 0) return [];

    const allKeys = new Set<string>();
    results.forEach(result => {
      Object.keys(result.data).forEach(key => allKeys.add(key));
    });

    const dataColumns: GridColDef[] = Array.from(allKeys).map(key => ({
      field: key,
      headerName: key.charAt(0).toUpperCase() + key.slice(1),
      width: 280,
      renderCell: (params) => renderCellValue(params.value, key),
    }));

    return [
      {
        field: 'spreadsheetName',
        headerName: 'Spreadsheet',
        width: 150,
        renderCell: (params) => (
          <Chip
            label={params.value}
            size="small"
            color="primary"
            variant="outlined"
          />
        ),
      },
      ...dataColumns,
      {
        field: 'tags',
        headerName: 'Tags',
        width: 200,
        renderCell: (params) => renderTagsCell(params.value || []),
      },
      {
        field: 'score',
        headerName: 'Score',
        width: 80,
        renderCell: (params) => (
          <Chip
            label={`${Math.round(params.value * 100)}%`}
            size="small"
            color={params.value > 0.8 ? 'success' : params.value > 0.5 ? 'warning' : 'default'}
          />
        ),
      },
      {
        field: 'actions',
        headerName: 'Actions',
        width: 60,
        renderCell: (params) => (
          <IconButton
            size="small"
            onClick={(e) => handleMenuClick(e, params.row.id)}
          >
            <MoreVertIcon />
          </IconButton>
        ),
      },
    ];
  }, [results, searchQuery, highlightResults]);

  if (isLoading) {
    return (
      <Box className="loading-spinner">
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Searching...</Typography>
      </Box>
    );
  }

  if (results.length === 0 && searchQuery) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          No Results Found
        </Typography>
        <Typography color="text.secondary">
          Try adjusting your search terms or check different spreadsheets.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Paper sx={{ mb: 2, p: 3, bgcolor: 'primary.50' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SearchIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Search Results
          </Typography>
          <Chip 
            label={`${results.length} matches`} 
            color="primary" 
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        </Box>
        
        <Typography variant="body1" sx={{ mb: 1 }}>
          🔍 Searching for: <strong>"{searchQuery}"</strong>
        </Typography>
        
        <Typography variant="body2" color="text.secondary">
          Found {results.length} matching rows across {new Set(results.map(r => r.spreadsheetName)).size} spreadsheet(s)
        </Typography>
        
        {results.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              💡 Look for yellow highlights and 📍 match indicators to see exactly what matched your search
            </Typography>
          </Box>
        )}
      </Paper>

      <Paper sx={{ height: 650, width: '100%', overflow: 'hidden' }}>
        <DataGrid
          rows={results}
          columns={columns}
          checkboxSelection
          disableRowSelectionOnClick
          onRowSelectionModelChange={(newSelection) => {
            setSelectedRows(newSelection as string[]);
          }}
          rowSelectionModel={selectedRows}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-cell': {
              borderColor: 'divider',
              padding: '8px',
              fontSize: '0.9rem',
            },
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: 'primary.100',
              borderColor: 'divider',
              fontSize: '0.95rem',
              fontWeight: 'bold',
            },
            '& .MuiDataGrid-row': {
              '&:hover': {
                bgcolor: 'grey.50',
              },
              '&.Mui-selected': {
                bgcolor: 'primary.50',
              },
            },
            '& .MuiDataGrid-virtualScroller': {
              // Better scrolling experience
              scrollBehavior: 'smooth',
            },
          }}
        />
      </Paper>

      {selectedRows.length > 0 && (
        <Paper sx={{ p: 2, mt: 2, bgcolor: 'primary.50' }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {selectedRows.length} rows selected
          </Typography>
          <Button
            variant="contained"
            size="small"
            startIcon={<TagIcon />}
            onClick={() => {
              // TODO: Implement bulk tagging
              console.log('Bulk tag rows:', selectedRows);
            }}
          >
            Add Tags to Selected
          </Button>
        </Paper>
      )}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleAddTag(menuAnchor?.rowId || '')}>
          <TagIcon sx={{ mr: 1 }} />
          Add Tag
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          View Row Details
        </MenuItem>
      </Menu>

      {/* Add Tag Dialog */}
      <Dialog open={tagDialogOpen} onClose={() => setTagDialogOpen(false)}>
        <DialogTitle>Add Tag</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Tag"
            fullWidth
            variant="outlined"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTagSubmit()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleTagSubmit} variant="contained">
            Add Tag
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchResults; 