import React, { createContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme, Theme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { trTR, enUS } from '@mui/material/locale';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleMode: () => void;
  theme: Theme;
}

export const ThemeContext = createContext<ThemeContextType>({
  mode: 'light',
  toggleMode: () => {},
  theme: createTheme(),
});

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Load theme preference from localStorage
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem('themeMode');
    return (savedMode as ThemeMode) || 'light';
  });

  // Create theme based on mode
  const theme = useMemo(() => {
    return createTheme({
      palette: {
        mode,
        primary: {
          main: mode === 'dark' ? '#3f88ec' : '#1976d2',
          light: mode === 'dark' ? '#6fa8ff' : '#42a5f5',
          dark: mode === 'dark' ? '#0d47a1' : '#1565c0',
        },
        secondary: {
          main: mode === 'dark' ? '#f48fb1' : '#e91e63',
          light: mode === 'dark' ? '#f6a5c0' : '#f48fb1',
          dark: mode === 'dark' ? '#bf5f82' : '#c2185b',
        },
        background: {
          default: mode === 'dark' ? '#121212' : '#f5f5f5',
          paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
        },
        error: {
          main: mode === 'dark' ? '#f44336' : '#d32f2f',
        },
        warning: {
          main: mode === 'dark' ? '#ff9800' : '#ed6c02',
        },
        info: {
          main: mode === 'dark' ? '#29b6f6' : '#0288d1',
        },
        success: {
          main: mode === 'dark' ? '#66bb6a' : '#2e7d32',
        },
        text: {
          primary: mode === 'dark' ? '#e0e0e0' : 'rgba(0, 0, 0, 0.87)',
          secondary: mode === 'dark' ? '#a0a0a0' : 'rgba(0, 0, 0, 0.6)',
        },
      },
      typography: {
        fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
          fontSize: '2.5rem',
          fontWeight: 500,
        },
        h2: {
          fontSize: '2rem',
          fontWeight: 500,
        },
        h3: {
          fontSize: '1.75rem',
          fontWeight: 500,
        },
        h4: {
          fontSize: '1.5rem',
          fontWeight: 500,
        },
        h5: {
          fontSize: '1.25rem',
          fontWeight: 500,
        },
        h6: {
          fontSize: '1rem',
          fontWeight: 500,
        },
      },
      shape: {
        borderRadius: 8,
      },
      components: {
        MuiAppBar: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: {
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
              color: mode === 'dark' ? '#e0e0e0' : 'rgba(0, 0, 0, 0.87)',
              borderBottom: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiDrawer: {
          styleOverrides: {
            paper: {
              backgroundColor: mode === 'dark' ? '#1e1e1e' : '#ffffff',
              borderRight: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiCard: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: {
              boxShadow: mode === 'dark' 
                ? '0 2px 4px rgba(0,0,0,0.2)' 
                : '0 2px 4px rgba(0,0,0,0.05)',
              border: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiPaper: {
          defaultProps: {
            elevation: 0,
          },
          styleOverrides: {
            root: {
              boxShadow: mode === 'dark' 
                ? '0 2px 4px rgba(0,0,0,0.2)' 
                : '0 2px 4px rgba(0,0,0,0.05)',
              border: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            root: {
              textTransform: 'none',
              fontWeight: 500,
            },
          },
        },
        MuiTableCell: {
          styleOverrides: {
            root: {
              borderBottom: `1px solid ${mode === 'dark' ? '#333333' : '#e0e0e0'}`,
            },
          },
        },
        MuiTabs: {
          styleOverrides: {
            indicator: {
              height: 3,
            },
          },
        },
      },
    }, trTR); // Use Turkish localization
  }, [mode]);

  // Toggle theme mode
  const toggleMode = () => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return newMode;
    });
  };

  // Update document body background color
  useEffect(() => {
    document.body.style.backgroundColor = theme.palette.background.default;
  }, [theme]);

  const contextValue = useMemo(() => {
    return { mode, toggleMode, theme };
  }, [mode, theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook to use theme context
export const useThemeContext = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;