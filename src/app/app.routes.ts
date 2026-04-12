import { Routes } from '@angular/router';
import { tenantGuard } from './core/guards/tenant.guard';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { firstLoginGuard } from './core/guards/first-login.guard';
import { DEFAULT_TENANT_SLUG } from './core/constants/app.constants';

export const routes: Routes = [
  { path: '', redirectTo: `/${DEFAULT_TENANT_SLUG}/login`, pathMatch: 'full' },
  {
    path: ':tenantSlug',
    canActivate: [tenantGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./layouts/auth-layout/auth-layout.component').then(m => m.AuthLayoutComponent),
        children: [
          { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
          { path: 'change-password', canActivate: [authGuard], loadComponent: () => import('./features/auth/change-password/change-password.component').then(m => m.ChangePasswordComponent) },
          { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
        ]
      },
      {
        path: '',
        canActivate: [authGuard, firstLoginGuard],
        loadComponent: () => import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
        children: [
          { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.DASHBOARD' } },
          { path: 'students', loadChildren: () => import('./features/students/students.routes').then(m => m.studentsRoutes), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.STUDENTS' } },
          { path: 'staff', canActivate: [roleGuard], loadChildren: () => import('./features/staff/staff.routes').then(m => m.staffRoutes), data: { requiredRole: ['ADMIN'], breadcrumb: 'SIDEBAR.STAFF' } },
          { path: 'users', canActivate: [roleGuard], loadChildren: () => import('./features/users/users.routes').then(m => m.usersRoutes), data: { requiredRole: ['ADMIN'], breadcrumb: 'SIDEBAR.USERS' } },
          { path: 'parents', canActivate: [roleGuard], loadChildren: () => import('./features/parents/parents.routes').then(m => m.parentsRoutes), data: { requiredRole: ['ADMIN'], breadcrumb: 'SIDEBAR.PARENTS' } },
          { path: 'attendance', loadChildren: () => import('./features/attendance/attendance.routes').then(m => m.attendanceRoutes), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.ATTENDANCE' } },
          { path: 'timetable', loadChildren: () => import('./features/timetable/timetable.routes').then(m => m.timetableRoutes), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.TIMETABLE' } },
          { path: 'events', loadChildren: () => import('./features/events/events.routes').then(m => m.eventsRoutes), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.EVENTS' } },
          { path: 'exams', loadChildren: () => import('./features/exams/exams.routes').then(m => m.examsRoutes), data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'SIDEBAR.EXAMS' } },
          { path: 'setup', canActivate: [roleGuard], loadChildren: () => import('./features/setup/setup.routes').then(m => m.setupRoutes), data: { requiredRole: ['ADMIN'], breadcrumb: 'SIDEBAR.SETUP' } },
          { path: 'theme', loadComponent: () => import('./shared/components/theme-settings/theme-settings.component').then(m => m.ThemeSettingsComponent), data: { requiredRole: ['ADMIN'], breadcrumb: 'SIDEBAR.THEME' } },
          { path: 'unauthorized', loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent) },
        ]
      }
    ]
  },
  { path: 'tenant-not-found', loadComponent: () => import('./pages/tenant-not-found/tenant-not-found.component').then(m => m.TenantNotFoundComponent) },
  { path: 'not-found', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
  { path: '**', loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
