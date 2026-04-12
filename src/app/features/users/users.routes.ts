import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const usersRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: '' },
    loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'USERS.CREATE' },
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'USERS.EDIT' },
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent)
  }
];
