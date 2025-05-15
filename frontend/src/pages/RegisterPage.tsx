import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Grid,
  Link,
  CircularProgress,
  Alert,
  IconButton,
  InputAdornment,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAddOutlined,
  ArrowBack
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import logo from '../assets/images/logo.png';

const RegisterPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAuthenticated, register, error: authError, loading: authLoading } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formErrors, setFormErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Handle form input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
  };

  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(prev => !prev);
  };

  // Validate form
  const validateForm = (): boolean => {
    let valid = true;
    const errors = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };

    // Validate name
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
      valid = false;
    }

    // Validate email
    if (!formData.email) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      valid = false;
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      valid = false;
    }

    // Validate confirm password
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
      valid = false;
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      valid = false;
    }

    setFormErrors(errors);
    return valid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
    } catch (err) {
      // Error is handled by the useAuth hook
      console.error('Registration error:', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(45deg, #1a237e 30%, #283593 90%)'
          : 'linear-gradient(45deg, #e3f2fd 30%, #bbdefb 90%)'
      }}
    >
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Grid
          container
          spacing={4}
          justifyContent="center"
          alignItems="center"
          sx={{ minHeight: '80vh' }}
        >
          {/* Left side - Brand info */}
          {!isMobile && (
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <Box
                  component="img"
                  src={logo}
                  alt="NDR Correlation Engine"
                  sx={{ height: 100, mb: 3 }}
                />
                <Typography variant="h3" component="h1" gutterBottom>
                  NDR Korelasyon Motoru
                </Typography>
                <Typography variant="h6" sx={{ mb: 3, maxWidth: '80%' }}>
                  Ağ güvenliğinizi gerçek zamanlı izleyin, analiz edin ve tehditlere hızla müdahale edin.
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Right side - Register form */}
          <Grid item xs={12} md={6}>
            <Paper
              elevation={6}
              sx={{
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                maxWidth: isMobile ? '100%' : 450,
                mx: 'auto',
                borderRadius: 2
              }}
            >
              {isMobile && (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 4
                  }}
                >
                  <Box
                    component="img"
                    src={logo}
                    alt="NDR Correlation Engine"
                    sx={{ height: 60, mb: 2 }}
                  />
                  <Typography variant="h5" component="h1" gutterBottom align="center">
                    NDR Korelasyon Motoru
                  </Typography>
                </Box>
              )}

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  mb: 3
                }}
              >
                <Avatar
                  sx={{
                    m: 1,
                    bgcolor: theme.palette.secondary.main,
                    width: 56,
                    height: 56
                  }}
                >
                  <PersonAddOutlined fontSize="large" />
                </Avatar>
                <Typography component="h1" variant="h5">
                  Hesap Oluştur
                </Typography>
              </Box>

              {authError && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {authError}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  autoComplete="name"
                  autoFocus
                  value={formData.name}
                  onChange={handleChange}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleTogglePasswordVisibility}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="confirmPassword"
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={!!formErrors.confirmPassword}
                  helperText={formErrors.confirmPassword}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle confirm password visibility"
                          onClick={handleToggleConfirmPasswordVisibility}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={authLoading}
                >
                  {authLoading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    'Kayıt Ol'
                  )}
                </Button>
                <Box sx={{ textAlign: 'center' }}>
                  <Link component={RouterLink} to="/login" variant="body2">
                    {"Zaten bir hesabınız var mı? Giriş yapın"}
                  </Link>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Box
        component="footer"
        sx={{
          py: 3,
          mt: 'auto',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} NDR Korelasyon Motoru. Tüm hakları saklıdır.
        </Typography>
      </Box>
    </Box>
  );
};

export default RegisterPage;