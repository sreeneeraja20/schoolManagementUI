import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';

export const attendanceRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'ATTENDANCE.MARK' },
    loadComponent: () => import('./attendance-marking/attendance-marking.component').then(m => m.AttendanceMarkingComponent)
  },
  {
    path: 'report',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'ATTENDANCE.REPORT' },
    loadComponent: () => import('./attendance-report/attendance-report.component').then(m => m.AttendanceReportComponent)
  }
];
