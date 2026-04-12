import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';

export const timetableRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'TIMETABLE.VIEW' },
    loadComponent: () => import('./timetable-view/timetable-view.component').then(m => m.TimetableViewComponent)
  },
  {
    path: 'builder',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'TIMETABLE.BUILDER' },
    loadComponent: () => import('./timetable-builder/timetable-builder.component').then(m => m.TimetableBuilderComponent)
  }
];
