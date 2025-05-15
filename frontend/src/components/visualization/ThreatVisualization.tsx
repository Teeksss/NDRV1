import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Button,
  useTheme
} from '@mui/material';
import {
  Refresh,
  FilterList,
  Public,
  Warning,
  MoreVert,
  GetApp
} from '@mui/icons-material';
import * as d3 from 'd3';
import { geoPath, geoMercator, geoEquirectangular } from 'd3-geo';
import { feature } from 'topojson-client';
import { AlertService } from '../../services/AlertService';
import { NetworkService } from '../../services/NetworkService';
import worldMapData from '../../assets/data/world-110m.json';

interface ThreatVisualizationProps {
  height?: number;
  showWorldMap?: boolean;
  showTimeline?: boolean;
  showThreatTypes?: boolean;
}

export const ThreatVisualization: React.FC<ThreatVisualizationProps> = ({
  height = 500,
  showWorldMap = true,
  showTimeline = true,
  showThreatTypes = true
}) => {
  const theme = useTheme();
  const mapRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [threatData, setThreatData] = useState<any | null>(null);
  const [geoData, setGeoData] = useState<any | null>(null);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [threatTypes, setThreatTypes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  
  // Load threat data when component mounts or timeRange changes
  useEffect(() => {
    loadThreatData();
  }, [timeRange]);
  
  // Initialize map when data is loaded
  useEffect(() => {
    if (showWorldMap && threatData && mapRef.current) {
      initializeMap();
    }
  }, [threatData, mapRef.current, theme.palette.mode]);
  
  // Load threat data from API
  const loadThreatData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get threat data
      const alertService = new AlertService();
      const networkService = new NetworkService();
      
      // Get alerts by geo location
      const geoAlerts = await alertService.getAlertsByGeoLocation({
        timeRange
      });
      
      // Get geo traffic data
      const geoTraffic = await networkService.getGeoDistribution(undefined, undefined);
      
      // Combine data
      const combinedData = {
        alerts: geoAlerts,
        traffic: geoTraffic,
        timeRange
      };
      
      setThreatData(combinedData);
      
      // Extract unique threat types
      const types = [...new Set(geoAlerts.map(alert => alert.type))];
      setThreatTypes(types);
      
      // Initialize selected types to all types
      if (selectedTypes.length === 0) {
        setSelectedTypes(types);
      }
      
      // Process world map data
      if (showWorldMap) {
        const world = feature(worldMapData as any, (worldMapData as any).objects.countries);
        setGeoData(world);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading threat data:', error);
      setError('Failed to load threat data. Please try again.');
      setLoading(false);
    }
  };
  
  // Initialize map visualization
  const initializeMap = () => {
    if (!mapRef.current || !threatData || !geoData) return;
    
    // Clear previous visualization
    d3.select(mapRef.current).selectAll('*').remove();
    
    // Get container dimensions
    const width = mapRef.current.clientWidth;
    const containerHeight = height;
    
    // Set up SVG
    const svg = d3.select(mapRef.current)
      .attr('width', width)
      .attr('height', containerHeight);
    
    // Create projection
    const projection = geoEquirectangular()
      .fitSize([width, containerHeight], geoData)
      .precision(0.1);
    
    // Create path generator
    const pathGenerator = geoPath().projection(projection);
    
    // Draw map
    const countries = svg.append('g')
      .selectAll('path')
      .data(geoData.features)
      .enter()
      .append('path')
      .attr('d', pathGenerator)
      .attr('fill', theme.palette.mode === 'dark' ? '#2a2a2a' : '#e0e0e0')
      .attr('stroke', theme.palette.mode === 'dark' ? '#444444' : '#cccccc')
      .attr('stroke-width', 0.5);
    
    // Filter threats by selected types
    const filteredThreats = threatData.alerts.filter(alert => 
      selectedTypes.includes(alert.type)
    );
    
    // Create color scale for threat severity
    const severityColorScale = d3.scaleOrdinal()
      .domain(['critical', 'high', 'medium', 'low', 'info'])
      .range([
        theme.palette.error.main,
        theme.palette.error.light,
        theme.palette.warning.main,
        theme.palette.warning.light,
        theme.palette.info.main
      ]);
    
    // Add threats as points
    svg.selectAll('circle')
      .data(filteredThreats)
      .enter()
      .append('circle')
      .attr('cx', d => {
        const coords = projection([d.location.longitude, d.location.latitude]);
        return coords ? coords[0] : 0;
      })
      .attr('cy', d => {
        const coords = projection([d.location.longitude, d.location.latitude]);
        return coords ? coords[1] : 0;
      })
      .attr('r', d => d.count ? Math.sqrt(d.count) * 3 : 5)
      .attr('fill', d => severityColorScale(d.severity))
      .attr('fill-opacity', 0.7)
      .attr('stroke', theme.palette.background.paper)
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        // Show tooltip
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('fill-opacity', 1);
        
        const tooltip = d3.select(tooltipRef.current);
        tooltip.style('visibility', 'visible')
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`)
          .html(`
            <strong>${d.country}</strong><br/>
            Type: ${d.type}<br/>
            Severity: ${d.severity}<br/>
            Count: ${d.count}<br/>
          `);
      })
      .on('mouseout', function() {
        // Hide tooltip
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('fill-opacity', 0.7);
        
        d3.select(tooltipRef.current)
          .style('visibility', 'hidden');
      });
    
    // Add traffic flow lines if available
    if (threatData.traffic && threatData.traffic.flows) {
      svg.selectAll('line')
        .data(threatData.traffic.flows)
        .enter()
        .append('line')
        .attr('x1', d => {
          const coords = projection([d.sourceLocation.coordinates[0], d.sourceLocation.coordinates[1]]);
          return coords ? coords[0] : 0;
        })
        .attr('y1', d => {
          const coords = projection([d.sourceLocation.coordinates[0], d.sourceLocation.coordinates[1]]);
          return coords ? coords[1] : 0;
        })
        .attr('x2', d => {
          const coords = projection([d.destinationLocation.coordinates[0], d.destinationLocation.coordinates[1]]);
          return coords ? coords[0] : 0;
        })
        .attr('y2', d => {
          const coords = projection([d.destinationLocation.coordinates[0], d.destinationLocation.coordinates[1]]);
          return coords ? coords[1] : 0;
        })
        .attr('stroke', d => d.isMalicious ? theme.palette.error.main : theme.palette.primary.main)
        .attr('stroke-width', d => Math.min(Math.log(d.bytes / 1024) || 1, 3))
        .attr('stroke-opacity', 0.6)
        .attr('stroke-dasharray', d => d.isSuspicious ? '5,5' : 'none');
    }
  };
  
  // Handle refresh
  const handleRefresh = () => {
    loadThreatData();
  };
  
  // Handle time range change
  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  // Handle threat type selection
  const handleTypeSelect = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };
  
  // Handle select all threat types
  const handleSelectAllTypes = () => {
    setSelectedTypes([...threatTypes]);
    handleFilterMenuClose();
  };
  
  // Handle clear all threat types
  const handleClearAllTypes = () => {
    setSelectedTypes([]);
    handleFilterMenuClose();
  };
  
  // Export map as PNG
  const handleExportMap = () => {
    if (!mapRef.current) return;
    
    // Create a new canvas
    const canvas = document.createElement('canvas');
    canvas.width = mapRef.current.clientWidth;
    canvas.height = mapRef.current.clientHeight;
    
    // Draw the SVG to the canvas
    const context = canvas.getContext('2d');
    if (!context) return;
    
    const svgString = new XMLSerializer().serializeToString(mapRef.current);
    const img = new Image();
    img.onload = () => {
      context.drawImage(img, 0, 0);
      
      // Download the canvas as PNG
      const a = document.createElement('a');
      a.download = `threat-map-${new Date().toISOString().substring(0, 10)}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgString)));
  };
  
  return (
    <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Global Threat Visualization</Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          {/* Time range selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              label="Time Range"
              onChange={handleTimeRangeChange}
            >
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
              <MenuItem value="90d">Last 90 Days</MenuItem>
            </Select>
          </FormControl>
          
          {/* Filter button */}
          <IconButton onClick={handleFilterMenuOpen}>
            <FilterList />
          </IconButton>
          
          {/* Export button */}
          <IconButton onClick={handleExportMap}>
            <GetApp />
          </IconButton>
          
          {/* Refresh button */}
          <IconButton onClick={handleRefresh}>
            <Refresh />
          </IconButton>
        </Box>
      </Box>
      
      {/* Filter menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={handleFilterMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSelectAllTypes}>Select All</MenuItem>
        <MenuItem onClick={handleClearAllTypes}>Clear All</MenuItem>
        <Box sx={{ borderTop: `1px solid ${theme.palette.divider}`, my: 1 }} />
        {threatTypes.map(type => (
          <MenuItem key={type} onClick={() => handleTypeSelect(type)}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              width: '100%',
              opacity: selectedTypes.includes(type) ? 1 : 0.5
            }}>
              <Box 
                component="span" 
                sx={{ 
                  width: 16, 
                  height: 16, 
                  borderRadius: '50%', 
                  mr: 1,
                  border: selectedTypes.includes(type) ? `2px solid ${theme.palette.primary.main}` : 'none',
                  bgcolor: selectedTypes.includes(type) ? theme.palette.primary.main : 'transparent'
                }} 
              />
              {type}
            </Box>
          </MenuItem>
        ))}
      </Menu>
      
      {/* Selected threat types */}
      {showThreatTypes && selectedTypes.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {selectedTypes.map(type => (
            <Chip 
              key={type} 
              label={type} 
              size="small" 
              onDelete={() => handleTypeSelect(type)} 
            />
          ))}
        </Box>
      )}
      
      {/* Map container */}
      <Box sx={{ 
        position: 'relative', 
        flexGrow: 1, 
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%' 
          }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center',
            height: '100%' 
          }}>
            <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>
            <Button variant="contained" onClick={handleRefresh}>Retry</Button>
          </Box>
        ) : (
          <Box sx={{ flexGrow: 1 }}>
            <svg ref={mapRef} width="100%" height="100%" />
            <div 
              ref={tooltipRef} 
              style={{
                position: 'absolute',
                visibility: 'hidden',
                backgroundColor: theme.palette.background.paper,
                color: theme.palette.text.primary,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '4px',
                padding: '8px',
                fontSize: '12px',
                pointerEvents: 'none',
                zIndex: 1000,
                boxShadow: theme.shadows[3]
              }} 
            />
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ThreatVisualization;