import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  CssBaseline,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme
} from '@mui/material';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import Footer from './Footer';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../hooks/useNotification';
import { useSettings } from '../../hooks/useSettings';

const AppLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { notification, closeNotification } = useNotification();
  const { settings } = useSettings();
  
  // State
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [sessionTimeout, setSessionTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState<boolean>(false);
  
  // Handle authentication check
  useEffect(() => {
    if (!authLoading && !isAuthenticated && !location.pathname.includes('/auth')) {
      // Redirect to login if not authenticated
      navigate('/login', { replace: true, state: { from: location } });
    }
  }, [isAuthenticated, authLoading, location]);
  
  // Handle drawer state on mobile/desktop
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);
  
  // Setup session timeout warning
  useEffect(() => {
    if (isAuthenticated && settings?.security?.sessionTimeout) {
      const timeoutMinutes = settings.security.sessionTimeout;
      const warningTime = timeoutMinutes * 60 * 1000 - (2 * 60 * 1000); // 2 minutes before timeout
      
      // Clear any existing timeout
      if (sessionTimeout) {
        clearTimeout(sessionTimeout);
      }
      
      // Set new timeout warning
      const timeoutId = setTimeout(() => {
        setShowSessionWarning(true);
      }, warningTime);
      
      setSessionTimeout(timeoutId);
      
      return () => {
        if (sessionTimeout) {
          clearTimeout(sessionTimeout);
        }
      };
    }
  }, [isAuthenticated, settings, location]);
  
  // Handle global loading state
  const handleLoading = (isLoading: boolean) => {
    setIsLoading(isLoading);
  };
  
  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  // Close drawer on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setDrawerOpen(false);
    }
  }, [location.pathname, isMobile]);
  
  // Show loading screen while authenticating
  if (authLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          width: '100vw',
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }
  
  // Don't render layout for auth pages
  if (!isAuthenticated || location.pathname.includes('/auth')) {
    return <Outlet />;
  }
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Top Navigation Bar */}
      <Navbar
        onToggleDrawer={handleDrawerToggle}
        drawerOpen={drawerOpen}
      />
      
      {/* Sidebar / Drawer */}
      <Sidebar
        open={drawerOpen}
        onClose={handleDrawerToggle}
      />
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? 240 : 0}px)` },
          ml: { sm: drawerOpen ? '240px' : 0 },
          mt: '64px', // Navbar height
          mb: '50px', // Footer height
          transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          overflowY: 'auto',
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 114px)', // Subtract navbar and footer height
        }}
      >
        <Outlet />
      </Box>
      
      {/* Footer */}
      <Footer />
      
      {/* Global notification */}
      <Snackbar
        open={Boolean(notification)}
        autoHideDuration={notification?.duration || 6000}
        onClose={closeNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {notification && (
          <Alert
            onClose={closeNotification}
            severity={notification.type}
            variant="filled"
            sx={{ width: '100%' }}
          >
            {notification.message}
          </Alert>
        )}
      </Snackbar>
      
      {/* Global loading overlay */}
      {isLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
      
      {/* Session timeout warning */}
      <Dialog
        open={showSessionWarning}
        onClose={() => setShowSessionWarning(false)}
      >
        <DialogContent>
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              Your session is about to expire due to inactivity.
            </Alert>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  // Reset session timeout
                  if (sessionTimeout) {
                    clearTimeout(sessionTimeout);
                  }
                  setShowSessionWarning(false);
                  
                  // API call to extend session
                  // This would typically be implemented by calling the auth service
                }}
              >
                Stay Logged In
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => {
                  // Log out the user
                  navigate('/logout');
                }}
              >
                Logout
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default AppLayout;