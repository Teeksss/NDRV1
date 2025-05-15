import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// Components
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
import { NotFoundComponent } from './components/layout/not-found.component';
import { ReportListComponent } from './components/reports/report-list.component';
import { ReportDetailComponent } from './components/reports/report-detail.component';
import { ThreatIntelComponent } from './components/threat-intel/threat-intel.component';
import { NotificationsComponent } from './components/notifications/notifications.component';

// Guards
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'alerts', component: AlertListComponent, canActivate: [AuthGuard] },
  { path: 'alerts/:id', component: AlertDetailComponent, canActivate: [AuthGuard] },
  { path: 'events', component: EventListComponent, canActivate: [AuthGuard] },
  { path: 'events/:id', component: EventDetailComponent, canActivate: [AuthGuard] },
  { path: 'entities', component: EntityListComponent, canActivate: [AuthGuard] },
  { path: 'entities/:id', component: EntityDetailComponent, canActivate: [AuthGuard] },
  { path: 'correlation-rules', component: CorrelationRuleListComponent, canActivate: [AuthGuard] },
  { path: 'correlation-rules/:id', component: CorrelationRuleDetailComponent, canActivate: [AuthGuard] },
  { path: 'correlation-rules/edit/:id', component: CorrelationRuleEditorComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'correlation-rules/new', component: CorrelationRuleEditorComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportListComponent, canActivate: [AuthGuard] },
  { path: 'reports/:id', component: ReportDetailComponent, canActivate: [AuthGuard] },
  { path: 'reports/new', component: ReportDetailComponent, canActivate: [AuthGuard] },
  { path: 'threat-intel', component: ThreatIntelComponent, canActivate: [AuthGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [AuthGuard] },
  { path: '**', component: NotFoundComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }