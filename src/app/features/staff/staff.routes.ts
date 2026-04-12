import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const staffRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: '' },
    loadComponent: () => import('./staff-list/staff-list.component').then(m => m.StaffListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'STAFF.CREATE' },
    loadComponent: () => import('./staff-form/staff-form.component').then(m => m.StaffFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'STAFF.EDIT' },
    loadComponent: () => import('./staff-form/staff-form.component').then(m => m.StaffFormComponent)
  },
  {
    path: 'view/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'STAFF.VIEW' },
    loadComponent: () => import('./staff-view/staff-view.component').then(m => m.StaffViewComponent)
  }
];
