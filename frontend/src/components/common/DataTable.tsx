import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Toolbar,
  Typography,
  TextField,
  InputAdornment,
  Checkbox,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress,
  Tooltip,
  alpha,
  useTheme
} from '@mui/material';
import {
  Search,
  FilterList,
  Delete,
  Download,
  MoreVert,
  Clear,
  Refresh
} from '@mui/icons-material';

// Column definition type
export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => string;
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  title?: string;
  pagination?: boolean;
  search?: boolean;
  selection?: boolean;
  actions?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  rowsPerPageOptions?: number[];
  onRowClick?: (row: any) => void;
  onDelete?: (selected: any[]) => Promise<void>;
  onDownload?: (selected: any[]) => Promise<void>;
  onRefresh?: () => void;
  onSelectionChange?: (selected: any[]) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  columns,
  data,
  title,
  pagination = true,
  search = true,
  selection = false,
  actions = true,
  loading = false,
  emptyMessage = 'No data to display',
  rowsPerPageOptions = [10, 25, 50, 100],
  onRowClick,
  onDelete,
  onDownload,
  onRefresh,
  onSelectionChange
}) => {
  const theme = useTheme();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>(data);
  const [selected, setSelected] = useState<any[]>([]);
  const [orderBy, setOrderBy] = useState<string>(columns[0].id);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [activeRow, setActiveRow] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Update filtered data when data, search, or sort changes
  useEffect(() => {
    let filtered = [...data];
    
    // Apply search filter
    if (search && searchText) {
      const lowercaseSearch = searchText.toLowerCase();
      filtered = filtered.filter(row => {
        return Object.keys(row).some(key => {
          const value = row[key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(lowercaseSearch);
        });
      });
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[orderBy] || '';
      const bValue = b[orderBy] || '';
      
      if (aValue < bValue) {
        return order === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredData(filtered);
    
    // Reset page when data changes
    setPage(0);
    
    // Clear selection when data changes
    setSelected([]);
  }, [data, searchText, orderBy, order]);
  
  // Update selected items callback
  useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selected);
    }
  }, [selected, onSelectionChange]);
  
  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(event.target.value);
  };
  
  // Handle search clear
  const handleSearchClear = () => {
    setSearchText('');
  };
  
  // Handle sort
  const handleSort = (property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };
  
  // Handle selection
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(filteredData);
    } else {
      setSelected([]);
    }
  };
  
  // Handle row selection
  const handleSelectRow = (event: React.MouseEvent, row: any) => {
    event.stopPropagation();
    
    const selectedIndex = selected.findIndex(item => item === row);
    
    if (selectedIndex === -1) {
      // Add to selection
      setSelected([...selected, row]);
    } else {
      // Remove from selection
      setSelected(selected.filter((_, index) => index !== selectedIndex));
    }
  };
  
  // Handle row click
  const handleRowClick = (row: any) => {
    if (onRowClick) {
      onRowClick(row);
    }
  };
  
  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, row: any) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveRow(row);
  };
  
  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveRow(null);
  };
  
  // Handle delete action
  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setActionLoading(true);
      await onDelete(selected.length ? selected : [activeRow]);
      handleMenuClose();
    } catch (error) {
      console.error('Error deleting items:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Handle download action
  const handleDownload = async () => {
    if (!onDownload) return;
    
    try {
      setActionLoading(true);
      await onDownload(selected.length ? selected : [activeRow]);
      handleMenuClose();
    } catch (error) {
      console.error('Error downloading items:', error);
    } finally {
      setActionLoading(false);
    }
  };
  
  // Check if a row is selected
  const isSelected = (row: any) => selected.includes(row);
  
  // Calculate visible rows based on pagination
  const visibleRows = pagination
    ? filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
    : filteredData;
  
  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      {/* Toolbar with title, search and actions */}
      {(title || search || actions) && (
        <Toolbar
          sx={{
            px: { xs: 1, sm: 2 },
            pt: 2,
            pb: 1,
            ...(selected.length > 0 && {
              bgcolor: alpha(theme.palette.primary.main, 0.1),
            }),
          }}
        >
          {selected.length > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.length} selected
            </Typography>
          ) : (
            <>
              {title && (
                <Typography
                  sx={{ flex: '1 1 100%', display: { xs: 'none', sm: 'block' } }}
                  variant="h6"
                  id="tableTitle"
                  component="div"
                >
                  {title}
                </Typography>
              )}
              
              {search && (
                <TextField
                  placeholder="Search..."
                  variant="outlined"
                  size="small"
                  value={searchText}
                  onChange={handleSearchChange}
                  sx={{ mx: 1, minWidth: 200 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                    endAdornment: searchText ? (
                      <InputAdornment position="end">
                        <IconButton
                          size="small"
                          onClick={handleSearchClear}
                          edge="end"
                        >
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ) : null,
                  }}
                />
              )}
            </>
          )}
          
          {actions && (
            <Box sx={{ display: 'flex' }}>
              {selected.length > 0 ? (
                <>
                  {onDelete && (
                    <Tooltip title="Delete">
                      <IconButton onClick={handleDelete} disabled={actionLoading}>
                        {actionLoading ? <CircularProgress size={24} /> : <Delete />}
                      </IconButton>
                    </Tooltip>
                  )}
                  
                  {onDownload && (
                    <Tooltip title="Download">
                      <IconButton onClick={handleDownload} disabled={actionLoading}>
                        <Download />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              ) : (
                <>
                  {onRefresh && (
                    <Tooltip title="Refresh">
                      <IconButton onClick={onRefresh}>
                        <Refresh />
                      </IconButton>
                    </Tooltip>
                  )}
                </>
              )}
            </Box>
          )}
        </Toolbar>
      )}
      
      {/* Table container */}
      <TableContainer sx={{ maxHeight: pagination ? 'calc(100vh - 200px)' : undefined }}>
        <Table stickyHeader aria-label="data table">
          {/* Table header */}
          <TableHead>
            <TableRow>
              {/* Selection checkbox */}
              {selection && (
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selected.length > 0 && selected.length < filteredData.length}
                    checked={filteredData.length > 0 && selected.length === filteredData.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
              )}
              
              {/* Column headers */}
              {columns.map((column) => (
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}
                  sortDirection={orderBy === column.id ? order : false}
                >
                  <TableSortLabel
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={() => handleSort(column.id)}
                  >
                    {column.label}
                  </TableSortLabel>
                </TableCell>
              ))}
              
              {/* Actions column */}
              {actions && (
                <TableCell align="right" style={{ minWidth: 50 }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          
          {/* Table body */}
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : visibleRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (selection ? 1 : 0) + (actions ? 1 : 0)}
                  align="center"
                  sx={{ py: 4 }}
                >
                  <Typography variant="body1" color="textSecondary">
                    {searchText ? 'No results found' : emptyMessage}
                  </Typography>
                  {searchText && (
                    <Button
                      sx={{ mt: 1 }}
                      variant="outlined"
                      size="small"
                      onClick={handleSearchClear}
                    >
                      Clear Search
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((row, index) => {
                const isItemSelected = isSelected(row);
                
                return (
                  <TableRow
                    hover
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={index}
                    selected={isItemSelected}
                    onClick={() => handleRowClick(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {/* Selection checkbox */}
                    {selection && (
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={(event) => handleSelectRow(event, row)}
                        />
                      </TableCell>
                    )}
                    
                    {/* Row data */}
                    {columns.map((column) => {
                      const value = row[column.id];
                      
                      return (
                        <TableCell key={column.id} align={column.align}>
                          {column.render ? column.render(row) : (
                            column.format ? column.format(value) : value
                          )}
                        </TableCell>
                      );
                    })}
                    
                    {/* Actions */}
                    {actions && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={(event) => handleMenuOpen(event, row)}
                        >
                          <MoreVert fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      {pagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={filteredData.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      )}
      
      {/* Row actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {onRowClick && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              if (activeRow && onRowClick) {
                onRowClick(activeRow);
              }
            }}
          >
            <Typography variant="inherit">View Details</Typography>
          </MenuItem>
        )}
        
        {onDownload && (
          <MenuItem onClick={handleDownload}>
            <Typography variant="inherit">Download</Typography>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem
            onClick={handleDelete}
            sx={{ color: theme.palette.error.main }}
          >
            <Typography variant="inherit">Delete</Typography>
          </MenuItem>
        )}
      </Menu>
    </Paper>
  );
};

export default DataTable;