import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const parentsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: '' },
    loadComponent: () => import('./parent-list/parent-list.component').then(m => m.ParentListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'PARENTS.CREATE' },
    loadComponent: () => import('./parent-form/parent-form.component').then(m => m.ParentFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'PARENTS.EDIT' },
    loadComponent: () => import('./parent-form/parent-form.component').then(m => m.ParentFormComponent)
  },
  {
    path: 'view/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'PARENTS.VIEW' },
    loadComponent: () => import('./parent-view/parent-view.component').then(m => m.ParentViewComponent)
  },
  {
    path: 'bulk-create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'PARENTS.BULK_CREATE' },
    loadComponent: () => import('./parent-bulk-create/parent-bulk-create.component').then(m => m.ParentBulkCreateComponent)
  }
];
