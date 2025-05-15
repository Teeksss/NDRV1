import React from 'react';
import {
  Box,
  Container,
  Typography,
  Link,
  Divider,
  Grid,
  IconButton,
  useTheme,
  Stack
} from '@mui/material';
import {
  GitHub,
  LinkedIn,
  Twitter,
  Mail,
  Help,
  Security,
  PrivacyTip
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import logo from '../../assets/images/logo-small.png';

const Footer: React.FC = () => {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: theme.palette.mode === 'light' 
          ? theme.palette.grey[100] 
          : theme.palette.grey[900]
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box display="flex" alignItems="center" mb={2}>
              <Box
                component="img"
                src={logo}
                alt="NDR Korelasyon Motoru"
                sx={{ height: 40, mr: 1 }}
              />
              <Typography variant="h6" color="text.primary">
                NDR Korelasyon Motoru
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Ağ trafiğinizi gerçek zamanlı olarak izleyen, analiz eden ve güvenlik tehditlerini
              tespit eden gelişmiş ağ savunma çözümü.
            </Typography>
            <Stack direction="row" spacing={1}>
              <IconButton size="small" aria-label="github">
                <GitHub fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="linkedin">
                <LinkedIn fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="twitter">
                <Twitter fontSize="small" />
              </IconButton>
              <IconButton size="small" aria-label="mail">
                <Mail fontSize="small" />
              </IconButton>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom>
              Hızlı Erişim
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none', m: 0 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/dashboard" color="inherit" underline="hover">
                  Dashboard
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/alerts" color="inherit" underline="hover">
                  Alarmlar
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/entities" color="inherit" underline="hover">
                  Varlıklar
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/reports" color="inherit" underline="hover">
                  Raporlar
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/settings" color="inherit" underline="hover">
                  Ayarlar
                </Link>
              </Box>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle1" color="text.primary" gutterBottom>
              Destek
            </Typography>
            <Box component="ul" sx={{ pl: 0, listStyle: 'none', m: 0 }}>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Help fontSize="small" sx={{ mr: 1 }} />
                  Yardım Merkezi
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                  <PrivacyTip fontSize="small" sx={{ mr: 1 }} />
                  Gizlilik Politikası
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link href="#" color="inherit" underline="hover" sx={{ display: 'flex', alignItems: 'center' }}>
                  <Security fontSize="small" sx={{ mr: 1 }} />
                  Güvenlik
                </Link>
              </Box>
              <Box component="li" sx={{ mb: 1 }}>
                <Link component={RouterLink} to="/contact" color="inherit" underline="hover">
                  İletişim
                </Link>
              </Box>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3 }} />
        
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
          <Typography variant="body2" color="text.secondary">
            &copy; {currentYear} NDR Korelasyon Motoru. Tüm Hakları Saklıdır.
          </Typography>
          
          <Box>
            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Koşullar
              </Typography>
            </Link>
            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Gizlilik
              </Typography>
            </Link>
            <Link href="#" color="inherit" underline="hover" sx={{ mx: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Çerezler
              </Typography>
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;