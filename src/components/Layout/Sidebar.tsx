import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  TableChart as TableChartIcon,
  Delete as DeleteIcon,
  CloudDownload as CloudDownloadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

const DRAWER_WIDTH = 240;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, spreadsheets, removeSpreadsheet } = useAppStore();

  const menuItems = [
    { label: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { label: 'Search', icon: <SearchIcon />, path: '/search' },
    { label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleSpreadsheetClick = (sheetId: string) => {
    navigate(`/search?sheet=${sheetId}`);
  };

  const handleDeleteSpreadsheet = (sheetId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeSpreadsheet(sheetId);
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'sharepoint':
      case 'onedrive':
        return <CloudDownloadIcon fontSize="small" />;
      default:
        return <TableChartIcon fontSize="small" />;
    }
  };

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          mt: 8, // Account for header
          height: 'calc(100vh - 64px)',
        },
      }}
    >
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Spreadsheets ({spreadsheets.length})
        </Typography>
        
        {spreadsheets.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            No spreadsheets loaded. Upload or connect to your files to get started.
          </Typography>
        ) : (
          <List dense>
            {spreadsheets.map((sheet) => (
              <ListItem
                key={sheet.id}
                disablePadding
                secondaryAction={
                  <Tooltip title="Remove spreadsheet">
                    <IconButton
                      edge="end"
                      size="small"
                      onClick={(e) => handleDeleteSpreadsheet(sheet.id, e)}
                      aria-label="delete"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                }
              >
                <ListItemButton
                  onClick={() => handleSpreadsheetClick(sheet.id)}
                  sx={{ pr: 6 }} // Make room for delete button
                >
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    {getSourceIcon(sheet.source)}
                  </ListItemIcon>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {sheet.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Chip
                        label={`${sheet.data.length} rows`}
                        size="small"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                      <Chip
                        label={sheet.source}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ height: 16, fontSize: '0.65rem' }}
                      />
                    </Box>
                  </Box>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar; 