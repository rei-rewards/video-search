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
  Divider,
  TextField,
  Alert,
} from '@mui/material';
import {
  CloudSync as CloudSyncIcon,
  Security as SecurityIcon,
  Search as SearchIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useAppStore } from '../store/appStore';
import { sharePointService } from '../services/sharePointService';
import { isAzureConfigured } from '../utils/authConfig';

const SettingsPage: React.FC = () => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'success' | 'error' | null>(null);
  const [sharePointUrl, setSharePointUrl] = useState('');
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  
  const { 
    user, 
    setUser, 
    clearUser, 
    searchSettings, 
    updateSearchSettings,
    clearSearchHistory,
    addSpreadsheet,
  } = useAppStore();

  const handleConnectSharePoint = async () => {
    setIsConnecting(true);
    setConnectionStatus(null);

    try {
      await sharePointService.initialize();
      const userInfo = await sharePointService.signIn();
      setUser(userInfo);
      setConnectionStatus('success');
    } catch (error) {
      console.error('SharePoint authentication failed:', error);
      setConnectionStatus('error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await sharePointService.signOut();
      clearUser();
      setConnectionStatus(null);
    } catch (error) {
      console.error('SignOut failed:', error);
    }
  };

  const handleSearchSettingChange = (setting: keyof typeof searchSettings) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (setting === 'fuzzyThreshold' || setting === 'maxResults') {
        updateSearchSettings({ [setting]: event.target.value as unknown as number });
      } else {
        updateSearchSettings({ [setting]: event.target.checked });
      }
    };

  const handleFuzzyThresholdChange = (_: Event, value: number | number[]) => {
    updateSearchSettings({ fuzzyThreshold: value as number });
  };

  const handleMaxResultsChange = (_: Event, value: number | number[]) => {
    updateSearchSettings({ maxResults: value as number });
  };

  const handleLoadFromSharePoint = async () => {
    if (!sharePointUrl.trim()) {
      return;
    }

    setIsLoadingFile(true);
    setConnectionStatus(null);
    
    try {
      // Initialize SharePoint service if not already done
      await sharePointService.initialize();
      
      // Check if user is authenticated, if not, prompt for sign-in
      if (!sharePointService.isAuthenticated()) {
        console.log('User not authenticated, prompting for sign-in...');
        const userInfo = await sharePointService.signIn();
        setUser(userInfo);
      }
      
      console.log('Loading file from URL:', sharePointUrl);
      const spreadsheetData = await sharePointService.loadFileFromUrl(sharePointUrl);
      addSpreadsheet(spreadsheetData);
      setSharePointUrl('');
      setConnectionStatus('success');
    } catch (error) {
      console.error('Failed to load file:', error);
      
      // Set more specific error message
      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          setConnectionStatus('error');
        } else if (error.message.includes('consent')) {
          setConnectionStatus('error');
        } else if (error.message.includes('Invalid SharePoint URL')) {
          setConnectionStatus('error');
        } else {
          setConnectionStatus('error');
        }
      } else {
        setConnectionStatus('error');
      }
    } finally {
      setIsLoadingFile(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Account & Authentication */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AccountCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Account & Authentication
                </Typography>
              </Box>

              {user ? (
                <Box>
                  <Typography variant="body1" gutterBottom>
                    <strong>Name:</strong> {user.name}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    <strong>Email:</strong> {user.email}
                  </Typography>
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Connected to Microsoft 365
                  </Alert>
                </Box>
              ) : (
                <Box>
                  <Typography color="text.secondary" paragraph>
                    Connect to Microsoft 365 to access your SharePoint and OneDrive files.
                  </Typography>
                  {!isAzureConfigured() && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      <Typography variant="body2">
                        <strong>Demo Mode Active:</strong> Using placeholder Azure configuration. 
                        <br />
                        For Adobe organization access, you need your own Azure Client ID.
                        <br />
                        <strong>Quick fix:</strong> Try loading public/shared SharePoint files directly (no authentication needed).
                        <br />
                        See <code>AZURE_SETUP.md</code> for full enterprise setup.
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {connectionStatus === 'success' && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Successfully connected to SharePoint!
                </Alert>
              )}

              {connectionStatus === 'error' && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  <strong>Failed to load SharePoint file.</strong>
                  <br />
                  Common issues:
                  <br />
                  • <strong>AADSTS700016 Error:</strong> Demo Azure client ID not valid for your Adobe organization
                  <br />
                  • File requires authentication (try a public/shared link instead)
                  <br />
                  • Invalid SharePoint URL format
                  <br />
                  <strong>Quick fix:</strong> Use a SharePoint sharing link instead of a direct file URL.
                  <br />
                  Check browser console for detailed error.
                </Alert>
              )}
            </CardContent>
            <CardActions>
              {user ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisconnect}
                >
                  Disconnect
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<CloudSyncIcon />}
                  onClick={handleConnectSharePoint}
                  disabled={isConnecting || !isAzureConfigured()}
                >
                  {isConnecting ? 'Connecting...' : 'Connect to SharePoint'}
                </Button>
              )}
            </CardActions>
          </Card>
        </Grid>

        {/* Search Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SearchIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Search Preferences
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Fuzzy Search Threshold: {searchSettings.fuzzyThreshold}
                </Typography>
                <Slider
                  value={searchSettings.fuzzyThreshold}
                  onChange={handleFuzzyThresholdChange}
                  min={0.1}
                  max={1.0}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: 'Loose' },
                    { value: 0.5, label: 'Medium' },
                    { value: 1.0, label: 'Exact' },
                  ]}
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography gutterBottom>
                  Max Results: {searchSettings.maxResults}
                </Typography>
                <Slider
                  value={searchSettings.maxResults}
                  onChange={handleMaxResultsChange}
                  min={100}
                  max={5000}
                  step={100}
                  marks={[
                    { value: 100, label: '100' },
                    { value: 1000, label: '1K' },
                    { value: 5000, label: '5K' },
                  ]}
                />
              </Box>

              <FormControlLabel
                control={
                  <Switch
                    checked={searchSettings.searchInTags}
                    onChange={handleSearchSettingChange('searchInTags')}
                  />
                }
                label="Include tags in search"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={searchSettings.searchInMetadata}
                    onChange={handleSearchSettingChange('searchInMetadata')}
                  />
                }
                label="Include metadata in search"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={searchSettings.highlightResults}
                    onChange={handleSearchSettingChange('highlightResults')}
                  />
                }
                label="Highlight search terms in results"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Data Management */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Data Management
                </Typography>
              </Box>

              <Typography color="text.secondary" paragraph>
                Manage your local data and search history. This data is stored locally in your browser.
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={clearSearchHistory}
                >
                  Clear Search History
                </Button>
                
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                >
                  Clear All Local Data
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* SharePoint File Access */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                SharePoint File Access
              </Typography>
              
              {user ? (
                <Typography color="text.secondary" paragraph>
                  ✅ Connected - You can now load files from SharePoint URLs
                </Typography>
              ) : (
                <Typography color="text.secondary" paragraph>
                  Paste SharePoint file URLs below. You'll be prompted to sign in when loading the file.
                </Typography>
              )}
              
              <TextField
                fullWidth
                label="SharePoint File URL"
                placeholder="https://yourcompany.sharepoint.com/sites/sitename/Shared Documents/yourfile.xlsx"
                variant="outlined"
                value={sharePointUrl}
                onChange={(e) => setSharePointUrl(e.target.value)}
                sx={{ mb: 2 }}
                helperText="Supports Excel (.xlsx, .xls) and CSV files from SharePoint"
              />
              
              <Button 
                variant="contained"
                onClick={handleLoadFromSharePoint}
                disabled={isLoadingFile || !sharePointUrl.trim()}
                sx={{ mr: 2 }}
              >
                {isLoadingFile ? 'Loading...' : 'Load File from SharePoint'}
              </Button>
              
              {!user && (
                <Button 
                  variant="outlined"
                  onClick={handleConnectSharePoint}
                  disabled={isConnecting || !isAzureConfigured()}
                >
                  {isConnecting ? 'Connecting...' : 'Sign In to SharePoint'}
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SettingsPage; 