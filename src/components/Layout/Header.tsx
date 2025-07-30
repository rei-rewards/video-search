import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Button,
  Box,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  CloudUpload as CloudUploadIcon,
  AccountCircle as AccountCircleIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import FileUploadDialog from '../FileUpload/FileUploadDialog';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const { sidebarOpen, setSidebarOpen, user } = useAppStore();
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleUploadClick = () => {
    setUploadDialogOpen(true);
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        zIndex: (theme) => theme.zIndex.drawer + 1,
        backgroundColor: '#1976d2',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="toggle sidebar"
          onClick={handleMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{ 
            flexGrow: 0, 
            mr: 4,
            cursor: 'pointer',
            fontWeight: 600,
          }}
          onClick={() => navigate('/')}
        >
          Spreadsheet Search Pro
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Quick Search (Ctrl+K)">
            <IconButton
              color="inherit"
              onClick={handleSearchClick}
              aria-label="search"
            >
              <SearchIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Upload Spreadsheet">
            <IconButton
              color="inherit"
              onClick={handleUploadClick}
              aria-label="upload"
            >
              <CloudUploadIcon />
            </IconButton>
          </Tooltip>

          {user ? (
            <Tooltip title={user.name || user.email || 'User'}>
              <Avatar
                sx={{ 
                  width: 32, 
                  height: 32, 
                  ml: 1,
                  cursor: 'pointer',
                  bgcolor: 'secondary.main',
                }}
                onClick={() => navigate('/settings')}
              >
                {(user.name || user.email || 'U')[0].toUpperCase()}
              </Avatar>
            </Tooltip>
          ) : (
            <Button
              color="inherit"
              startIcon={<AccountCircleIcon />}
              onClick={() => navigate('/settings')}
              sx={{ ml: 1 }}
            >
              Sign In
            </Button>
          )}
        </Box>
      </Toolbar>
      
      <FileUploadDialog 
        open={uploadDialogOpen} 
        onClose={() => setUploadDialogOpen(false)} 
      />
    </AppBar>
  );
};

export default Header; 