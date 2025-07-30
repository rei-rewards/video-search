import React from 'react';
import {
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Search as SearchIcon,
  TableChart as TableChartIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  BookmarkBorder as BookmarkIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import { loadSampleData } from '../utils/sampleData';
import FileUploadDialog from '../components/FileUpload/FileUploadDialog';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { spreadsheets, searchHistory, savedSearches, addSpreadsheet } = useAppStore();
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  const totalRows = spreadsheets.reduce((sum, sheet) => sum + sheet.data.length, 0);
  const totalTags = spreadsheets.reduce((sum, sheet) => 
    sum + Object.values(sheet.tags).reduce((tagSum, tags) => tagSum + tags.length, 0), 0
  );

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  const handleLoadSampleData = () => {
    const sampleData = loadSampleData();
    sampleData.forEach(sheet => addSpreadsheet(sheet));
  };

  const handleConnectSharePoint = () => {
    // TODO: Implement SharePoint connection
    console.log('Connect to SharePoint');
  };

  const handleQuickSearch = () => {
    navigate('/search');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Dashboard
      </Typography>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Spreadsheets
                  </Typography>
                  <Typography variant="h4" component="div">
                    {spreadsheets.length}
                  </Typography>
                </Box>
                <TableChartIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Rows
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalRows.toLocaleString()}
                  </Typography>
                </Box>
                <TrendingUpIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Tags Added
                  </Typography>
                  <Typography variant="h4" component="div">
                    {totalTags}
                  </Typography>
                </Box>
                <BookmarkIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Recent Searches
                  </Typography>
                  <Typography variant="h4" component="div">
                    {searchHistory.length}
                  </Typography>
                </Box>
                <HistoryIcon color="primary" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Quick Actions
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<CloudUploadIcon />}
                onClick={handleUploadClick}
                size="large"
                fullWidth
              >
                Upload Spreadsheet
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<TableChartIcon />}
                onClick={handleLoadSampleData}
                size="large"
                fullWidth
                disabled={spreadsheets.some(s => s.id === 'sample_video_db')}
              >
                {spreadsheets.some(s => s.id === 'sample_video_db') ? 'Sample Data Loaded' : 'Load Sample Data'}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleConnectSharePoint}
                size="large"
                fullWidth
              >
                Connect to SharePoint
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<SearchIcon />}
                onClick={handleQuickSearch}
                size="large"
                fullWidth
                disabled={spreadsheets.length === 0}
              >
                Start Searching
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Recent Search History
            </Typography>
            
            {searchHistory.length === 0 ? (
              <Typography color="textSecondary" sx={{ mt: 2 }}>
                No searches yet. Start by uploading a spreadsheet and searching through your data.
              </Typography>
            ) : (
              <List dense>
                {searchHistory.slice(0, 5).map((search) => (
                  <ListItem
                    key={search.id}
                    sx={{ px: 0 }}
                    secondaryAction={
                      <Chip
                        label={`${search.resultsCount} results`}
                        size="small"
                        variant="outlined"
                      />
                    }
                  >
                    <ListItemText
                      primary={search.query}
                      secondary={new Date(search.timestamp).toLocaleString()}
                      primaryTypographyProps={{
                        sx: { fontWeight: 500 }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Current Spreadsheets */}
        {spreadsheets.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Loaded Spreadsheets
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                {spreadsheets.map((sheet) => (
                  <Grid item xs={12} sm={6} md={4} key={sheet.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" component="div" noWrap>
                          {sheet.name}
                        </Typography>
                        <Typography sx={{ mb: 1.5 }} color="text.secondary">
                          {sheet.filename}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          <Chip label={`${sheet.data.length} rows`} size="small" />
                          <Chip label={`${sheet.headers.length} columns`} size="small" />
                          <Chip label={sheet.source} size="small" color="primary" />
                        </Box>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => navigate(`/search?sheet=${sheet.id}`)}
                        >
                          Search This Sheet
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
      
      <FileUploadDialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)} 
      />
    </Box>
  );
};

export default Dashboard; 