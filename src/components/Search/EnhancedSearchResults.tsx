import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
  Alert,
  Button,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  LocalOffer as TagIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon,
  Upload as UploadIcon,
  Share as ShareIcon,
  OpenInNew as OpenInNewIcon,
  Star as StarIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useAppStore } from '../../store/appStore';

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

interface EnhancedSearchResultsProps {
  results: SearchResult[];
  isLoading: boolean;
  searchQuery: string;
  highlightResults: boolean;
}

const EnhancedSearchResults: React.FC<EnhancedSearchResultsProps> = ({
  results,
  isLoading,
  searchQuery,
  highlightResults,
}) => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; rowId: string } | null>(null);
  
  const { spreadsheets } = useAppStore();

  // Group results by spreadsheet
  const groupedResults = results.reduce((acc, result) => {
    const key = result.spreadsheetId;
    if (!acc[key]) {
      acc[key] = {
        spreadsheet: spreadsheets.find(s => s.id === result.spreadsheetId),
        results: [],
      };
    }
    acc[key].results.push(result);
    return acc;
  }, {} as Record<string, { spreadsheet: any; results: SearchResult[] }>);

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'google-sheets':
        return <GoogleIcon sx={{ color: '#4285f4' }} />;
      case 'sharepoint':
      case 'sharepoint-direct':
        return <MicrosoftIcon sx={{ color: '#0078d4' }} />;
      case 'onedrive':
        return <MicrosoftIcon sx={{ color: '#0078d4' }} />;
      default:
        return <UploadIcon sx={{ color: '#666' }} />;
    }
  };

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'google-sheets':
        return 'Google Sheets';
      case 'sharepoint':
        return 'SharePoint';
      case 'sharepoint-direct':
        return 'SharePoint (Direct)';
      case 'onedrive':
        return 'OneDrive';
      default:
        return 'Upload';
    }
  };

  // Enhanced text rendering with clickable links and highlighting
  const renderTextWithLinksAndHighlights = (text: string, query: string) => {
    const textStr = String(text);
    
    // URL regex pattern - matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
    
    // First, find all URLs and replace them with placeholders
    const urlMatches: string[] = [];
    let processedText = textStr.replace(urlRegex, (match) => {
      urlMatches.push(match);
      return `|||URL_${urlMatches.length - 1}|||`;
    });
    
    // Then apply search highlighting if needed
    if (highlightResults && query.trim()) {
      const searchTerms = query.split(' ').filter(term => term.length > 0);
      searchTerms.forEach(term => {
        const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        processedText = processedText.replace(regex, '|||HIGHLIGHT_START|||$1|||HIGHLIGHT_END|||');
      });
    }
    
    // Split by all markers and process
    const parts = processedText.split('|||');
    
    return (
      <span>
        {parts.map((part, index) => {
          // Skip marker parts
          if (part === 'HIGHLIGHT_START' || part === 'HIGHLIGHT_END') return null;
          
          // Handle highlighted text
          if (parts[index - 1] === 'HIGHLIGHT_START') {
            return (
              <span 
                key={index} 
                style={{
                  backgroundColor: '#ff9800',
                  color: 'white',
                  padding: '2px 4px',
                  borderRadius: '3px',
                  fontWeight: 'bold',
                }}
              >
                {part}
              </span>
            );
          }
          
          // Handle URLs
          if (part.startsWith('URL_')) {
            const urlIndex = parseInt(part.replace('URL_', ''));
            const url = urlMatches[urlIndex];
            if (url) {
              return (
                <Button
                  key={index}
                  variant="text"
                  size="small"
                  startIcon={<OpenInNewIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(url, '_blank');
                  }}
                  sx={{
                    minHeight: 'auto',
                    padding: '2px 6px',
                    fontSize: 'inherit',
                    textTransform: 'none',
                    color: 'primary.main',
                    textDecoration: 'underline',
                    '&:hover': {
                      backgroundColor: 'primary.50',
                      textDecoration: 'underline',
                    }
                  }}
                >
                  {url.length > 50 ? `${url.substring(0, 47)}...` : url}
                </Button>
              );
            }
          }
          
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  const fieldContainsSearchTerm = (value: string): boolean => {
    if (!searchQuery.trim()) return false;
    return searchQuery.split(' ').some(term => 
      String(value).toLowerCase().includes(term.toLowerCase())
    );
  };

  const renderResultCard = (result: SearchResult, spreadsheet: any) => {
    const matchingFields = Object.entries(result.data).filter(([key, value]) => 
      fieldContainsSearchTerm(String(value))
    );

    return (
      <Card 
        key={result.id} 
        sx={{ 
          mb: 2, 
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: 4,
          }
        }}
      >
        <CardContent>
          {/* Header with source and spreadsheet info */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {getSourceIcon(result.spreadsheetSource)}
              </Avatar>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  {result.spreadsheetName}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {getSourceLabel(result.spreadsheetSource)} • Row {result.rowIndex + 1}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip 
                size="small" 
                color="primary" 
                icon={<StarIcon />}
                label={`${Math.round(result.score * 100)}% match`}
              />
              <IconButton size="small" onClick={(e) => setMenuAnchor({ el: e.currentTarget, rowId: result.id })}>
                <MoreVertIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Matching fields with enhanced visualization */}
          <Grid container spacing={2}>
            {matchingFields.slice(0, 4).map(([fieldName, value]) => (
              <Grid item xs={12} sm={6} key={fieldName}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderLeft: '4px solid',
                    borderLeftColor: 'primary.main'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 600 }}>
                      📍 Match in {fieldName}
                    </Typography>
                  </Box>
                  <Typography variant="body2">
                    {renderTextWithLinksAndHighlights(String(value), searchQuery)}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Show remaining fields count */}
          {matchingFields.length > 4 && (
            <Alert severity="info" sx={{ mt: 2 }}>
              +{matchingFields.length - 4} more matching fields. 
              <Button size="small" onClick={() => setExpandedCard(expandedCard === result.id ? null : result.id)}>
                {expandedCard === result.id ? 'Show Less' : 'Show All'}
              </Button>
            </Alert>
          )}

          {/* Expanded view with all data */}
          {expandedCard === result.id && (
            <Accordion sx={{ mt: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2">Complete Row Data</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={1}>
                  {Object.entries(result.data).map(([key, value]) => (
                    <Grid item xs={12} sm={6} md={4} key={key}>
                      <Box sx={{ mb: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          {key}
                        </Typography>
                        <Typography variant="body2">
                          {fieldContainsSearchTerm(String(value)) 
                            ? renderTextWithLinksAndHighlights(String(value), searchQuery)
                            : renderTextWithLinksAndHighlights(String(value), '')
                          }
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          )}

          {/* Tags */}
          {result.tags.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {result.tags.map((tag) => (
                  <Chip key={tag} size="small" label={tag} icon={<TagIcon />} />
                ))}
              </Stack>
            </Box>
          )}
        </CardContent>
        
        <CardActions>
          <Button 
            size="small" 
            startIcon={<VisibilityIcon />}
            onClick={() => {
              // For now, expand the card to show all data
              setExpandedCard(expandedCard === result.id ? null : result.id);
            }}
          >
            {expandedCard === result.id ? 'Hide Details' : 'View in Spreadsheet'}
          </Button>
          {spreadsheet?.metadata?.originalUrl && (
            <Button 
              size="small" 
              startIcon={<OpenInNewIcon />}
              onClick={() => window.open(spreadsheet.metadata.originalUrl, '_blank')}
            >
              Open Original
            </Button>
          )}
        </CardActions>
      </Card>
    );
  };

  const renderGroupedResults = () => {
    return Object.entries(groupedResults).map(([spreadsheetId, group]) => (
      <Box key={spreadsheetId} sx={{ mb: 4 }}>
        {/* Spreadsheet Header */}
        <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar>
              {getSourceIcon(group.spreadsheet?.source || 'upload')}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6">
                {group.spreadsheet?.name || 'Unknown Spreadsheet'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getSourceLabel(group.spreadsheet?.source || 'upload')} • 
                {group.results.length} match{group.results.length !== 1 ? 'es' : ''}
              </Typography>
            </Box>
            <Chip 
              label={`${group.results.length} results`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </Paper>

        {/* Results for this spreadsheet */}
        {group.results.map(result => renderResultCard(result, group.spreadsheet))}
      </Box>
    ));
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Searching...</Typography>
          <Typography variant="body2" color="text.secondary">
            Analyzing data across all your spreadsheets
          </Typography>
        </Box>
      </Box>
    );
  }

  if (results.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1 }}>
          No results found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search terms or check your spelling
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      {/* Enhanced Search Summary */}
      <Paper sx={{ mb: 3, p: 3, bgcolor: 'primary.50', borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SearchIcon color="primary" />
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Search Results
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Typography variant="body1">
            Showing <strong>{results.length}</strong> matches for "{searchQuery}"
          </Typography>
          <Chip 
            label={`${Object.keys(groupedResults).length} spreadsheet${Object.keys(groupedResults).length !== 1 ? 's' : ''}`}
            size="small"
            color="primary"
          />
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          💡 <strong>Tip:</strong> Results are grouped by spreadsheet and sorted by relevance. 
          Yellow highlighted text shows exact matches, and match scores help identify the best results.
        </Typography>
      </Paper>

      {/* Results */}
      {renderGroupedResults()}

      {/* Context Menu */}
      <Menu
        anchorEl={menuAnchor?.el}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <TagIcon sx={{ mr: 1 }} /> Add Tag
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <ShareIcon sx={{ mr: 1 }} /> Share
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default EnhancedSearchResults;