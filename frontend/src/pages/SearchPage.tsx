import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Paper,
  Typography,
  TextField,
  InputAdornment,
  Button,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Tooltip,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList,
  Error as ErrorIcon,
  Security,
  Computer,
  Public,
  Warning,
  ArrowForward,
  MoreVert,
  Refresh,
  Clear,
  Check,
  Info,
  Share,
  GetApp,
  Save,
  History,
  DateRange
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { DataTable } from '../components/common/DataTable';
import { AlertSeverityBadge } from '../components/alerts/AlertSeverityBadge';
import { formatDate, formatRelativeTime } from '../utils/formatters';

// Interface for search filters
interface SearchFilters {
  type: string;
  dateRange: string;
  severity: string[];
  source: string[];
  status: string[];
}

// Interface for search result
interface SearchResult {
  id: string;
  type: 'alert' | 'event' | 'entity' | 'ioc' | 'flow';
  title: string;
  description: string;
  timestamp: string;
  score: number;
  data: any;
}

// Interface for saved search
interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  createdAt: string;
}

// SearchPage component
const SearchPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  // State variables
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<number>(0);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [saveSearchDialogOpen, setSaveSearchDialogOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Default filters
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    dateRange: '7days',
    severity: [],
    source: [],
    status: [],
  });
  
  // Handle search query change
  const handleSearchQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = async (event?: React.FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    
    if (!searchQuery.trim()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Add to recent searches
      if (!recentSearches.includes(searchQuery)) {
        const updatedSearches = [searchQuery, ...recentSearches.slice(0, 9)];
        setRecentSearches(updatedSearches);
        localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
      }
      
      // Call search API
      // This is a mock implementation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate mock results
      const mockResults: SearchResult[] = generateMockResults(searchQuery, filters);
      setSearchResults(mockResults);
    } catch (err: any) {
      console.error('Search error:', err);
      setError('Failed to perform search. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };
  
  // Handle filter change
  const handleFilterChange = (filterName: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem('recentSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
    
    // Load mock saved searches
    setSavedSearches([
      {
        id: '1',
        name: 'Critical Alerts Last 24h',
        query: 'severity:critical',
        filters: {
          type: 'alert',
          dateRange: '24hours',
          severity: ['critical'],
          source: [],
          status: ['open', 'in_progress']
        },
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Suspicious IPs',
        query: 'category:suspicious ip',
        filters: {
          type: 'ioc',
          dateRange: '30days',
          severity: [],
          source: [],
          status: []
        },
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ]);
  }, []);
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setFilters({
      type: 'all',
      dateRange: '7days',
      severity: [],
      source: [],
      status: [],
    });
  };
  
  // Generate URL for current search
  const getSearchUrl = () => {
    const params = new URLSearchParams();
    params.append('q', searchQuery);
    params.append('type', filters.type);
    params.append('dateRange', filters.dateRange);
    if (filters.severity.length) params.append('severity', filters.severity.join(','));
    if (filters.source.length) params.append('source', filters.source.join(','));
    if (filters.status.length) params.append('status', filters.status.join(','));
    
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };
  
  // Save current search
  const saveSearch = (name: string) => {
    const newSavedSearch: SavedSearch = {
      id: Date.now().toString(),
      name,
      query: searchQuery,
      filters,
      createdAt: new Date().toISOString()
    };
    
    const updatedSavedSearches = [newSavedSearch, ...savedSearches];
    setSavedSearches(updatedSavedSearches);
    localStorage.setItem('savedSearches', JSON.stringify(updatedSavedSearches));
    setSaveSearchDialogOpen(false);
  };
  
  // Load saved search
  const loadSavedSearch = (savedSearch: SavedSearch) => {
    setSearchQuery(savedSearch.query);
    setFilters(savedSearch.filters);
    
    // Execute search after state updates
    setTimeout(() => {
      handleSearchSubmit();
    }, 100);
  };
  
  // Get date from date range filter
  const getDateFromRange = (range: string): Date => {
    const now = new Date();
    
    switch (range) {
      case '24hours':
        return subDays(now, 1);
      case '7days':
        return subDays(now, 7);
      case '30days':
        return subDays(now, 30);
      case '90days':
        return subDays(now, 90);
      default:
        return subDays(now, 7);
    }
  };
  
  // Generate mock search results (for demo)
  const generateMockResults = (query: string, filters: SearchFilters): SearchResult[] => {
    const results: SearchResult[] = [];
    const types = filters.type === 'all' 
      ? ['alert', 'event', 'entity', 'ioc', 'flow'] 
      : [filters.type as 'alert' | 'event' | 'entity' | 'ioc' | 'flow'];
    
    const startDate = getDateFromRange(filters.dateRange);
    const endDate = new Date();
    
    // Generate random number of results between 10-20
    const numResults = Math.floor(Math.random() * 10) + 10;
    
    for (let i = 0; i < numResults; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const date = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));
      
      let result: SearchResult;
      
      switch (type) {
        case 'alert':
          const severities = ['critical', 'high', 'medium', 'low'];
          const severity = filters.severity.length > 0 
            ? filters.severity[Math.floor(Math.random() * filters.severity.length)]
            : severities[Math.floor(Math.random() * severities.length)];
          
          const statuses = ['open', 'in_progress', 'resolved', 'closed'];
          const status = filters.status.length > 0 
            ? filters.status[Math.floor(Math.random() * filters.status.length)]
            : statuses[Math.floor(Math.random() * statuses.length)];
          
          result = {
            id: `alert-${i + 1}`,