import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntitiesService } from '../../services/entities.service';
import { AlertsService } from '../../services/alerts.service';
import { EventsService } from '../../services/events.service';
import { WebsocketService } from '../../services/websocket.service';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ConfirmDialogComponent } from '../shared/confirm-dialog.component';
import { AddTagDialogComponent } from '../shared/add-tag-dialog.component';

@Component({
  selector: 'app-entity-detail',
  templateUrl: './entity-detail.component.html',
  styleUrls: ['./entity-detail.component.scss']
})
export class EntityDetailComponent implements OnInit, OnDestroy {
  // Entity data
  entityId: string;
  entity: any;
  
  // Related data
  recentAlerts: any[] = [];
  recentEvents: any[] = [];
  
  // Loading states
  isLoading = true;
  isLoadingAlerts = true;
  isLoadingEvents = true;
  
  // Error state
  error: string = null;
  
  // Edit mode
  isEditMode = false;
  editForm: FormGroup;
  
  // Tabs
  activeTab = 'overview';
  
  // Charts
  riskHistoryChart: any;
  eventTypeChart: any;
  vulnerabilityChart: any;
  
  // Unsubscriber
  private destroy$ = new Subject<void>();
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private entitiesService: EntitiesService,
    private alertsService: AlertsService,
    private eventsService: EventsService,
    private websocketService: WebsocketService,
    private formBuilder: FormBuilder,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    // Get entity ID from route params
    this.route.paramMap.subscribe(params => {
      this.entityId = params.get('id');
      this.loadEntityData();
    });
    
    // Subscribe to real-time updates
    this.websocketService.connect();
    
    this.websocketService.onEvent('event')
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event.entityId === this.entityId) {
          this.handleNewEvent(event);
        }
      });
    
    this.websocketService.onEvent('alert')
      .pipe(takeUntil(this.destroy$))
      .subscribe(alert => {
        if (alert.entityId === this.entityId) {
          this.handleNewAlert(alert);
        }
      });
  }

  ngOnDestroy(): void {
    // Unsubscribe from all observables
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load entity data and related information
   */
  loadEntityData(): void {
    this.isLoading = true;
    
    this.entitiesService.getEntity(this.entityId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entity) => {
          this.entity = entity;
          this.isLoading = false;
          
          // Initialize form for editing
          this.initializeEditForm();
          
          // Load related data
          this.loadRelatedData();
          
          // Initialize charts
          this.initializeCharts();
        },
        error: (error) => {
          this.error = 'Failed to load entity details. Please try again.';
          this.isLoading = false;
          console.error('Error loading entity details:', error);
        }
      });
  }

  /**
   * Load alerts, events, and other related data
   */
  loadRelatedData(): void {
    this.isLoadingAlerts = true;
    this.isLoadingEvents = true;
    
    // Configure query params
    const params = {
      limit: 10,
      entityId: this.entityId
    };
    
    // Load recent alerts
    this.alertsService.getAlerts(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentAlerts = response.data;
          this.isLoadingAlerts = false;
        },
        error: (error) => {
          console.error('Error loading alerts:', error);
          this.isLoadingAlerts = false;
        }
      });
    
    // Load recent events
    this.eventsService.getEvents(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.recentEvents = response.data;
          this.isLoadingEvents = false;
        },
        error: (error) => {
          console.error('Error loading events:', error);
          this.isLoadingEvents = false;
        }
      });
  }

  /**
   * Initialize form for editing
   */
  initializeEditForm(): void {
    this.editForm = this.formBuilder.group({
      name: [this.entity.name, Validators.required],
      type: [this.entity.type, Validators.required],
      description: [this.entity.description],
      status: [this.entity.status],
      ipAddress: [this.entity.ipAddress],
      macAddress: [this.entity.macAddress],
      hostname: [this.entity.hostname],
      operatingSystem: [this.entity.operatingSystem],
      osVersion: [this.entity.osVersion],
      riskScore: [this.entity.riskScore]
    });
  }

  /**
   * Initialize charts
   */
  initializeCharts(): void {
    // This would be implemented with Chart.js, D3, or another charting library
    // For now, we'll just set up placeholder data objects
    
    // Risk history chart
    this.riskHistoryChart = {
      type: 'line',
      data: {
        // This would be populated with actual historical risk score data
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Risk Score',
          data: [65, 70, 55, 81, 56, this.entity.riskScore || 0],
          fill: false,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    };
    
    // Event type distribution chart
    this.eventTypeChart = {
      type: 'pie',
      data: {
        // This would be populated with actual event type distribution
        labels: ['Authentication', 'Network', 'Security', 'System'],
        datasets: [{
          data: [12, 19, 8, 5],
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)',
            'rgba(75, 192, 192, 0.5)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true
      }
    };
    
    // Vulnerability chart
    if (this.entity.vulnerabilities && this.entity.vulnerabilities.length > 0) {
      // Count vulnerabilities by severity
      const criticalCount = this.entity.vulnerabilities.filter(v => v.severity === 'critical').length;
      const highCount = this.entity.vulnerabilities.filter(v => v.severity === 'high').length;
      const mediumCount = this.entity.vulnerabilities.filter(v => v.severity === 'medium').length;
      const lowCount = this.entity.vulnerabilities.filter(v => v.severity === 'low').length;
      
      this.vulnerabilityChart = {
        type: 'bar',
        data: {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{
            label: 'Vulnerabilities by Severity',
            data: [criticalCount, highCount, mediumCount, lowCount],
            backgroundColor: [
              'rgba(255, 0, 0, 0.5)',
              'rgba(255, 99, 71, 0.5)',
              'rgba(255, 165, 0, 0.5)',
              'rgba(144, 238, 144, 0.5)'
            ],
            borderColor: [
              'rgba(255, 0, 0, 1)',
              'rgba(255, 99, 71, 1)',
              'rgba(255, 165, 0, 1)',
              'rgba(144, 238, 144, 1)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      };
    }
  }

  /**
   * Handle tab change
   */
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    
    if (!this.isEditMode) {
      // Reset form to original values when cancelling edit
      this.initializeEditForm();
    }
  }

  /**
   * Save entity changes
   */
  saveChanges(): void {
    if (this.editForm.invalid) {
      return;
    }
    
    const updatedEntity = {
      ...this.editForm.value
    };
    
    this.entitiesService.updateEntity(this.entityId, updatedEntity)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.entity = response;
          this.isEditMode = false;
          
          this.snackBar.open('Entity updated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open('Failed to update entity', 'Close', {
            duration: 3000
          });
          console.error('Error updating entity:', error);
        }
      });
  }

  /**
   * Add tag to entity
   */
  addTag(): void {
    const dialogRef = this.dialog.open(AddTagDialogComponent, {
      width: '400px',
      data: {
        title: 'Add Tag',
        existingTags: this.entity.tags || []
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.entitiesService.addTagToEntity(this.entityId, result)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.entity = response;
              
              this.snackBar.open(`Tag "${result}" added successfully`, 'Close', {
                duration: 3000
              });
            },
            error: (error) => {
              this.snackBar.open('Failed to add tag', 'Close', {
                duration: 3000
              });
              console.error('Error adding tag:', error);
            }
          });
      }
    });
  }

  /**
   * Remove tag from entity
   */
  removeTag(tag: string): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Remove Tag',
        message: `Are you sure you want to remove the tag "${tag}"?`,
        confirmButtonText: 'Remove',
        confirmButtonColor: 'warn'
      }
    });
    
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.entitiesService.removeTagFromEntity(this.entityId, tag)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (response) => {
              this.entity = response;
              
              this.snackBar.open(`Tag "${tag}" removed successfully`, 'Close', {
                duration: 3000
              });
            },
            error: (error) => {
              this.snackBar.open('Failed to remove tag', 'Close', {
                duration: 3000
              });
              console.error('Error removing tag:', error);
            }
          });
      }
    });
  }

  /**
   * Handle new event from websocket
   */
  private handleNewEvent(event: any): void {
    // Add event to recent events if on first page
    if (this.recentEvents.length < 10) {
      this.recentEvents.unshift(event);
      
      // Keep only the 10 most recent events
      if (this.recentEvents.length > 10) {
        this.recentEvents.pop();
      }
    }
  }

  /**
   * Handle new alert from websocket
   */
  private handleNewAlert(alert: any): void {
    // Add alert to recent alerts if on first page
    if (this.recentAlerts.length < 10) {
      this.recentAlerts.unshift(alert);
      
      // Keep only the 10 most recent alerts
      if (this.recentAlerts.length > 10) {
        this.recentAlerts.pop();
      }
    }
    
    // Show notification
    this.snackBar.open(`New alert for entity: ${alert.title}`, 'View', {
      duration: 5000,
      horizontalPosition: 'right',
      verticalPosition: 'top',
    });
  }

  /**
   * Get risk score color
   */
  getRiskScoreColor(score: number): string {
    if (score >= 80) return 'risk-critical';
    if (score >= 60) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    if (score >= 20) return 'risk-low';
    return 'risk-none';
  }

  /**
   * Format date for display
   */
  formatDate(date: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  }

  /**
   * Navigate to all events for this entity
   */
  viewAllEvents(): void {
    this.router.navigate(['/events'], { queryParams: { entityId: this.entityId } });
  }

  /**
   * Navigate to all alerts for this entity
   */
  viewAllAlerts(): void {
    this.router.navigate(['/alerts'], { queryParams: { entityId: this.entityId } });
  }
}