import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AlertsService } from '../../services/alerts.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AlertDetailDialogComponent } from './alert-detail-dialog.component';
import { FilterDialogComponent } from '../shared/filter-dialog.component';

@Component({
  selector: 'app-alert-list',
  templateUrl: './alert-list.component.html',
  styleUrls: ['./alert-list.component.scss']
})
export class AlertListComponent implements OnInit, OnDestroy {
  // Table data
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'severity',
    'title',
    'status',
    'source',
    'timestamp',
    'actions'
  ];
  
  // Pagination and sorting
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  // Filtering
  filterParams: any = {
    severity: [],
    status: [],
    source: [],
    startDate: null,
    endDate: null,
    search: '',
  };
  
  // State
  isLoading = false;
  error: string = null;
  totalAlerts = 0;
  
  // Active filters display
  activeFilters: string[] = [];
  
  // Unsubscriber
  private destroy$ = new Subject<void>();
  
  constructor(
    private alertsService: AlertsService,
    private websocketService: WebsocketService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Load alerts
    this.loadAlerts();
    
    // Subscribe to real-time updates
    this.websocketService.connect();
    this.websocketService.onEvent('alert')
      .pipe(takeUntil(this.destroy$))
      .subscribe(alert => {
        this.handleNewAlert(alert);
      });
  }

  ngAfterViewInit() {
    // Set up pagination and sorting
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load alerts with current filters
   */
  loadAlerts(page: number = 0, limit: number = 50): void {
    this.isLoading = true;
    
    // Prepare query parameters
    const params = {
      ...this.filterParams,
      page: page + 1, // API uses 1-based pagination
      limit,
      sort: this.sort ? this.sort.active : 'timestamp',
      order: this.sort ? this.sort.direction : 'desc',
    };
    
    this.alertsService.getAlerts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalAlerts = response.total;
          this.isLoading = false;
          this.error = null;
          
          // Update active filters display
          this.updateActiveFilters();
        },
        error: (error) => {
          this.error = 'Failed to load alerts. Please try again.';
          this.isLoading = false;
          console.error('Error loading alerts:', error);
        }
      });
  }

  /**
   * Handle pagination event
   */
  onPageChange(event: any): void {
    this.loadAlerts(event.pageIndex, event.pageSize);
  }

  /**
   * Apply quick filter (severity, status)
   */
  applyQuickFilter(filterType: string, value: string): void {
    if (filterType === 'severity') {
      if (this.filterParams.severity.includes(value)) {
        this.filterParams.severity = this.filterParams.severity.filter(s => s !== value);
      } else {
        this.filterParams.severity = [...this.filterParams.severity, value];
      }
    } else if (filterType === 'status') {
      if (this.filterParams.status.includes(value)) {
        this.filterParams.status = this.filterParams.status.filter(s => s !== value);
      } else {
        this.filterParams.status = [...this.filterParams.status, value];
      }
    }
    
    this.loadAlerts();
  }

  /**
   * Apply text search filter
   */
  applySearchFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterParams.search = filterValue.trim().toLowerCase();
    this.loadAlerts();
  }

  /**
   * Open advanced filter dialog
   */
  openFilterDialog(): void {
    const dialogRef = this.dialog.open(FilterDialogComponent, {
      width: '600px',
      data: {
        filters: this.filterParams,
        options: {
          severity: ['critical', 'high', 'medium', 'low', 'info'],
          status: ['open', 'in_progress', 'resolved', 'closed', 'false_positive'],
          source: ['intrusion_detection', 'firewall', 'correlation_engine', 'antivirus', 'system']
        }
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.filterParams = result;
        this.loadAlerts();
      }
    });
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterParams = {
      severity: [],
      status: [],
      source: [],
      startDate: null,
      endDate: null,
      search: '',
    };
    this.loadAlerts();
  }

  /**
   * Update the active filters display
   */
  private updateActiveFilters(): void {
    this.activeFilters = [];
    
    // Add severity filters
    if (this.filterParams.severity && this.filterParams.severity.length) {
      this.activeFilters.push(`Severity: ${this.filterParams.severity.join(', ')}`);
    }
    
    // Add status filters
    if (this.filterParams.status && this.filterParams.status.length) {
      this.activeFilters.push(`Status: ${this.filterParams.status.join(', ')}`);
    }
    
    // Add source filters
    if (this.filterParams.source && this.filterParams.source.length) {
      this.activeFilters.push(`Source: ${this.filterParams.source.join(', ')}`);
    }
    
    // Add date range filter
    if (this.filterParams.startDate && this.filterParams.endDate) {
      const start = new Date(this.filterParams.startDate).toLocaleDateString();
      const end = new Date(this.filterParams.endDate).toLocaleDateString();
      this.activeFilters.push(`Date: ${start} to ${end}`);
    } else if (this.filterParams.startDate) {
      const start = new Date(this.filterParams.startDate).toLocaleDateString();
      this.activeFilters.push(`Date: After ${start}`);
    } else if (this.filterParams.endDate) {
      const end = new Date(this.filterParams.endDate).toLocaleDateString();
      this.activeFilters.push(`Date: Before ${end}`);
    }
    
    // Add search filter
    if (this.filterParams.search) {
      this.activeFilters.push(`Search: "${this.filterParams.search}"`);
    }
  }

  /**
   * Handle a new alert from websocket
   */
  private handleNewAlert(alert: any): void {
    // Check if the alert matches current filters
    if (this.matchesFilters(alert)) {
      // Add to the top of the list if sorting by timestamp desc
      if (this.sort.active === 'timestamp' && this.sort.direction === 'desc') {
        this.dataSource.data = [alert, ...this.dataSource.data];
        
        // If we're on the first page, remove the last item to maintain page size
        if (this.paginator.pageIndex === 0 && 
            this.dataSource.data.length > this.paginator.pageSize) {
          this.dataSource.data = this.dataSource.data.slice(0, this.paginator.pageSize);
        }
      }
      
      // Show notification
      this.snackBar.open(`New alert: ${alert.title}`, 'View', {
        duration: 5000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      }).onAction().subscribe(() => {
        this.openAlertDetail(alert);
      });
    }
    
    // Update total count
    this.totalAlerts++;
  }

  /**
   * Check if an alert matches the current filters
   */
  private matchesFilters(alert: any): boolean {
    // Check severity filter
    if (this.filterParams.severity && this.filterParams.severity.length) {
      if (!this.filterParams.severity.includes(alert.severity)) {
        return false;
      }
    }
    
    // Check status filter
    if (this.filterParams.status && this.filterParams.status.length) {
      if (!this.filterParams.status.includes(alert.status)) {
        return false;
      }
    }
    
    // Check source filter
    if (this.filterParams.source && this.filterParams.source.length) {
      if (!this.filterParams.source.includes(alert.source)) {
        return false;
      }
    }
    
    // Check search filter
    if (this.filterParams.search) {
      const searchStr = this.filterParams.search.toLowerCase();
      const searchableText = `${alert.title} ${alert.description} ${alert.source}`.toLowerCase();
      if (!searchableText.includes(searchStr)) {
        return false;
      }
    }
    
    // Check date range
    if (this.filterParams.startDate) {
      const startDate = new Date(this.filterParams.startDate);
      const alertDate = new Date(alert.timestamp);
      if (alertDate < startDate) {
        return false;
      }
    }
    
    if (this.filterParams.endDate) {
      const endDate = new Date(this.filterParams.endDate);
      const alertDate = new Date(alert.timestamp);
      if (alertDate > endDate) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * View alert details
   */
  viewAlert(alert: any): void {
    this.router.navigate(['/alerts', alert.id]);
  }

  /**
   * Open alert detail dialog
   */
  openAlertDetail(alert: any): void {
    const dialogRef = this.dialog.open(AlertDetailDialogComponent, {
      width: '80%',
      maxWidth: '1000px',
      data: { alertId: alert.id }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.refresh) {
        this.loadAlerts();
      }
    });
  }

  /**
   * Update alert status
   */
  updateStatus(alert: any, status: string): void {
    this.alertsService.updateAlert(alert.id, { status })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedAlert) => {
          // Update the alert in the table
          const index = this.dataSource.data.findIndex(a => a.id === alert.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedAlert;
            this.dataSource.data = [...this.dataSource.data];
          }
          
          this.snackBar.open(`Alert status updated to ${status}`, 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open('Failed to update alert status', 'Close', {
            duration: 3000
          });
          console.error('Error updating alert status:', error);
        }
      });
  }

  /**
   * Get severity style class
   */
  getSeverityClass(severity: string): string {
    return `severity-${severity.toLowerCase()}`;
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    return new Date(date).toLocaleString();
  }
}