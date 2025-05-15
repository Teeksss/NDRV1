import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tabs,
  Tab,
  IconButton,
  CircularProgress,
  InputAdornment,
  Snackbar,
  Alert,
  useTheme
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Visibility,
  VisibilityOff,
  Person,
  Security,
  History,
  Email,
  Phone,
  AccountCircle,
  VpnKey,
  Badge
} from '@mui/icons-material';
import { AuthService } from '../services/AuthService';
import { useAuth } from '../hooks/useAuth';
import { formatDate } from '../utils/formatters';

const ProfilePage: React.FC = () => {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [activeTab, setActiveTab] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [profileData, setProfileData] = useState<any>({
    name: '',
    email: '',
    phone: '',
    title: '',
    department: '',
    bio: ''
  });
  const [passwordData, setPasswordData] = useState<any>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState<any>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        title: user.title || '',
        department: user.department || '',
        bio: user.bio || ''
      });
      
      // Load activity logs
      loadActivityLogs();
    }
  }, [user]);
  
  // Load activity logs
  const loadActivityLogs = async () => {
    try {
      setLoading(true);
      const authService = new AuthService();
      const logs = await authService.getActivityLogs();
      setActivityLogs(logs);
      setLoading(false);
    } catch (error) {
      console.error('Error loading activity logs:', error);
      setError('Failed to load activity logs');
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle edit mode toggle
  const handleEditToggle = () => {
    setEditMode(!editMode);
    
    // Reset data if canceling edit
    if (editMode && user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        title: user.title || '',
        department: user.department || '',
        bio: user.bio || ''
      });
    }
  };
  
  // Handle profile data change
  const handleProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle password data change
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle show password toggle
  const handleTogglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };
  
  // Handle avatar change
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;
    
    try {
      setLoading(true);
      setUploadProgress(0);
      
      const authService = new AuthService();
      await authService.uploadAvatar(avatarFile, (progress) => {
        setUploadProgress(progress);
      });
      
      setSuccessMessage('Avatar updated successfully');
      setAvatarFile(null);
      setUploadProgress(0);
      setLoading(false);
    } catch (error) {
      console.error('Avatar upload error:', error);
      setError('Failed to upload avatar');
      setLoading(false);
    }
  };
  
  // Handle profile update
  const handleProfileUpdate = async () => {
    try {
      setLoading(true);
      
      const authService = new AuthService();
      await authService.updateProfile(profileData);
      
      setSuccessMessage('Profile updated successfully');
      setEditMode(false);
      setLoading(false);
    } catch (error) {
      console.error('Profile update error:', error);
      setError('Failed to update profile');
      setLoading(false);
    }
  };
  
  // Handle password update
  const handlePasswordUpdate = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirmation do not match');
      return;
    }
    
    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }
    
    try {
      setLoading(true);
      
      const authService = new AuthService();
      await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setSuccessMessage('Password changed successfully');
      setLoading(false);
    } catch (error) {
      console.error('Password change error:', error);
      setError('Failed to change password. Please check your current password.');
      setLoading(false);
    }
  };
  
  // Handle close notifications
  const handleCloseNotification = () => {
    setError(null);
    setSuccessMessage(null);
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page header */}
      <Typography variant="h4" component="h1" gutterBottom>
        User Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left side - Avatar and basic info */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={avatarPreview || user?.avatarUrl}
                alt={user?.name || 'User'}
                sx={{
                  width: 120,
                  height: 120,
                  mb: 2,
                  position: 'relative'
                }}
              />
              
              {uploadProgress > 0 && (
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={uploadProgress}
                    size={120}
                    thickness={4}
                    sx={{
                      position: 'absolute',
                      top: '-120px',
                      left: 0,
                    }}
                  />
                </Box>
              )}
              
              <Typography variant="h6" gutterBottom>
                {user?.name}
              </Typography>
              
              <Typography variant="body2" color="textSecondary">
                {user?.role}
              </Typography>
              
              <Box sx={{ mt: 2, width: '100%' }}>
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarChange}
                />
                <label htmlFor="avatar-upload">
                  <Button
                    component="span"
                    variant="outlined"
                    fullWidth
                    sx={{ mb: 1 }}
                  >
                    Change Avatar
                  </Button>
                </label>
                
                {avatarFile && (
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleAvatarUpload}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : 'Upload Avatar'}
                  </Button>
                )}
              </Box>
            </Box>
            
            <Box sx={{ mt: 3 }}>
              <Divider sx={{ my: 2 }} />
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="Email"
                    secondary={user?.email}
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Role"
                    secondary={user?.role}
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText
                    primary="Last Login"
                    secondary={formatDate(user?.lastLogin)}
                    primaryTypographyProps={{ variant: 'body2', color: 'textSecondary' }}
                    secondaryTypographyProps={{ variant: 'body1' }}
                  />
                </ListItem>
              </List>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right side - Tabs with profile details */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
              <Tabs value={activeTab} onChange={handleTabChange} aria-label="profile tabs">
                <Tab icon={<Person />} label="Profile" />
                <Tab icon={<Security />} label="Security" />
                <Tab icon={<History />} label="Activity" />
              </Tabs>
            </Box>
            
            {/* Profile Tab */}
            {activeTab === 0 && (
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button
                    startIcon={editMode ? <Cancel /> : <Edit />}
                    onClick={handleEditToggle}
                    color={editMode ? 'inherit' : 'primary'}
                    sx={{ mr: 1 }}
                  >
                    {editMode ? 'Cancel' : 'Edit Profile'}
                  </Button>
                  
                  {editMode && (
                    <Button
                      startIcon={<Save />}
                      variant="contained"
                      color="primary"
                      onClick={handleProfileUpdate}
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save'}
                    </Button>
                  )}
                </Box>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Full Name"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccountCircle />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Phone"
                      name="phone"
                      value={profileData.phone}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Job Title"
                      name="title"
                      value={profileData.title}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Badge />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Department"
                      name="department"
                      value={profileData.department}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleProfileChange}
                      disabled={!editMode || loading}
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}
            
            {/* Security Tab */}
            {activeTab === 1 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Change Password
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type={showPasswords.currentPassword ? 'text' : 'password'}
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <VpnKey />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('currentPassword')}
                              edge="end"
                            >
                              {showPasswords.currentPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type={showPasswords.newPassword ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('newPassword')}
                              edge="end"
                            >
                              {showPasswords.newPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Confirm Password"
                      name="confirmPassword"
                      type={showPasswords.confirmPassword ? 'text' : 'password'}
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => handleTogglePasswordVisibility('confirmPassword')}
                              edge="end"
                            >
                              {showPasswords.confirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handlePasswordUpdate}
                        disabled={loading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                      >
                        {loading ? <CircularProgress size={24} /> : 'Change Password'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
                
                <Divider sx={{ my: 4 }} />
                
                <Typography variant="h6" gutterBottom>
                  Two-Factor Authentication
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" paragraph>
                    Two-factor authentication adds an extra layer of security to your account.
                  </Typography>
                  
                  <Button
                    variant="outlined"
                    color="primary"
                  >
                    Enable Two-Factor Authentication
                  </Button>
                </Box>
              </Box>
            )}
            
            {/* Activity Tab */}
            {activeTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Recent Activity
                </Typography>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : activityLogs.length === 0 ? (
                  <Typography align="center" py={4}>
                    No activity logs found
                  </Typography>
                ) : (
                  <List>
                    {activityLogs.map((log, index) => (
                      <React.Fragment key={index}>
                        <ListItem alignItems="flex-start">
                          <ListItemText
                            primary={log.action}
                            secondary={
                              <>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="textPrimary"
                                >
                                  {formatDate(log.timestamp)}
                                </Typography>
                                {` - ${log.details || ''}`}
                              </>
                            }
                          />
                        </ListItem>
                        {index < activityLogs.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success/Error notifications */}
      <Snackbar
        open={!!error || !!successMessage}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={error ? 'error' : 'success'}
          variant="filled"
        >
          {error || successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;