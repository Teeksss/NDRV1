import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { CorrelationService } from '../../services/correlation.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { CorrelationRuleDetailComponent } from './correlation-rule-detail.component';

@Component({
  selector: 'app-correlation-rule-list',
  templateUrl: './correlation-rule-list.component.html',
  styleUrls: ['./correlation-rule-list.component.scss']
})
export class CorrelationRuleListComponent implements OnInit, OnDestroy {
  // Table data
  dataSource = new MatTableDataSource<any>([]);
  displayedColumns: string[] = [
    'name',
    'type',
    'severity',
    'enabled',
    'triggerCount',
    'lastTriggeredAt',
    'actions'
  ];
  
  // Pagination and sorting
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;
  
  // Filtering
  filterParams: any = {
    name: '',
    type: [],
    severity: [],
    enabled: null,
    tags: [],
  };
  
  // State
  isLoading = false;
  error: string = null;
  totalRules = 0;
  
  // Active filters display
  activeFilters: string[] = [];
  
  // Unsubscriber
  private destroy$ = new Subject<void>();
  
  constructor(
    private correlationService: CorrelationService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Load correlation rules
    this.loadRules();
  }

  ngAfterViewInit() {
    // Set up pagination and sorting
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Reload data when sorting changes
    if (this.sort) {
      this.sort.sortChange.subscribe(() => {
        this.paginator.pageIndex = 0;
        this.loadRules();
      });
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load correlation rules with current filters
   */
  loadRules(page: number = 0, limit: number = 25): void {
    this.isLoading = true;
    
    // Prepare query parameters
    const params = {
      ...this.filterParams,
      page: page + 1, // API uses 1-based pagination
      limit,
      sort: this.sort ? this.sort.active : 'name',
      order: this.sort ? this.sort.direction : 'asc',
    };
    
    this.correlationService.getRules(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.dataSource.data = response.data;
          this.totalRules = response.total;
          this.isLoading = false;
          this.error = null;
          
          // Update active filters display
          this.updateActiveFilters();
        },
        error: (error) => {
          this.error = 'Failed to load correlation rules. Please try again.';
          this.isLoading = false;
          console.error('Error loading correlation rules:', error);
        }
      });
  }

  /**
   * Handle pagination event
   */
  onPageChange(event: any): void {
    this.loadRules(event.pageIndex, event.pageSize);
  }

  /**
   * Apply text search filter
   */
  applySearchFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.filterParams.name = filterValue.trim().toLowerCase();
    this.paginator.pageIndex = 0;
    this.loadRules();
  }

  /**
   * Apply quick filter (type, severity, enabled)
   */
  applyQuickFilter(filterType: string, value: string | boolean): void {
    if (filterType === 'type') {
      if (this.filterParams.type.includes(value)) {
        this.filterParams.type = this.filterParams.type.filter(t => t !== value);
      } else {
        this.filterParams.type = [...this.filterParams.type, value];
      }
    } else if (filterType === 'severity') {
      if (this.filterParams.severity.includes(value)) {
        this.filterParams.severity = this.filterParams.severity.filter(s => s !== value);
      } else {
        this.filterParams.severity = [...this.filterParams.severity, value];
      }
    } else if (filterType === 'enabled') {
      this.filterParams.enabled = this.filterParams.enabled === value ? null : value;
    }
    
    this.paginator.pageIndex = 0;
    this.loadRules();
  }

  /**
   * Clear all filters
   */
  clearFilters(): void {
    this.filterParams = {
      name: '',
      type: [],
      severity: [],
      enabled: null,
      tags: [],
    };
    this.paginator.pageIndex = 0;
    this.loadRules();
  }

  /**
   * Update the active filters display
   */
  private updateActiveFilters(): void {
    this.activeFilters = [];
    
    // Add name filter
    if (this.filterParams.name) {
      this.activeFilters.push(`Name: "${this.filterParams.name}"`);
    }
    
    // Add type filters
    if (this.filterParams.type && this.filterParams.type.length) {
      this.activeFilters.push(`Type: ${this.filterParams.type.join(', ')}`);
    }
    
    // Add severity filters
    if (this.filterParams.severity && this.filterParams.severity.length) {
      this.activeFilters.push(`Severity: ${this.filterParams.severity.join(', ')}`);
    }
    
    // Add enabled filter
    if (this.filterParams.enabled !== null) {
      this.activeFilters.push(`Status: ${this.filterParams.enabled ? 'Enabled' : 'Disabled'}`);
    }
    
    // Add tags filters
    if (this.filterParams.tags && this.filterParams.tags.length) {
      this.activeFilters.push(`Tags: ${this.filterParams.tags.join(', ')}`);
    }
  }

  /**
   * View rule details
   */
  viewRule(rule: any): void {
    this.router.navigate(['/correlation-rules', rule.id]);
  }

  /**
   * Open rule details dialog
   */
  openRuleDetail(rule: any): void {
    const dialogRef = this.dialog.open(CorrelationRuleDetailComponent, {
      width: '80%',
      maxWidth: '1200px',
      data: { ruleId: rule.id }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result && result.refresh) {
        this.loadRules();
      }
    });
  }

  /**
   * Create new correlation rule
   */
  createRule(): void {
    this.router.navigate(['/correlation-rules/new']);
  }

  /**
   * Edit correlation rule
   */
  editRule(rule: any, event: Event): void {
    event.stopPropagation();
    this.router.navigate(['/correlation-rules/edit', rule.id]);
  }

  /**
   * Toggle rule enabled status
   */
  toggleRuleStatus(rule: any, event: Event): void {
    event.stopPropagation();
    
    const newStatus = !rule.enabled;
    
    this.correlationService.updateRule(rule.id, { enabled: newStatus })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedRule) => {
          // Update the rule in the table
          const index = this.dataSource.data.findIndex(r => r.id === rule.id);
          if (index !== -1) {
            this.dataSource.data[index] = updatedRule;
            this.dataSource.data = [...this.dataSource.data];
          }
          
          this.snackBar.open(
            `Rule "${rule.name}" ${newStatus ? 'enabled' : 'disabled'}`,
            'Close',
            { duration: 3000 }
          );
        },
        error: (error) => {
          this.snackBar.open(
            `Failed to ${newStatus ? 'enable' : 'disable'} rule`,
            'Close',
            { duration: 3000 }
          );
          console.error('Error updating rule status:', error);
        }
      });
  }

  /**
   * Delete correlation rule
   */
  deleteRule(rule: any, event: Event): void {
    event.stopPropagation();
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Delete Correlation Rule',
        message: `Are you sure you want to delete the rule "${rule.name}"? This action cannot be undone.`,
        confirmButtonText: 'Delete',
        confirmButtonColor: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.correlationService.deleteRule(rule.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remove rule from the table
              this.dataSource.data = this.dataSource.data.filter(r => r.id !== rule.id);
              this.totalRules--;
              
              this.snackBar.open(
                `Rule "${rule.name}" deleted successfully`,
                'Close',
                { duration: 3000 }
              );
            },
            error: (error) => {
              this.snackBar.open(
                'Failed to delete rule',
                'Close',
                { duration: 3000 }
              );
              console.error('Error deleting rule:', error);
            }
          });
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
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  /**
   * Helper function to truncate text
   */
  truncate(text: string, length: number = 50): string {
    if (!text) return '';
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }
}