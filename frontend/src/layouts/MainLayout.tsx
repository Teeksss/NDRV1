import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from '../components/layout/Navbar';
import { useTheme } from '@mui/material/styles';
import { WebSocketService } from '../services/WebSocketService';
import { useAuth } from '../hooks/useAuth';
import { useSettings } from '../context/SettingsContext';

const MainLayout: React.FC = () => {
  const [drawerOpen, setDrawerOpen] = useState(true);
  const location = useLocation();
  const theme = useTheme();
  const { user } = useAuth();
  const { settings } = useSettings();
  const [wsConnection, setWsConnection] = useState<WebSocketService | null>(null);

  // Toggle drawer
  const handleToggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Initialize WebSocket connection
  useEffect(() => {
    if (user) {
      const webSocketService = new WebSocketService();
      webSocketService.connect();
      
      setWsConnection(webSocketService);
      
      // Cleanup on unmount
      return () => {
        webSocketService.disconnect();
      };
    }
  }, [user]);

  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar
        onToggleDrawer={handleToggleDrawer}
        drawerOpen={drawerOpen}
      />
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: '64px', // To account for the fixed app bar
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(drawerOpen && {
            width: { md: `calc(100% - 240px)` },
            ml: { md: `240px` },
            transition: theme.transitions.create(['margin', 'width'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout;