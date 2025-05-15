import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  ListItemButton,
  useTheme,
  useMediaQuery,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Security,
  NetworkCheck,
  Warning,
  Computer,
  Event,
  Assessment,
  Notifications,
  Settings,
  Person,
  Logout,
  ChevronLeft,
  Brightness4,
  Brightness7,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useThemeContext } from '../../context/ThemeContext';
import logo from '../../assets/images/logo.png';

interface NavbarProps {
  onToggleDrawer: () => void;
  drawerOpen: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleDrawer, drawerOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { mode, toggleMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State
  const [accountMenuAnchor, setAccountMenuAnchor] = useState<null | HTMLElement>(null);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState<null | HTMLElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    security: true
  });
  
  // Navigation items grouped
  const navGroups = [
    {
      id: 'main',
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: <Dashboard /> },
      ]
    },
    {
      id: 'security',
      label: 'Security',
      items: [
        { path: '/security', label: 'Security Dashboard', icon: <Security /> },
        { path: '/alerts', label: 'Alerts', icon: <Warning /> },
        { path: '/events', label: 'Events', icon: <Event /> },
      ]
    },
    {
      id: 'network',
      label: 'Network',
      items: [
        { path: '/network', label: 'Network Overview', icon: <NetworkCheck /> },
        { path: '/entities', label: 'Entities', icon: <Computer /> },
      ]
    },
    {
      id: 'reports',
      label: 'Analysis & Reports',
      items: [
        { path: '/reports', label: 'Reports', icon: <Assessment /> },
      ]
    },
  ];
  
  // Check if a path is active
  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };
  
  // Toggle menu expansion
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };
  
  // Handle account menu open
  const handleAccountMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAccountMenuAnchor(event.currentTarget);
  };
  
  // Handle account menu close
  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };
  
  // Handle notifications menu open
  const handleNotificationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };
  
  // Handle notifications menu close
  const handleNotificationsMenuClose = () => {
    setNotificationsMenuAnchor(null);
  };
  
  // Handle logout
  const handleLogout = () => {
    handleAccountMenuClose();
    logout();
    navigate('/login');
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    handleAccountMenuClose();
    navigate('/profile');
  };
  
  // Handle settings click
  const handleSettingsClick = () => {
    handleAccountMenuClose();
    navigate('/settings');
  };
  
  // Render navigation items
  const renderNavItems = () => {
    return navGroups.map(group => {
      const groupExpanded = expandedGroups[group.id] !== false;
      
      return (
        <React.Fragment key={group.id}>
          {group.label ? (
            <>
              <ListItem 
                disablePadding
                button
                onClick={() => toggleGroupExpansion(group.id)}
                sx={{
                  px: 1,
                  py: 0.5
                }}
              >
                <ListItemText 
                  primary={group.label} 
                  primaryTypographyProps={{ 
                    variant: 'overline',
                    color: 'text.secondary'
                  }}
                />
                {groupExpanded ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              {groupExpanded && renderGroupItems(group.items)}
              <Divider sx={{ my: 1 }} />
            </>
          ) : (
            <>
              {renderGroupItems(group.items)}
              <Divider sx={{ my: 1 }} />
            </>
          )}
        </React.Fragment>
      );
    });
  };
  
  // Render group items
  const renderGroupItems = (items: any[]) => {
    return items.map(item => (
      <ListItem 
        key={item.path} 
        disablePadding 
        sx={{ 
          display: 'block',
          my: 0.5
        }}
      >
        <ListItemButton
          component={Link}
          to={item.path}
          selected={isActive(item.path)}
          sx={{
            minHeight: 48,
            px: 2.5,
            borderRadius: 1,
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 0,
              mr: 2,
              justifyContent: 'center',
              color: isActive(item.path) ? 'primary.main' : 'inherit'
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.label}
            primaryTypographyProps={{
              noWrap: true,
              fontSize: 14,
              fontWeight: isActive(item.path) ? 'medium' : 'normal'
            }}
          />
        </ListItemButton>
      </ListItem>
    ));
  };
  
  return (
    <>
      {/* App Bar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          bgcolor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          boxShadow: 1
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onToggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
            <img src={logo} alt="Logo" style={{ height: 36, marginRight: 8 }} />
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{ fontWeight: 600, letterSpacing: '0.025em', display: { xs: 'none', sm: 'block' } }}
            >
              NDR Korelasyon Motoru
            </Typography>
          </Box>
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Theme toggler */}
          <Tooltip title={`${mode === 'dark' ? 'Light' : 'Dark'} Mode`}>
            <IconButton color="inherit" onClick={toggleMode}>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Tooltip>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton color="inherit" onClick={handleNotificationsMenuOpen}>
              <Badge badgeContent={3} color="error">
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>
          
          {/* User Menu */}
          <Box sx={{ ml: 2 }}>
            <Tooltip title="Account">
              <IconButton
                onClick={handleAccountMenuOpen}
                size="small"
                sx={{ ml: 1 }}
                aria-controls="account-menu"
                aria-haspopup="true"
              >
                <Avatar 
                  alt={user?.name || 'User'}
                  src={user?.avatarUrl}
                  sx={{ width: 32, height: 32 }}
                />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={drawerOpen}
        onClose={onToggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            pt: 8
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <List>
            {renderNavItems()}
          </List>
          
          <Box sx={{ mt: 'auto' }}>
            <List>
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/notifications"
                  selected={isActive('/notifications')}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <Badge badgeContent={3} color="error">
                      <Notifications />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText primary="Notifications" />
                </ListItemButton>
              </ListItem>
              
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  to="/settings"
                  selected={isActive('/settings')}
                  sx={{ borderRadius: 1 }}
                >
                  <ListItemIcon>
                    <Settings />
                  </ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
            </List>
          </Box>
        </Box>
      </Drawer>
      
      {/* Account Menu */}
      <Menu
        id="account-menu"
        anchorEl={accountMenuAnchor}
        open={Boolean(accountMenuAnchor)}
        onClose={handleAccountMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleProfileClick}>
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleSettingsClick}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        
        <Divider />
        
        <MenuItem>
          <FormControlLabel
            control={
              <Switch 
                checked={mode === 'dark'} 
                onChange={toggleMode} 
                size="small"
              />
            }
            label={mode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          />
        </MenuItem>
        
        <Divider />
        
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        id="notifications-menu"
        anchorEl={notificationsMenuAnchor}
        open={Boolean(notificationsMenuAnchor)}
        onClose={handleNotificationsMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360,
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle1" fontWeight="medium">
            Notifications
          </Typography>
        </Box>
        
        <Divider />
        
        <List sx={{ p: 0 }}>
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Badge color="error" variant="dot">
                <Warning color="error" />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary="Critical Alert: Port Scan Detected"
              secondary="2 minutes ago"
              primaryTypographyProps={{ fontWeight: 'medium' }}
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Event color="warning" />
            </ListItemIcon>
            <ListItemText
              primary="New security event detected"
              secondary="15 minutes ago"
            />
          </ListItem>
          
          <Divider component="li" />
          
          <ListItem sx={{ py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Computer color="info" />
            </ListItemIcon>
            <ListItemText
              primary="New entity discovered on network"
              secondary="1 hour ago"
            />
          </ListItem>
        </List>
        
        <Divider />
        
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1.5 }}>
          <Button
            size="small"
            onClick={() => {
              handleNotificationsMenuClose();
              navigate('/notifications');
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
};

export default Navbar;