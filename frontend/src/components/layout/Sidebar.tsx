import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Collapse,
  Tooltip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  NetworkCheck as NetworkIcon,
  NotificationsActive as AlertsIcon,
  Event as EventsIcon,
  DeviceHub as EntitiesIcon,
  Rule as RulesIcon,
  Assessment as ReportsIcon,
  ExpandLess,
  ExpandMore,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Storage as DataIcon,
  Language as ThreatIntelIcon,
  VerifiedUser as ComplianceIcon,
  Logout as LogoutIcon,
  BugReport as ScanIcon,
  History as AuditIcon
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import logo from '../../assets/images/logo.png';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface MenuGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  items?: MenuItem[];
  roles?: string[];
  divider?: boolean;
}

interface MenuItem {
  id: string;
  label: string;
  path: string;
  icon?: React.ReactNode;
  roles?: string[];
  badge?: {
    value: number;
    color: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  };
}

const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // State for open menu groups
  const [openGroups, setOpenGroups] = useState<string[]>(['dashboard', 'security']);
  
  // Check if menu item is active
  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  // Toggle menu group
  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => {
      if (prev.includes(groupId)) {
        return prev.filter(id => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };
  
  // Handle menu item click
  const handleMenuItemClick = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };
  
  // Check user role access
  const hasAccess = (roles?: string[]) => {
    if (!roles || roles.length === 0) return true;
    return user && roles.includes(user.role);
  };
  
  // Define menu structure
  const menuGroups: MenuGroup[] = [
    {
      id: 'dashboard',
      label: 'Dashboards',
      icon: <DashboardIcon />,
      items: [
        { id: 'main', label: 'Ana Dashboard', path: '/dashboard', icon: <DashboardIcon fontSize="small" /> },
        { id: 'security', label: 'Güvenlik', path: '/security', icon: <SecurityIcon fontSize="small" /> },
        { id: 'network', label: 'Ağ', path: '/network', icon: <NetworkIcon fontSize="small" /> }
      ]
    },
    {
      id: 'security',
      label: 'Güvenlik',
      icon: <SecurityIcon />,
      items: [
        { 
          id: 'alerts', 
          label: 'Alarmlar', 
          path: '/alerts', 
          icon: <AlertsIcon fontSize="small" />,
          badge: { value: 12, color: 'error' }
        },
        { id: 'events', label: 'Olaylar', path: '/events', icon: <EventsIcon fontSize="small" /> },
        { id: 'entities', label: 'Varlıklar', path: '/entities', icon: <EntitiesIcon fontSize="small" /> },
        { 
          id: 'rules', 
          label: 'Korelasyon Kuralları', 
          path: '/rules', 
          icon: <RulesIcon fontSize="small" />,
          roles: ['admin', 'analyst']
        }
      ]
    },
    {
      id: 'analysis',
      label: 'Analiz',
      icon: <DataIcon />,
      items: [
        { id: 'reports', label: 'Raporlar', path: '/reports', icon: <ReportsIcon fontSize="small" /> },
        { 
          id: 'network-scan', 
          label: 'Ağ Taramaları', 
          path: '/network-scan', 
          icon: <ScanIcon fontSize="small" />,
          roles: ['admin', 'analyst']
        },
        { 
          id: 'threat-intelligence', 
          label: 'Tehdit İstihbaratı', 
          path: '/threat-intelligence', 
          icon: <ThreatIntelIcon fontSize="small" /> 
        },
        { 
          id: 'compliance', 
          label: 'Uyumluluk', 
          path: '/compliance', 
          icon: <ComplianceIcon fontSize="small" />,
          roles: ['admin', 'analyst', 'auditor']
        }
      ]
    },
    {
      id: 'system',
      label: 'Sistem',
      icon: <SettingsIcon />,
      items: [
        { 
          id: 'audit-log', 
          label: 'Denetim Kayıtları', 
          path: '/audit-log', 
          icon: <AuditIcon fontSize="small" />,
          roles: ['admin', 'auditor']
        },
        { id: 'settings', label: 'Ayarlar', path: '/settings', icon: <SettingsIcon fontSize="small" /> },
        { id: 'help', label: 'Yardım', path: '/help', icon: <HelpIcon fontSize="small" /> }
      ],
      divider: true
    }
  ];
  
  // Render menu item
  const renderMenuItem = (item: MenuItem) => {
    if (!hasAccess(item.roles)) return null;
    
    return (
      <ListItem key={item.id} disablePadding>
        <ListItemButton
          selected={isActive(item.path)}
          onClick={() => handleMenuItemClick(item.path)}
          sx={{ pl: item.icon ? 3 : 8 }}
        >
          {item.icon && (
            <ListItemIcon sx={{ minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
          )}
          <ListItemText 
            primary={item.label} 
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
          {item.badge && (
            <Box
              sx={{
                bgcolor: theme.palette[item.badge.color].main,
                color: theme.palette[item.badge.color].contrastText,
                borderRadius: '10px',
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 24,
                height: 20
              }}
            >
              {item.badge.value}
            </Box>
          )}
        </ListItemButton>
      </ListItem>
    );
  };
  
  // Render menu group
  const renderMenuGroup = (group: MenuGroup) => {
    if (!hasAccess(group.roles)) return null;
    
    const isGroupOpen = openGroups.includes(group.id);
    
    return (
      <React.Fragment key={group.id}>
        <ListItem disablePadding>
          <ListItemButton onClick={() => toggleGroup(group.id)}>
            <ListItemIcon>
              {group.icon}
            </ListItemIcon>
            <ListItemText primary={group.label} />
            {isGroupOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
        </ListItem>
        <Collapse in={isGroupOpen} timeout="auto" unmountOnExit>
          <List disablePadding>
            {group.items?.map(item => renderMenuItem(item))}
          </List>
        </Collapse>
        {group.divider && <Divider sx={{ my: 1 }} />}
      </React.Fragment>
    );
  };
  
  // Drawer content
  const drawerContent = (
    <Box
      sx={{
        width: 240,
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Logo and App Name */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <img src={logo} alt="NDR Logo" height="40" />
        <Typography
          variant="h6"
          component="div"
          sx={{ ml: 1, fontWeight: 'bold' }}
        >
          NDR Motoru
        </Typography>
      </Box>
      
      {/* Menu */}
      <List
        sx={{
          width: '100%',
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden'
        }}
      >
        {menuGroups.map(group => renderMenuGroup(group))}
      </List>
      
      {/* Logout */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <ListItem disablePadding>
          <ListItemButton onClick={() => navigate('/logout')}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" />
          </ListItemButton>
        </ListItem>
      </Box>
    </Box>
  );
  
  return (
    <Box
      component="nav"
      sx={{ width: { sm: open ? 240 : 0 }, flexShrink: { sm: 0 } }}
    >
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={isMobile ? open : false}
        onClose={onClose}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 240 },
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Desktop drawer */}
      <Drawer
        variant="persistent"
        open={open}
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: 240, border: 'none' },
        }}
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;