import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Search as SearchIcon,
  Code as CodeIcon,
  Article as ArticleIcon
} from '@mui/icons-material';

interface JsonViewerProps {
  data: any;
  initialExpandLevel?: number;
  title?: string;
  height?: string | number;
  showToolbar?: boolean;
  showLineNumbers?: boolean;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  initialExpandLevel = 1,
  title,
  height = 'auto',
  showToolbar = true,
  showLineNumbers = true
}) => {
  const theme = useTheme();
  const [expandedLevel, setExpandedLevel] = useState<number>(initialExpandLevel);
  const [search, setSearch] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');
  
  // Convert the data to a formatted JSON string
  const jsonString = JSON.stringify(data, null, 2);
  
  // Function to handle copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Function to handle expand all
  const handleExpandAll = () => {
    setExpandedLevel(Infinity);
  };
  
  // Function to handle collapse all
  const handleCollapseAll = () => {
    setExpandedLevel(1);
  };
  
  // Function to handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };
  
  // Function to handle view mode change
  const handleViewModeChange = (
    event: React.MouseEvent<HTMLElement>,
    newMode: 'tree' | 'raw' | null
  ) => {
    if (newMode !== null) {
      setViewMode(newMode);
    }
  };
  
  // Recursive function to render a JSON object or array as a tree
  const renderTree = (obj: any, path: string = '', level: number = 0): JSX.Element => {
    const isExpanded = level < expandedLevel;
    
    // Check if the current object or its children match the search term
    const matchesSearch = (obj: any, term: string): boolean => {
      if (!term) return false;
      
      const termLower = term.toLowerCase();
      
      if (typeof obj === 'string' && obj.toLowerCase().includes(termLower)) {
        return true;
      }
      
      if (typeof obj === 'number' && obj.toString().includes(term)) {
        return true;
      }
      
      if (typeof obj === 'object' && obj !== null) {
        return Object.values(obj).some(value => matchesSearch(value, term));
      }
      
      return false;
    };
    
    const hasMatch = search ? matchesSearch(obj, search) : false;
    
    // Highlight style for search matches
    const matchStyle = {
      backgroundColor: hasMatch ? theme.palette.action.selected : 'transparent',
      borderRadius: hasMatch ? '4px' : '0',
    };
    
    // Render primitives (string, number, boolean, null)
    if (typeof obj !== 'object' || obj === null) {
      const value = typeof obj === 'string' 
        ? `"${obj}"` 
        : obj === null 
          ? 'null' 
          : String(obj);
      
      const valueColor = typeof obj === 'string' 
        ? theme.palette.success.main
        : obj === null 
          ? theme.palette.text.disabled
          : typeof obj === 'number' 
            ? theme.palette.info.main
            : theme.palette.warning.main;
      
      return (
        <Typography 
          component="span" 
          sx={{ color: valueColor, ...matchStyle }}
          fontFamily="monospace"
        >
          {value}
        </Typography>
      );
    }
    
    // Render objects and arrays
    const isArray = Array.isArray(obj);
    const keys = Object.keys(obj);
    const isEmpty = keys.length === 0;
    
    return (
      <Box sx={{ ml: level > 0 ? 2 : 0, ...matchStyle }}>
        {/* Object/Array opening bracket */}
        <Typography
          component="span"
          variant="body2"
          fontFamily="monospace"
        >
          {isArray ? '[' : '{'}
          {!isEmpty && !isExpanded && '...'}
        </Typography>
        
        {/* Object/Array contents */}
        {!isEmpty && isExpanded && (
          <Box>
            {keys.map((key, index) => {
              const value = obj[key];
              const childPath = path ? `${path}.${key}` : key;
              const isLastItem = index === keys.length - 1;
              
              return (
                <Box key={childPath} sx={{ display: 'flex' }}>
                  {/* Property name */}
                  <Typography
                    component="span"
                    variant="body2"
                    fontFamily="monospace"
                    sx={{ 
                      color: theme.palette.primary.main, 
                      mr: 0.5 
                    }}
                  >
                    {isArray ? '' : `"${key}": `}
                  </Typography>
                  
                  {/* Property value */}
                  {renderTree(value, childPath, level + 1)}
                  
                  {/* Comma for non-last items */}
                  {!isLastItem && (
                    <Typography
                      component="span"
                      variant="body2"
                      fontFamily="monospace"
                    >
                      ,
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
        
        {/* Object/Array closing bracket */}
        <Typography
          component="span"
          variant="body2"
          fontFamily="monospace"
        >
          {isArray ? ']' : '}'}
        </Typography>
      </Box>
    );
  };
  
  // Raw JSON view with syntax highlighting
  const renderRawJson = () => {
    return (
      <pre
        style={{
          margin: 0,
          padding: 8,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '0.875rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {jsonString
          .split('\n')
          .map((line, index) => {
            // Highlight line if it contains the search term
            const highlightLine = search && line.toLowerCase().includes(search.toLowerCase());
            
            return (
              <Box 
                key={index} 
                sx={{ 
                  display: 'flex',
                  backgroundColor: highlightLine ? theme.palette.action.selected : 'transparent',
                  borderRadius: highlightLine ? '4px' : '0',
                }}
              >
                {showLineNumbers && (
                  <Typography
                    component="span"
                    variant="body2"
                    fontFamily="monospace"
                    sx={{
                      color: theme.palette.text.secondary,
                      width: '2em',
                      textAlign: 'right',
                      mr: 2,
                      userSelect: 'none',
                    }}
                  >
                    {index + 1}
                  </Typography>
                )}
                <Typography
                  component="span"
                  variant="body2"
                  fontFamily="monospace"
                  sx={{ flex: 1 }}
                >
                  {line}
                </Typography>
              </Box>
            );
          })}
      </pre>
    );
  };
  
  return (
    <Paper
      variant="outlined"
      sx={{
        height,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {showToolbar && (
        <Box
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${theme.palette.divider}`,
            gap: 1,
          }}
        >
          {title && (
            <Typography variant="subtitle2" sx={{ flex: 1 }}>
              {title}
            </Typography>
          )}
          
          <ToggleButtonGroup
            size="small"
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
          >
            <ToggleButton value="tree">
              <Tooltip title="Tree View">
                <ArticleIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
            <ToggleButton value="raw">
              <Tooltip title="Raw JSON">
                <CodeIcon fontSize="small" />
              </Tooltip>
            </ToggleButton>
          </ToggleButtonGroup>
          
          <Box sx={{ flex: 1 }} />
          
          <TextField
            size="small"
            placeholder="Search..."
            value={search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1 }} />,
            }}
            sx={{ maxWidth: 200 }}
          />
          
          <Tooltip title="Expand All">
            <IconButton size="small" onClick={handleExpandAll}>
              <ExpandMoreIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Collapse All">
            <IconButton size="small" onClick={handleCollapseAll}>
              <ExpandLessIcon />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={copied ? 'Copied!' : 'Copy to Clipboard'}>
            <IconButton size="small" onClick={handleCopy}>
              <CopyIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {viewMode === 'tree' ? renderTree(data) : renderRawJson()}
      </Box>
    </Paper>
  );
};

export default JsonViewer;