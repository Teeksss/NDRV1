      type: 'line',
      data: widget.data,
      initialized: true
    };
  }

  /**
   * Update metrics when a new alert is received
   */
  private handleNewAlert(alert: any): void {
    // Update total alerts count
    this.alertMetrics.total++;
    
    // Update severity counts
    if (alert.severity) {
      this.alertMetrics[alert.severity]++;
    }
    
    // Update alert widgets
    this.widgets.forEach(widget => {
      if (['alert_count', 'alert_severity', 'alert_trend'].includes(widget.type)) {
        this.loadWidgetData(widget);
      }
    });
  }

  /**
   * Update metrics when a new event is received
   */
  private handleNewEvent(event: any): void {
    // Update total events count
    this.eventMetrics.total++;
    
    // Update event type counts
    if (event.type) {
      const existingType = this.eventMetrics.byType.find(t => t.type === event.type);
      if (existingType) {
        existingType.count++;
      } else {
        this.eventMetrics.byType.push({ type: event.type, count: 1 });
      }
    }
    
    // Update event widgets
    this.widgets.forEach(widget => {
      if (['event_count', 'event_trend'].includes(widget.type)) {
        this.loadWidgetData(widget);
      }
    });
  }

  /**
   * Save dashboard layout after dragging/resizing widgets
   */
  saveLayout(): void {
    const widgetPositions = this.widgets.map(widget => ({
      id: widget.id,
      position: widget.gridItem
    }));
    
    this.dashboardService.updateWidgetPositions(this.dashboard.id, { widgets: widgetPositions })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Dashboard layout saved successfully');
        },
        error: (error) => {
          console.error('Error saving dashboard layout:', error);
        }
      });
  }

  /**
   * Refresh all widget data
   */
  refreshDashboard(): void {
    this.widgets.forEach(widget => {
      widget.loading = true;
      this.loadWidgetData(widget);
    });
  }

  /**
   * Refresh a specific widget
   */
  refreshWidget(widget: any): void {
    widget.loading = true;
    this.loadWidgetData(widget);
  }

  /**
   * Add a new widget to the dashboard
   */
  addWidget(widgetType: string): void {
    const newWidget = {
      title: this.getDefaultWidgetTitle(widgetType),
      type: widgetType,
      position: { x: 0, y: 0, w: 3, h: 2 },
      config: {}
    };
    
    this.dashboardService.createWidget(this.dashboard.id, newWidget)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Add new widget to the list with gridster properties
          const widget = {
            ...response,
            gridItem: response.position,
            loading: true,
            error: null,
            data: null
          };
          this.widgets.push(widget);
          
          // Load data for the new widget
          this.loadWidgetData(widget);
        },
        error: (error) => {
          console.error('Error adding widget:', error);
        }
      });
  }

  /**
   * Remove a widget from the dashboard
   */
  removeWidget(widget: any): void {
    this.dashboardService.deleteWidget(widget.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove widget from the list
          this.widgets = this.widgets.filter(w => w.id !== widget.id);
        },
        error: (error) => {
          console.error('Error removing widget:', error);
        }
      });
  }

  /**
   * Get a default title for a new widget based on its type
   */
  private getDefaultWidgetTitle(widgetType: string): string {
    const titles = {
      alert_count: 'Alert Count',
      alert_severity: 'Alerts by Severity',
      alert_trend: 'Alert Trend',
      event_count: 'Event Count',
      event_trend: 'Event Trend',
      top_entities: 'Top Entities',
      network_traffic: 'Network Traffic',
      geo_map: 'Geographic Map'
    };
    
    return titles[widgetType] || 'New Widget';
  }
}