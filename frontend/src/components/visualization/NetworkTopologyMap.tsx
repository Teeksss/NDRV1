import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  Slider,
  FormControl,
  InputLabel,
  Select,
  ButtonGroup,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Refresh,
  ZoomIn,
  ZoomOut,
  FilterList,
  GetApp,
  Fullscreen,
  FullscreenExit,
  Settings,
  Search,
  NetworkCheck,
  Computer,
  Router,
  Storage,
  Devices,
  Security
} from '@mui/icons-material';
import * as d3 from 'd3';
import { NetworkService } from '../../services/NetworkService';
import { EntityService } from '../../services/EntityService';
import { useNavigate } from 'react-router-dom';

interface NetworkTopologyMapProps {
  height?: number;
  refreshInterval?: number; // in seconds, 0 for no refresh
  initialFilters?: any;
}

export const NetworkTopologyMap: React.FC<NetworkTopologyMapProps> = ({
  height = 500,
  refreshInterval = 0,
  initialFilters
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [topology, setTopology] = useState<any | null>(null);
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1);
  const [filters, setFilters] = useState(initialFilters || {
    entityTypes: [],
    status: [],
    search: ''
  });
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [highlightedNode, setHighlightedNode] = useState<string | null>(null);
  const [detailNode, setDetailNode] = useState<any | null>(null);
  
  // D3 visualization references
  const simulation = useRef<any>(null);
  const zoomBehavior = useRef<any>(null);
  
  // Load topology data
  useEffect(() => {
    loadTopologyData();
    
    // Set up refresh interval if specified
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => {
        loadTopologyData();
      }, refreshInterval * 1000);
      
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval]);
  
  // Initialize visualization when data is loaded
  useEffect(() => {
    if (topology && svgRef.current) {
      initializeVisualization();
    }
  }, [topology, svgRef.current, theme.palette.mode]);
  
  // Apply filters when they change
  useEffect(() => {
    if (topology && svgRef.current) {
      applyFilters();
    }
  }, [filters]);
  
  // Load topology data from API
  const loadTopologyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const networkService = new NetworkService();
      const topologyData = await networkService.getTopology();
      
      setTopology(topologyData);
      setLoading(false);
    } catch (error) {
      console.error('Error loading topology data:', error);
      setError('Failed to load network topology data. Please try again.');
      setLoading(false);
    }
  };
  
  // Initialize visualization
  const initializeVisualization = () => {
    if (!svgRef.current || !topology) return;
    
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    
    const width = svgRef.current.clientWidth;
    const graphHeight = height;
    
    // Create container for the graph
    const g = svg.append('g');
    
    // Set up zoom behavior
    zoomBehavior.current = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
        setZoom(event.transform.k);
      });
    
    svg.call(zoomBehavior.current);
    
    // Create links
    const links = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(topology.links)
      .enter()
      .append('line')
      .attr('stroke', theme.palette.mode === 'dark' ? '#555' : '#999')
      .attr('stroke-width', d => Math.sqrt(d.value || 1));
    
    // Create nodes
    const nodes = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(topology.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .on('click', (event, d) => handleNodeClick(d))
      .on('mouseover', (event, d) => handleNodeHover(d))
      .on('mouseout', () => handleNodeLeave())
      .call(d3.drag()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded));
    
    // Add circles to nodes
    nodes.append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', theme.palette.mode === 'dark' ? '#fff' : '#000')
      .attr('stroke-width', 1.5);
    
    // Add icons to nodes
    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.3em')
      .attr('fill', theme.palette.mode === 'dark' ? '#000' : '#fff')
      .text(d => getNodeIcon(d));
    
    // Add labels to nodes
    nodes.append('text')
      .attr('dy', d => getNodeSize(d) + 12)
      .attr('text-anchor', 'middle')
      .attr('fill', theme.palette.mode === 'dark' ? '#fff' : '#000')
      .style('font-size', '10px')
      .text(d => d.name);
    
    // Set up force simulation
    simulation.current = d3.forceSimulation()
      .nodes(topology.nodes)
      .force('link', d3.forceLink(topology.links).id(d => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, graphHeight / 2))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(graphHeight / 2).strength(0.1))
      .on('tick', () => {
        links
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        
        nodes.attr('transform', d => `translate(${d.x},${d.y})`);
      });
    
    // Apply initial filters
    applyFilters();
    
    // Drag functions
    function dragStarted(event, d) {
      if (!event.active) simulation.current.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }
    
    function dragged(event, d) {
      d.fx = event.x;
      d.fy = event.y;
    }
    
    function dragEnded(event, d) {
      if (!event.active) simulation.current.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }
  };
  
  // Apply filters to the visualization
  const applyFilters = () => {
    if (!svgRef.current || !topology) return;
    
    const svg = d3.select(svgRef.current);
    
    // Apply entity type filter
    svg.selectAll('.node')
      .style('opacity', d => {
        // If no entity types filter, show all
        if (filters.entityTypes.length === 0) return 1;
        
        // Otherwise, show only the selected types
        return filters.entityTypes.includes(d.type) ? 1 : 0.2;
      });
    
    // Apply status filter
    svg.selectAll('.node')
      .style('opacity', d => {
        // If already filtered out by entity type, keep it filtered
        const entityTypeOpacity = filters.entityTypes.length === 0 || 
                                 filters.entityTypes.includes(d.type) ? 1 : 0.2;
        
        // If no status filter, return the entity type opacity
        if (filters.status.length === 0) return entityTypeOpacity;
        
        // If status filter doesn't include this node's status, reduce opacity
        const statusOpacity = filters.status.includes(d.status) ? 1 : 0.2;
        
        // Return the minimum opacity (most restrictive)
        return Math.min(entityTypeOpacity, statusOpacity);
      });
    
    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      
      svg.selectAll('.node')
        .style('opacity', d => {
          // Get current opacity from other filters
          const currentOpacity = parseFloat(d3.select(this).style('opacity'));
          
          // If already filtered out, keep it filtered
          if (currentOpacity < 1) return currentOpacity;
          
          // Check if name or IP matches search
          const nameMatch = d.name.toLowerCase().includes(searchLower);
          const ipMatch = d.ip && d.ip.toLowerCase().includes(searchLower);
          
          return nameMatch || ipMatch ? 1 : 0.2;
        });
    }
    
    // Adjust link opacity based on connected nodes
    svg.selectAll('line')
      .style('opacity', d => {
        const sourceOpacity = parseFloat(svg.select(`.node[data-id="${d.source.id}"]`).style('opacity'));
        const targetOpacity = parseFloat(svg.select(`.node[data-id="${d.target.id}"]`).style('opacity'));
        
        // If both nodes are visible, show the link
        return (sourceOpacity === 1 && targetOpacity === 1) ? 1 : 0.1;
      });
    
    // If there's a highlighted node, highlight its connections
    if (highlightedNode) {
      highlightConnections(highlightedNode);
    }
  };
  
  // Highlight node and its connections
  const highlightConnections = (nodeId: string) => {
    if (!svgRef.current || !topology) return;
    
    const svg = d3.select(svgRef.current);
    
    // Reset all nodes and links to filtered state
    applyFilters();
    
    // Highlight the selected node
    svg.selectAll('.node')
      .style('opacity', d => d.id === nodeId ? 1 : 0.2);
    
    // Highlight connected nodes
    const connectedLinks = topology.links.filter(
      link => link.source.id === nodeId || link.target.id === nodeId
    );
    
    const connectedNodeIds = new Set();
    connectedLinks.forEach(link => {
      connectedNodeIds.add(link.source.id);
      connectedNodeIds.add(link.target.id);
    });
    
    svg.selectAll('.node')
      .style('opacity', d => connectedNodeIds.has(d.id) ? 1 : 0.2);
    
    // Highlight links
    svg.selectAll('line')
      .style('opacity', d => 
        (d.source.id === nodeId || d.target.id === nodeId) ? 1 : 0.1
      )
      .style('stroke-width', d => 
        (d.source.id === nodeId || d.target.id === nodeId) ? Math.sqrt(d.value || 1) * 2 : Math.sqrt(d.value || 1)
      );
  };
  
  // Get node size based on importance
  const getNodeSize = (node: any): number => {
    switch (node.type) {
      case 'server':
        return 12;
      case 'router':
      case 'firewall':
        return 10;
      case 'switch':
        return 8;
      default:
        return 6;
    }
  };
  
  // Get node color based on type and status
  const getNodeColor = (node: any): string => {
    // First check status
    if (node.status === 'down') {
      return theme.palette.error.main;
    }
    
    if (node.status === 'warning') {
      return theme.palette.warning.main;
    }
    
    // Then check type
    switch (node.type) {
      case 'server':
        return theme.palette.primary.main;
      case 'router':
        return theme.palette.secondary.main;
      case 'switch':
        return theme.palette.info.main;
      case 'firewall':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };
  
  // Get node icon based on type
  const getNodeIcon = (node: any): string => {
    switch (node.type) {
      case 'server':
        return 'S';
      case 'router':
        return 'R';
      case 'switch':
        return 'SW';
      case 'firewall':
        return 'F';
      case 'endpoint':
        return 'E';
      default:
        return 'N';
    }
  };
  
  // Handle node click
  const handleNodeClick = async (node: any) => {
    try {
      const entityService = new EntityService();
      const entityDetails = await entityService.getEntityById(node.id);
      
      setDetailNode(entityDetails);
      
      // Navigate to entity detail page
      navigate(`/entities/${node.id}`);
    } catch (error) {
      console.error('Error fetching entity details:', error);
      setError('Failed to load entity details.');
    }
  };
  
  // Handle node hover
  const handleNodeHover = (node: any) => {
    setHighlightedNode(node.id);
    highlightConnections(node.id);
  };
  
  // Handle node leave
  const handleNodeLeave = () => {
    setHighlightedNode(null);
    applyFilters();
  };
  
  // Handle zoom in
  const handleZoomIn = () => {
    if (zoomBehavior.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(300), 1.3);
    }
  };
  
  // Handle zoom out
  const handleZoomOut = () => {
    if (zoomBehavior.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      zoomBehavior.current.scaleBy(svg.transition().duration(300), 0.7);
    }
  };
  
  // Handle zoom reset
  const handleZoomReset = () => {
    if (zoomBehavior.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg.transition().duration(300).call(
        zoomBehavior.current.transform,
        d3.zoomIdentity
      );
    }
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  // Handle filter change
  const handleFilterChange = (filter: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [filter]: value
    }));
  };
  
  // Handle entity type filter toggle
  const handleEntityTypeToggle = (type: string) => {
    const currentTypes = [...filters.entityTypes];
    const index = currentTypes.indexOf(type);
    
    if (index === -1) {
      // Add type
      currentTypes.push(type);
    } else {
      // Remove type
      currentTypes.splice(index, 1);
    }
    
    handleFilterChange('entityTypes', currentTypes);
  };
  
  // Handle status filter toggle
  const handleStatusToggle = (status: string) => {
    const currentStatus = [...filters.status];
    const index = currentStatus.indexOf(status);
    
    if (index === -1) {
      // Add status
      currentStatus.push(status);
    } else {
      // Remove status
      currentStatus.splice(index, 1);
    }
    
    handleFilterChange('status', currentStatus);
  };
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilterChange('search', event.target.value);
  };
  
  // Handle search clear
  const handleSearchClear = () => {
    handleFilterChange('search', '');
  };
  
  // Handle export as PNG
  const handleExportPng = () => {
    if (!svgRef.current) return;
    
    try {
      // Get SVG data
      const svgData = new XMLSerializer().serializeToString(svgRef.current);
      
      // Create a canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Create an image to draw the SVG to the canvas
      const img = new Image();
      img.onload = () => {
        canvas.width = svgRef.current!.clientWidth;
        canvas.height = height;
        ctx!.drawImage(img, 0, 0);
        
        // Convert canvas to PNG and download
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = 'network-topology.png';
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      };
      
      // Load SVG data
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    } catch (error) {
      console.error('Error exporting PNG:', error);
      setError('Failed to export image.');
    }
  };
  
  // Handle fullscreen toggle
  const handleFullscreenToggle = () => {
    if (!fullscreen) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setFullscreen(!fullscreen);
  };
  
  // Get entity type icon component
  const getEntityTypeIcon = (type: string) => {
    switch (type) {
      case 'server':
        return <Storage fontSize="small" />;
      case 'router':
        return <Router fontSize="small" />;
      case 'switch':
        return <NetworkCheck fontSize="small" />;
      case 'firewall':
        return <Security fontSize="small" />;
      case 'endpoint':
        return <Computer fontSize="small" />;
      default:
        return <Devices fontSize="small" />;
    }
  };
  
  return (
    <Box
      ref={containerRef} 
      sx={{
        width: '100%',
        height: fullscreen ? '100vh' : height,
        position: 'relative',
        bgcolor: theme.palette.background.default
      }}
    >
      {/* Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          left: 10,
          zIndex: 10,
          display: 'flex',
          gap: 1
        }}
      >
        <Paper sx={{ p: 0.5 }}>
          <ButtonGroup size="small">
            <Tooltip title="Zoom In">
              <IconButton onClick={handleZoomIn}>
                <ZoomIn fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Zoom Out">
              <IconButton onClick={handleZoomOut}>
                <ZoomOut fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Reset Zoom">
              <IconButton onClick={handleZoomReset}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Paper>
        
        <Paper sx={{ p: 0.5 }}>
          <Tooltip title="Filter">
            <IconButton onClick={handleFilterMenuOpen}>
              <FilterList fontSize="small" />
            </IconButton>
          </Tooltip>
        </Paper>
        
        <Paper sx={{ p: 0.5, display: 'flex', alignItems: 'center' }}>
          <TextField
            placeholder="Search..."
            variant="outlined"
            size="small"
            value={filters.search}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: <Search fontSize="small" sx={{ mr: 0.5 }} />,
              endAdornment: filters.search ? (
                <IconButton 
                  size="small" 
                  onClick={handleSearchClear}
                  edge="end"
                >
                  <Clear fontSize="small" />
                </IconButton>
              ) : null
            }}
            sx={{ width: 150 }}
          />
        </Paper>
      </Box>
      
      <Box
        sx={{
          position: 'absolute',
          top: 10,
          right: 10,
          zIndex: 10,
          display: 'flex',
          gap: 1
        }}
      >
        <Paper sx={{ p: 0.5 }}>
          <ButtonGroup size="small">
            <Tooltip title="Refresh">
              <IconButton onClick={loadTopologyData}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Export as PNG">
              <IconButton onClick={handleExportPng}>
                <GetApp fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}>
              <IconButton onClick={handleFullscreenToggle}>
                {fullscreen ? <FullscreenExit fontSize="small" /> : <Fullscreen fontSize="small" />}
              </IconButton>
            </Tooltip>
          </ButtonGroup>
        </Paper>
      </Box>
      
      {/* Legend */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 10,
          left: 10,
          zIndex: 10
        }}
      >
        <Paper sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
            Node Types
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 0.5 }}>
            <Box sx={{ display: 'flex',