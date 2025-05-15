import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// App components
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

// Material modules
import { MaterialModule } from './shared/material.module';

// Custom components
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { AlertListComponent } from './components/alerts/alert-list.component';
import { AlertDetailComponent } from './components/alerts/alert-detail.component';
import { EventListComponent } from './components/events/event-list.component';
import { EventDetailComponent } from './components/events/event-detail.component';
import { EntityListComponent } from './components/entities/entity-list.component';
import { EntityDetailComponent } from './components/entities/entity-detail.component';
import { CorrelationRuleListComponent } from './components/correlation/correlation-rule-list.component';
import { CorrelationRuleDetailComponent } from './components/correlation/correlation-rule-detail.component';
import { CorrelationRuleEditorComponent } from './components/correlation/correlation-rule-editor.component';
import { LoginComponent } from './components/auth/login.component';
import { RegisterComponent } from './components/auth/register.component';
import { ProfileComponent } from './components/auth/profile.component';
import { HeaderComponent } from './components/layout/header.component';
import { SidebarComponent } from './components/layout/sidebar.component';
import { NotFoundComponent } from './components/layout/not-found.component';
import { ReportListComponent } from './components/reports/report-list.component';
import { ReportDetailComponent } from './components/reports/report-detail.component';
import { ThreatIntelComponent } from './components/threat-intel/threat-intel.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

// Shared components
import { ConfirmDialogComponent } from './components/shared/confirm-dialog.component';
import { AddTagDialogComponent } from './components/shared/add-tag-dialog.component';
import { FilterDialogComponent } from './components/shared/filter-dialog.component';
import { AlertDetailDialogComponent } from './components/alerts/alert-detail-dialog.component';

// Services
import { AuthService } from './services/auth.service';
import { ApiService } from './services/api.service';
import { AlertsService } from './services/alerts.service';
import { EventsService } from './services/events.service';
import { EntitiesService } from './services/entities.service';
import { CorrelationService } from './services/correlation.service';
import { DashboardService } from './services/dashboard.service';
import { WebsocketService } from './services/websocket.service';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Directives and pipes
import { HighlightDirective } from './directives/highlight.directive';
import { TimeAgoPipe } from './pipes/time-ago.pipe';
import { BytesPipe } from './pipes/bytes.pipe';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';

// Third party modules
import { NgChartsModule } from 'ng2-charts';
import { GridsterModule } from 'angular-gridster2';
import { MonacoEditorModule } from 'ngx-monaco-editor';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    AlertListComponent,
    AlertDetailComponent,
    EventListComponent,
    EventDetailComponent,
    EntityListComponent,
    EntityDetailComponent,
    CorrelationRuleListComponent,
    CorrelationRuleDetailComponent,
    CorrelationRuleEditorComponent,
    LoginComponent,
    RegisterComponent,
    ProfileComponent,
    HeaderComponent,
    SidebarComponent,
    NotFoundComponent,
    ReportListComponent,
    ReportDetailComponent,
    ThreatIntelComponent,
    NotificationsComponent,
    
    // Shared components
    ConfirmDialogComponent,
    AddTagDialogComponent,
    FilterDialogComponent,
    AlertDetailDialogComponent,
    
    // Directives and pipes
    HighlightDirective,
    TimeAgoPipe,
    BytesPipe,
    SafeHtmlPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AppRoutingModule,
    MaterialModule,
    NgChartsModule,
    GridsterModule,
    MonacoEditorModule.forRoot()
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    AuthService,
    ApiService,
    AlertsService,
    EventsService,
    EntitiesService,
    CorrelationService,
    DashboardService,
    WebsocketService,
    NotificationService,
    ThemeService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }