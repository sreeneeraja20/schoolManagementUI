import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const eventsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: '' },
    loadComponent: () => import('./event-list/event-list.component').then(m => m.EventListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'EVENTS.CREATE' },
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'EVENTS.EDIT' },
    loadComponent: () => import('./event-form/event-form.component').then(m => m.EventFormComponent)
  },
  {
    path: 'calendar',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'EVENTS.CALENDAR' },
    loadComponent: () => import('./event-calendar/event-calendar.component').then(m => m.EventCalendarComponent)
  }
];
