import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Switch,
  FormControlLabel,
  Slider,
  TextField,
  Alert,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  CloudSync as CloudSyncIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Folder as WorkspaceIcon,
  Link as LinkIcon,
  Google as GoogleIcon,
  Microsoft as MicrosoftIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { sharePointService } from '../services/sharePointService';
import { GoogleSheetsService } from '../services/googleSheetsService';
import { isAzureConfigured } from '../utils/authConfig';

interface LoadResult {
  url: string;
  success: boolean;
  name?: string;
  error?: string;
}

const EnhancedSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  
  // Batch loading state
  const [batchUrls, setBatchUrls] = useState('');
  const [isLoadingBatch, setIsLoadingBatch] = useState(false);
  const [loadResults, setLoadResults] = useState<LoadResult[]>([]);
  const [loadProgress, setLoadProgress] = useState(0);
  
  // Workspace management
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceUrls, setNewWorkspaceUrls] = useState('');
  
  const { 
    user, 
    setUser, 
    clearUser, 
    searchSettings, 
    updateSearchSettings,
    clearSearchHistory,
    addSpreadsheet,
    addMultipleSpreadsheets,
    savedWorkspaces,
    addWorkspace,
    loadWorkspace,
    removeWorkspace,
  } = useAppStore();

  const handleConnectSharePoint = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      await sharePointService.initialize();
      const userInfo = await sharePointService.signIn();
      
      setUser({
        id: (userInfo as any).id || 'user-' + Date.now(),
        name: (userInfo as any).displayName || (userInfo as any).name || 'Unknown User',
        email: (userInfo as any).mail || (userInfo as any).userPrincipalName || (userInfo as any).email || 'unknown@domain.com',
      });
      
      setConnectionStatus('success');
    } catch (error) {
      console.error('SharePoint connection failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleLoadFromUrls = async (urls: string[]) => {
    setIsLoadingBatch(true);
    setLoadResults([]);
    setLoadProgress(0);

    const results: LoadResult[] = [];
    const loadedSheets = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i].trim();
      if (!url) continue;

      try {
        setLoadProgress(((i + 1) / urls.length) * 100);

        let spreadsheetData;
        if (GoogleSheetsService.isGoogleSheetsUrl(url)) {
          spreadsheetData = await GoogleSheetsService.loadFromUrl(url);
        } else {
          // Assume SharePoint/OneDrive
          spreadsheetData = await sharePointService.loadFileFromUrl(url);
        }

        loadedSheets.push(spreadsheetData);
        results.push({
          url,
          success: true,
          name: spreadsheetData.name,
        });
      } catch (error) {
        console.error(`Failed to load ${url}:`, error);
        results.push({
          url,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (loadedSheets.length > 0) {
      addMultipleSpreadsheets(loadedSheets);
    }

    setLoadResults(results);
    setIsLoadingBatch(false);
  };

  const handleBatchLoad = async () => {
    const urls = batchUrls.split('\n').map(url => url.trim()).filter(url => url);
    if (urls.length === 0) return;

    await handleLoadFromUrls(urls);
  };

  const handleSaveWorkspace = () => {
    if (!newWorkspaceName.trim() || !newWorkspaceUrls.trim()) return;

    const urls = newWorkspaceUrls.split('\n').map(url => url.trim()).filter(url => url);
    addWorkspace(newWorkspaceName.trim(), urls);
    
    setNewWorkspaceName('');
    setNewWorkspaceUrls('');
    setWorkspaceDialogOpen(false);
  };

  const handleLoadWorkspace = async (workspaceId: string) => {
    const urls = loadWorkspace(workspaceId);
    if (urls.length > 0) {
      await handleLoadFromUrls(urls);
    }
  };

  const renderCloudIntegration = () => (
    <Grid container spacing={3}>
      {/* Batch URL Loading */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <LinkIcon color="primary" />
              <Typography variant="h6">Batch Load Spreadsheets</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Load multiple spreadsheets at once from Google Sheets or SharePoint URLs (one per line)
            </Typography>
            
            <TextField
              fullWidth
              multiline
              rows={6}
              placeholder={`Paste your URLs here, one per line:
https://docs.google.com/spreadsheets/d/...
https://adobe-my.sharepoint.com/:x:/...
https://onedrive.live.com/...`}
              value={batchUrls}
              onChange={(e) => setBatchUrls(e.target.value)}
              sx={{ mb: 2 }}
            />
            
            {isLoadingBatch && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant="determinate" value={loadProgress} />
                <Typography variant="caption" color="text.secondary">
                  Loading... {Math.round(loadProgress)}%
                </Typography>
              </Box>
            )}
            
            {loadResults.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Load Results:</Typography>
                {loadResults.map((result, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Chip 
                      size="small"
                      color={result.success ? 'success' : 'error'}
                      label={result.success ? 'Success' : 'Failed'}
                    />
                    <Typography variant="caption" sx={{ flex: 1 }}>
                      {result.success ? result.name : result.error}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
          <CardActions>
            <Button
              variant="contained"
              onClick={handleBatchLoad}
              disabled={!batchUrls.trim() || isLoadingBatch}
              startIcon={isLoadingBatch ? <CircularProgress size={16} /> : <UploadIcon />}
            >
              Load All Spreadsheets
            </Button>
          </CardActions>
        </Card>
      </Grid>

      {/* SharePoint Integration */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <MicrosoftIcon color="primary" />
              <Typography variant="h6">SharePoint Integration</Typography>
            </Box>
            
            {!isAzureConfigured() && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Azure client ID not configured. Using demo mode with limited functionality.
              </Alert>
            )}

            {user ? (
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Connected as: {user.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Email: {user.email}
                </Typography>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Connect to SharePoint to access your organization's files
              </Typography>
            )}
          </CardContent>
          <CardActions>
            {user ? (
              <Button onClick={clearUser} color="secondary">
                Disconnect
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleConnectSharePoint}
                disabled={isConnecting}
                startIcon={isConnecting ? <CircularProgress size={16} /> : <CloudSyncIcon />}
              >
                {isConnecting ? 'Connecting...' : 'Connect to SharePoint'}
              </Button>
            )}
          </CardActions>
        </Card>
      </Grid>

      {/* Google Sheets Integration */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <GoogleIcon color="primary" />
              <Typography variant="h6">Google Sheets</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Load Google Sheets directly by URL. The sheet must be publicly viewable or shared with view permissions.
            </Typography>
          </CardContent>
          <CardActions>
            <Button variant="outlined" disabled>
              Automatic via Batch Load
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );

  const renderWorkspaceManagement = () => (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <WorkspaceIcon color="primary" />
                <Typography variant="h6">Saved Workspaces</Typography>
              </Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setWorkspaceDialogOpen(true)}
              >
                New Workspace
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Save collections of spreadsheet URLs for quick loading
            </Typography>

            {savedWorkspaces.length === 0 ? (
              <Alert severity="info">
                No workspaces saved yet. Create one to quickly load multiple spreadsheets.
              </Alert>
            ) : (
              <List>
                {savedWorkspaces.map((workspace) => (
                  <ListItem key={workspace.id} divider>
                    <ListItemText
                      primary={workspace.name}
                      secondary={`${workspace.urls.length} URLs • Last used: ${new Date(workspace.lastUsed).toLocaleDateString()}`}
                    />
                    <ListItemSecondaryAction>
                      <Button
                        size="small"
                        onClick={() => handleLoadWorkspace(workspace.id)}
                        sx={{ mr: 1 }}
                      >
                        Load
                      </Button>
                      <IconButton
                        edge="end"
                        onClick={() => removeWorkspace(workspace.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderSearchSettings = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <SearchIcon color="primary" />
              <Typography variant="h6">Search Configuration</Typography>
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={searchSettings.searchInTags}
                  onChange={(e) => updateSearchSettings({ searchInTags: e.target.checked })}
                />
              }
              label="Search in tags"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={searchSettings.searchInMetadata}
                  onChange={(e) => updateSearchSettings({ searchInMetadata: e.target.checked })}
                />
              }
              label="Search in metadata"
              sx={{ mb: 2 }}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={searchSettings.highlightResults}
                  onChange={(e) => updateSearchSettings({ highlightResults: e.target.checked })}
                />
              }
              label="Highlight search terms"
              sx={{ mb: 3 }}
            />
            
            <Typography gutterBottom>
              Fuzzy Search Threshold: {searchSettings.fuzzyThreshold}
            </Typography>
            <Slider
              value={searchSettings.fuzzyThreshold}
              onChange={(_, value) => updateSearchSettings({ fuzzyThreshold: value as number })}
              min={0}
              max={1}
              step={0.1}
              sx={{ mb: 2 }}
            />
            
            <Typography gutterBottom>
              Max Results: {searchSettings.maxResults}
            </Typography>
            <Slider
              value={searchSettings.maxResults}
              onChange={(_, value) => updateSearchSettings({ maxResults: value as number })}
              min={100}
              max={5000}
              step={100}
              sx={{ mb: 2 }}
            />
          </CardContent>
          <CardActions>
            <Button onClick={clearSearchHistory} color="secondary">
              Clear Search History
            </Button>
          </CardActions>
        </Card>
      </Grid>
    </Grid>
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Enhanced Settings
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
        >
          <Tab label="Cloud Integration" />
          <Tab label="Workspaces" />
          <Tab label="Search Settings" />
        </Tabs>
      </Paper>

      {activeTab === 0 && renderCloudIntegration()}
      {activeTab === 1 && renderWorkspaceManagement()}
      {activeTab === 2 && renderSearchSettings()}

      {/* Workspace Creation Dialog */}
      <Dialog open={workspaceDialogOpen} onClose={() => setWorkspaceDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Workspace Name"
            value={newWorkspaceName}
            onChange={(e) => setNewWorkspaceName(e.target.value)}
            sx={{ mb: 2, mt: 1 }}
          />
          <TextField
            fullWidth
            multiline
            rows={6}
            label="URLs (one per line)"
            placeholder={`https://docs.google.com/spreadsheets/d/...
https://adobe-my.sharepoint.com/:x:/...`}
            value={newWorkspaceUrls}
            onChange={(e) => setNewWorkspaceUrls(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWorkspaceDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveWorkspace}
            variant="contained"
            disabled={!newWorkspaceName.trim() || !newWorkspaceUrls.trim()}
            startIcon={<SaveIcon />}
          >
            Save Workspace
          </Button>
        </DialogActions>
      </Dialog>

      {connectionStatus && (
        <Alert 
          severity={connectionStatus} 
          sx={{ mt: 2 }}
          onClose={() => setConnectionStatus(null)}
        >
          {connectionStatus === 'success' 
            ? 'Successfully connected to SharePoint!' 
            : 'Failed to connect. Please try again.'}
        </Alert>
      )}
    </Box>
  );
};

export default EnhancedSettingsPage;