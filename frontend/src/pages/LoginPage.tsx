import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  InputAdornment,
  IconButton,
  CircularProgress,
  Link,
  Divider,
  Alert,
  Grid,
  FormControlLabel,
  Checkbox,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email,
  Lock,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Security,
  AccountCircle
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useThemeContext } from '../context/ThemeContext';
import logo from '../assets/images/logo.png';

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, login, error: authError, clearError } = useAuth();
  const { mode, toggleMode } = useThemeContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extract redirect path from location state
  const from = location.state?.from?.pathname || '/dashboard';
  
  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);
  
  // Clear auth errors when component mounts or unmounts
  useEffect(() => {
    clearError();
    
    return () => {
      clearError();
    };
  }, [clearError]);
  
  // Handle login form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!email) {
      setError('Email is required');
      return;
    }
    
    if (!password) {
      setError('Password is required');
      return;
    }
    
    // Clear previous errors
    setError(null);
    clearError();
    
    try {
      setLoading(true);
      await login(email, password);
      
      // Store in localStorage if remember me is checked
      if (rememberMe) {
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('savedEmail');
      }
      
      // Redirect after successful login
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };
  
  // Load saved email if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('savedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);
  
  // Handle password visibility toggle
  const handlePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Container maxWidth="lg" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Grid container spacing={0} sx={{ height: isMobile ? 'auto' : '80vh' }}>
        {/* Left side - Branding */}
        {!isMobile && (
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                height: '100%',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                borderTopLeftRadius: theme.shape.borderRadius,
                borderBottomLeftRadius: theme.shape.borderRadius,
                backgroundImage: 'url(/background.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  backgroundColor: 'rgba(25, 118, 210, 0.85)',
                  zIndex: 1,
                  borderTopLeftRadius: theme.shape.borderRadius,
                  borderBottomLeftRadius: theme.shape.borderRadius,
                }
              }}
            >
              <Box sx={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                <img src={logo} alt="NDR Korelasyon Motoru" style={{ width: 180, marginBottom: 24 }} />
                
                <Typography variant="h3" component="h1" gutterBottom fontWeight="bold">
                  NDR Korelasyon Motoru
                </Typography>
                
                <Typography variant="h6" gutterBottom>
                  Gelişmiş Ağ Tehdit Tespit ve Yanıt Sistemi
                </Typography>
                
                <Typography variant="body1" sx={{ mt: 2, mb: 4, maxWidth: 400, mx: 'auto' }}>
                  Ağ trafiğinizdeki tehditleri tespit edin, analiz edin ve hızlı yanıt verin.
                  Gelişmiş korelasyon ve yapay zeka algoritmaları ile güvenliğinizi güçlendirin.
                </Typography>
                
                <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <Security sx={{ fontSize: 40 }} />
                  <AccountCircle sx={{ fontSize: 40 }} />
                  <LoginIcon sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </Box>
          </Grid>
        )}
        
        {/* Right side - Login Form */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={isMobile ? 2 : 0}
            sx={{
              height: '100%',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              borderTopRightRadius: theme.shape.borderRadius,
              borderBottomRightRadius: theme.shape.borderRadius,
              ...(isMobile ? {
                borderRadius: theme.shape.borderRadius,
                my: 4
              } : {})
            }}
          >
            {isMobile && (
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <img src={logo} alt="NDR Korelasyon Motoru" style={{ width: 120 }} />
              </Box>
            )}
            
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" textAlign="center">
              {isMobile ? 'NDR Korelasyon Motoru' : 'Hoş Geldiniz'}
            </Typography>
            
            <Typography variant="body1" color="textSecondary" textAlign="center" paragraph>
              Hesabınıza giriş yapın
            </Typography>
            
            {(error || authError) && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error || authError}
              </Alert>
            )}
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="E-posta Adresi"
                variant="outlined"
                margin="normal"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="Şifre"
                variant="outlined"
                margin="normal"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={handlePasswordVisibility}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Beni Hatırla"
                />
                
                <Link component={RouterLink} to="/forgot-password" underline="hover">
                  Şifremi Unuttum
                </Link>
              </Box>
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ mt: 2, py: 1.5 }}
                startIcon={loading ? <CircularProgress size={24} color="inherit" /> : <LoginIcon />}
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </Button>
              
              <Divider sx={{ my: 4 }}>
                <Typography variant="body2" color="textSecondary">
                  veya
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" display="inline" mr={1}>
                  Hesabınız yok mu?
                </Typography>
                <Link component={RouterLink} to="/register" underline="hover">
                  Kaydolun
                </Link>
              </Box>
            </Box>
            
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="outlined"
                color="inherit"
                onClick={toggleMode}
                size="small"
              >
                {mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default LoginPage;