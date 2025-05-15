import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  TextField,
  InputAdornment,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert,
  Grid,
  Tooltip,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Search as SearchIcon,
  Download as DownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { DateRangePicker } from '@mui/x-date-pickers-pro';
import { AlertService } from '../services/AlertService';
import { useAuth } from '../hooks/useAuth';
import { useNotification } from '../hooks/useNotification';
import AlertStatusBadge from '../components/alerts/AlertStatusBadge';
import AlertSeverityBadge from '../components/alerts/AlertSeverityBadge';
import AlertTrendChart from '../components/charts/AlertTrendChart';
import AlertSeverityPieChart from '../components/charts/AlertSeverityPieChart';
import { formatDate, formatRelativeTime } from '../utils/formatters';

const AlertsPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showNotification } = useNotification();
  const alertService = new AlertService();
  
  // State
  const [alerts, setAlerts] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusMenuAnchor, setStatusMenuAnchor] = useState<null | HTMLElement>(null);
  const [severityMenuAnchor, setSeverityMenuAnchor] = useState<null | HTMLElement>(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [selectedAlerts, setSelectedAlerts] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState<boolean>(false);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [filters, setFilters] = useState<any>({
    status: [],
    severity: [],
    startDate: null,
    endDate: null,
  });
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(25);
  const [totalAlerts, setTotalAlerts] = useState<number>(0);
  const [viewMode, setViewMode] = useState<string>('list');
  
  // Load alerts on component mount and when filters change
  useEffect(() => {
    loadAlerts();
    loadStatistics();
  }, [filters, page, pageSize]);
  
  // Load alerts from API
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build filters for API call
      const apiFilters: any = {
        page: page + 1,
        limit: pageSize,
        sort: 'timestamp',
        order: 'desc',
      };
      
      // Add status filter if selected
      if (filters.status.length > 0) {
        apiFilters.status = filters.status;
      }
      
      // Add severity filter if selected
      if (filters.severity.length > 0) {
        apiFilters.severity = filters.severity;
      }
      
      // Add date range filter if selected
      if (filters.startDate) {
        apiFilters.startDate = filters.startDate.toISOString();
      }
      
      if (filters.endDate) {
        apiFilters.endDate = filters.endDate.toISOString();
      }
      
      // Add search term if entered
      if (searchTerm) {
        apiFilters.search = searchTerm;
      }
      
      // Call API
      const result = await alertService.getAlerts(apiFilters);
      
      // Update alerts and total count
      setAlerts(result.data);
      setTotalAlerts(result.total);
      setLoading(false);
    } catch (error) {
      console.error('Error loading alerts:', error);
      setError('Failed to load alerts. Please try again.');
      setLoading(false);
    }
  };
  
  // Load alert statistics
  const loadStatistics = async () => {
    try {
      const result = await alertService.getAlertStatistics();
      setStatistics(result);
    } catch (error) {
      console.error('Error loading alert statistics:', error);
    }
  };
  
  // Handle refresh button click
  const handleRefresh = () => {
    loadAlerts();
    loadStatistics();
  };
  
  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  // Handle search submit
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loadAlerts();
  };
  
  // Handle filter menu open
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterMenuAnchor(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterMenuAnchor(null);
  };
  
  // Handle status menu open
  const handleStatusMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setStatusMenuAnchor(event.currentTarget);
  };
  
  // Handle status menu close
  const handleStatusMenuClose = () => {
    setStatusMenuAnchor(null);
  };
  
  // Handle severity menu open
  const handleSeverityMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSeverityMenuAnchor(event.currentTarget);
  };
  
  // Handle severity menu close
  const handleSeverityMenuClose = () => {
    setSeverityMenuAnchor(null);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (status: string) => {
    setFilters(prevFilters => {
      const currentStatuses = [...prevFilters.status];
      
      // Toggle status selection
      if (currentStatuses.includes(status)) {
        return {
          ...prevFilters,
          status: currentStatuses.filter(s => s !== status)
        };
      } else {
        return {
          ...prevFilters,
          status: [...currentStatuses, status]
        };
      }
    });
  };
  
  // Handle severity filter change
  const handleSeverityFilterChange = (severity: string) => {
    setFilters(prevFilters => {
      const currentSeverities = [...prevFilters.severity];
      
      // Toggle severity selection
      if (currentSeverities.includes(severity)) {
        return {
          ...prevFilters,
          severity: currentSeverities.filter(s => s !== severity)
        };
      } else {
        return {
          ...prevFilters,
          severity: [...currentSeverities, severity]
        };
      }
    });
  };
  
  // Handle date range change
  const handleDateRangeChange = (range: [Date | null, Date | null]) => {
    setDateRange(range);
    
    setFilters(prevFilters => ({
      ...prevFilters,
      startDate: range[0],
      endDate: range[1]
    }));
  };
  
  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      status: [],
      severity: [],
      startDate: null,
      endDate: null,
    });
    setDateRange([null, null]);
    setSearchTerm('');
  };
  
  // Handle row click to navigate to alert detail
  const handleRowClick = (params: any) => {
    navigate(`/alerts/${params.id}`);
  };
  
  // Handle row selection change
  const handleSelectionChange = (selection: any) => {
    setSelectedAlerts(selection);
  };
  
  // Handle action menu open
  const handleActionMenuOpen = (event: React.MouseEvent<HTMLElement>, alert: any) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedAlert(alert);
  };
  
  // Handle action menu close
  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedAlert(null);
  };
  
  // Handle alert status change
  const handleAlertStatusChange = async (id: string, newStatus: string) => {
    try {
      await alertService.updateAlertStatus(id, newStatus);
      
      // Update alert in list
      setAlerts(prevAlerts => 
        prevAlerts.map(alert => 
          alert.id === id ? { ...alert, status: newStatus } : alert
        )
      );
      
      showNotification({
        type: 'success',
        message: 'Alert status updated successfully'
      });
    } catch (error) {
      console.error('Error updating alert status:', error);
      showNotification({
        type: 'error',
        message: 'Failed to update alert status'
      });
    }
    
    // Close menu
    handleActionMenuClose();
  };
  
  // Handle alert deletion
  const handleDeleteAlert = async () => {
    if (!selectedAlert) return;
    
    try {
      await alertService.deleteAlert(selectedAlert.id);
      
      // Remove alert from list
      setAlerts(prevAlerts => 
        prevAlerts.filter(alert => alert.id !== selectedAlert.id)
      );
      
      showNotification({
        type: 'success',
        message: 'Alert deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting alert:', error);
      showNotification({
        type: 'error',
        message: 'Failed to delete alert'
      });
    }
    
    // Close dialogs and menus
    setDeleteDialogOpen(false);
    handleActionMenuClose();
  };
  
  // Handle bulk action dialog open
  const handleBulkActionDialogOpen = (action: string) => {
    setBulkAction(action);
    setBulkActionDialogOpen(true);
  };
  
  // Handle bulk action execution
  const handleBulkActionExecute = async () => {
    try {
      if (bulkAction === 'delete') {
        // Implementation for bulk delete would go here
      } else {
        // For status changes
        await alertService.bulkUpdateStatus(selectedAlerts, bulkAction);
        
        // Update alerts in list
        setAlerts(prevAlerts => 
          prevAlerts.map(alert => 
            selectedAlerts.includes(alert.id) ? { ...alert, status: bulkAction } : alert
          )
        );
      }
      
      showNotification({
        type: 'success',
        message: `Bulk action completed successfully for ${selectedAlerts.length} alerts`
      });
      
      // Clear selection
      setSelectedAlerts([]);
    } catch (error) {
      console.error('Error executing bulk action:', error);
      showNotification({
        type: 'error',
        message: 'Failed to execute bulk action'
      });
    }
    
    // Close dialog
    setBulkActionDialogOpen(false);
  };
  
  // Handle view mode change
  const handleViewModeChange = (mode: string) => {
    setViewMode(mode);
  };
  
  // DataGrid columns configuration
  const columns: GridColDef[] = [
    {
      field: 'title',
      headerName: 'Başlık',
      flex: 2,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AlertSeverityBadge severity={params.row.severity} size="small" />
          <Typography sx={{ ml: 1 }}>{params.value}</Typography>
        </Box>
      ),
    },
    {
      field: 'source',
      headerName: 'Kaynak',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'timestamp',
      headerName: 'Zaman',
      flex: 1,
      minWidth: 160,
      valueFormatter: (params) => formatDate(params.value),
    },
    {
      field: 'status',
      headerName: 'Durum',
      flex: 1,
      minWidth: 120,
      renderCell: (params: GridRenderCellParams) => (
        <AlertStatusBadge status={params.value} size="small" />
      ),
    },
    {
      field: 'actions',
      headerName: 'İşlemler',
      flex: 0.5,
      minWidth: 80,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <IconButton
          size="small"
          onClick={(e) => handleActionMenuOpen(e, params.row)}
        >
          <MoreVertIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];
  
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Güvenlik Alarmları
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            color={viewMode === 'list' ? 'primary' : 'inherit'}
            onClick={() => handleViewModeChange('list')}
            size="small"
          >
            Liste
          </Button>
          
          <Button
            variant="contained"
            color={viewMode === 'stats' ? 'primary' : 'inherit'}
            onClick={() => handleViewModeChange('stats')}
            size="small"
          >
            İstatistikler
          </Button>
          
          <IconButton
            size="small"
            color="primary"
            onClick={handleRefresh}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>
      
      {/* Filters and search */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                fullWidth
                placeholder="Alarm adı, açıklama veya IP adresi ara..."
                value={searchTerm}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <Button type="submit" variant="contained" size="small">
                        Ara
                      </Button>
                    </InputAdornment>
                  ),
                }}
              />
            </form>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                startIcon={<FilterIcon />}
                onClick={handleFilterMenuOpen}
              >
                Filtreler
                {(filters.status.length > 0 || filters.severity.length > 0 || filters.startDate) && (
                  <Chip 
                    size="small" 
                    label={filters.status.length + filters.severity.length + (filters.startDate ? 1 : 0)} 
                    color="primary" 
                    sx={{ ml: 1 }}
                  />
                )}
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<StatusIcon />}
                onClick={handleStatusMenuOpen}
              >
                Durum
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<WarningIcon />}
                onClick={handleSeverityMenuOpen}
              >
                Önem
              </Button>
              
              <Tooltip title="CSV olarak dışa aktar">
                <IconButton color="primary">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>
        
        {/* Active filters display */}
        {(filters.status.length > 0 || filters.severity.length > 0 || filters.startDate) && (
          <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {filters.status.map((status: string) => (
              <Chip
                key={status}
                label={`Durum: ${status}`}
                onDelete={() => handleStatusFilterChange(status)}
                size="small"
              />
            ))}
            
            {filters.severity.map((severity: string) => (
              <Chip
                key={severity}
                label={`Önem: ${severity}`}
                onDelete={() => handleSeverityFilterChange(severity)}
                size="small"
              />
            ))}
            
            {filters.startDate && (
              <Chip
                label={`Tarih: ${formatDate(filters.startDate)} - ${filters.endDate ? formatDate(filters.endDate) : 'now'}`}
                onDelete={() => handleDateRangeChange([null, null])}
                size="small"
              />
            )}
            
            <Button
              variant="text"
              size="small"
              onClick={handleClearFilters}
            >
              Tüm filtreleri temizle
            </Button>
          </Box>
        )}
      </Paper>
      
      {/* Main content based on view mode */}
      {viewMode === 'list' ? (
        // List view
        <Paper sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
          {loading && alerts.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" paragraph>
                {error}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRefresh}
              >
                Yeniden Dene
              </Button>
            </Box>
          ) : (
            <DataGrid
              rows={alerts}
              columns={columns}
              loading={loading}
              pagination
              paginationMode="server"
              rowCount={totalAlerts}
              page={page}
              pageSize={pageSize}
              rowsPerPageOptions={[10, 25, 50, 100]}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              checkboxSelection
              disableSelectionOnClick
              onRowClick={handleRowClick}
              onSelectionModelChange={handleSelectionChange}
              selectionModel={selectedAlerts}
              density="standard"
              components={{
                Toolbar: GridToolbar,
              }}
              sx={{
                '& .MuiDataGrid-cell:hover': {
                  cursor: 'pointer',
                },
              }}
            />
          )}
        </Paper>
      ) : (
        // Statistics view
        <Box>
          {loading && !statistics ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={3}>
              {/* Severity distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Alarm Önem Seviyesi Dağılımı
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <AlertSeverityPieChart data={statistics?.bySeverity} />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Status distribution */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%' }}>
                  <Typography variant="h6" gutterBottom>
                    Alarm Durumu Dağılımı
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <AlertStatusPieChart data={statistics?.byStatus} />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Alert trend */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Alarm Trendi
                  </Typography>
                  <Box sx={{ height: 300 }}>
                    <AlertTrendChart />
                  </Box>
                </Paper>
              </Grid>
              
              {/* Top affected entities */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    En Çok Etkilenen Varlıklar
                  </Typography>
                  
                  {statistics?.topEntities?.slice(0, 5).map((entity: any) => (
                    <Box 
                      key={entity.entityId} 
                      sx={{ 
                        p: 1, 
                        mb: 1, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box>
                        <Typography variant="body1">
                          {entity.entityName || entity.entityId}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {entity.entityType}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={entity.alertCount} 
                          color="error" 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <NavigateNextIcon color="action" />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
              
              {/* MITRE ATT&CK mapping */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    MITRE ATT&CK Dağılımı
                  </Typography>
                  
                  {statistics?.mitreMapping?.slice(0, 5).map((tactic: any) => (
                    <Box 
                      key={tactic.tactic} 
                      sx={{ 
                        p: 1, 
                        mb: 1, 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        borderBottom: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box>
                        <Typography variant="body1">
                          {tactic.tactic}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {tactic.techniques?.length || 0} teknik
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Chip 
                          label={tactic.totalCount} 
                          color="primary" 
                          size="small" 
                          sx={{ mr: 1 }}
                        />
                        <NavigateNextIcon color="action" />
                      </Box>
                    </Box>
                  ))}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      )}
      
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
        <MenuItem disabled>
          <Typography variant="subtitle2">
            Tarih Aralığı
          </Typography>
        </MenuItem>
        <MenuItem>
          <DateRangePicker
            value={dateRange}
            onChange={handleDateRangeChange}
            localeText={{ start: 'Başlangıç', end: 'Bitiş' }}
          />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleClearFilters}>
          Tüm filtreleri temizle
        </MenuItem>
      </Menu>
      
      {/* Status menu */}
      <Menu
        anchorEl={statusMenuAnchor}
        open={Boolean(statusMenuAnchor)}
        onClose={handleStatusMenuClose}
      >
        <MenuItem onClick={() => { handleStatusFilterChange('open'); handleStatusMenuClose(); }}>
          <AlertStatusBadge status="open" size="small" />
          <Typography sx={{ ml: 1 }}>Açık</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusFilterChange('in_progress'); handleStatusMenuClose(); }}>
          <AlertStatusBadge status="in_progress" size="small" />
          <Typography sx={{ ml: 1 }}>İşlemde</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusFilterChange('resolved'); handleStatusMenuClose(); }}>
          <AlertStatusBadge status="resolved" size="small" />
          <Typography sx={{ ml: 1 }}>Çözüldü</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusFilterChange('closed'); handleStatusMenuClose(); }}>
          <AlertStatusBadge status="closed" size="small" />
          <Typography sx={{ ml: 1 }}>Kapatıldı</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleStatusFilterChange('false_positive'); handleStatusMenuClose(); }}>
          <AlertStatusBadge status="false_positive" size="small" />
          <Typography sx={{ ml: 1 }}>Yanlış Alarm</Typography>
        </MenuItem>
      </Menu>
      
      {/* Severity menu */}
      <Menu
        anchorEl={severityMenuAnchor}
        open={Boolean(severityMenuAnchor)}
        onClose={handleSeverityMenuClose}
      >
        <MenuItem onClick={() => { handleSeverityFilterChange('critical'); handleSeverityMenuClose(); }}>
          <AlertSeverityBadge severity="critical" size="small" />
          <Typography sx={{ ml: 1 }}>Kritik</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleSeverityFilterChange('high'); handleSeverityMenuClose(); }}>
          <AlertSeverityBadge severity="high" size="small" />
          <Typography sx={{ ml: 1 }}>Yüksek</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleSeverityFilterChange('medium'); handleSeverityMenuClose(); }}>
          <AlertSeverityBadge severity="medium" size="small" />
          <Typography sx={{ ml: 1 }}>Orta</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleSeverityFilterChange('low'); handleSeverityMenuClose(); }}>
          <AlertSeverityBadge severity="low" size="small" />
          <Typography sx={{ ml: 1 }}>Düşük</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleSeverityFilterChange('info'); handleSeverityMenuClose(); }}>
          <AlertSeverityBadge severity="info" size="small" />
          <Typography sx={{ ml: 1 }}>Bilgi</Typography>
        </MenuItem>
      </Menu>
      
      {/* Action menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
      >
        <MenuItem onClick={() => navigate(`/alerts/${selectedAlert?.id}`)}>
          Detayları Görüntüle
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleAlertStatusChange(selectedAlert?.id, 'in_progress')}>
          İşleme Al
        </MenuItem>
        <MenuItem onClick={() => handleAlertStatusChange(selectedAlert?.id, 'resolved')}>
          Çözüldü Olarak İşaretle
        </MenuItem>
        <MenuItem onClick={() => handleAlertStatusChange(selectedAlert?.id, 'false_positive')}>
          Yanlış Alarm Olarak İşaretle
        </MenuItem>
        <MenuItem onClick={() => handleAlertStatusChange(selectedAlert?.id, 'closed')}>
          Kapat
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => setDeleteDialogOpen(true)} sx={{ color: theme.palette.error.main }}>
          Sil
        </MenuItem>
      </Menu>
      
      {/* Bulk action buttons */}
      {selectedAlerts.length > 0 && (
        <Paper
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" sx={{ mr: 1 }}>
            {selectedAlerts.length} alarm seçildi
          </Typography>
          
          <Button
            size="small"
            variant="outlined"
            color="primary"
            onClick={() => handleBulkActionDialogOpen('in_progress')}
          >
            İşleme Al
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="success"
            onClick={() => handleBulkActionDialogOpen('resolved')}
          >
            Çözüldü
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="warning"
            onClick={() => handleBulkActionDialogOpen('false_positive')}
          >
            Yanlış Alarm
          </Button>
          
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => handleBulkActionDialogOpen('delete')}
          >
            Sil
          </Button>
        </Paper>
      )}
      
      {/* Delete alert dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Alarm Silme Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            Bu alarmı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleDeleteAlert}
            color="error"
            variant="contained"
          >
            Sil
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bulk action dialog */}
      <Dialog
        open={bulkActionDialogOpen}
        onClose={() => setBulkActionDialogOpen(false)}
      >
        <DialogTitle>Toplu İşlem Onayı</DialogTitle>
        <DialogContent>
          <Typography>
            {selectedAlerts.length} alarm için {
              bulkAction === 'in_progress' ? 'işleme alma' :
              bulkAction === 'resolved' ? 'çözüldü olarak işaretleme' :
              bulkAction === 'false_positive' ? 'yanlış alarm olarak işaretleme' :
              bulkAction === 'closed' ? 'kapatma' :
              'silme'
            } işlemini onaylıyor musunuz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkActionDialogOpen(false)}>
            İptal
          </Button>
          <Button 
            onClick={handleBulkActionExecute}
            color={bulkAction === 'delete' ? 'error' : 'primary'}
            variant="contained"
          >
            Onayla
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AlertsPage;