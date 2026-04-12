import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const studentsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: '' },
    loadComponent: () => import('./student-list/student-list.component').then(m => m.StudentListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'STUDENTS.CREATE' },
    loadComponent: () => import('./student-form/student-form.component').then(m => m.StudentFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'STUDENTS.EDIT' },
    loadComponent: () => import('./student-form/student-form.component').then(m => m.StudentFormComponent)
  },
  {
    path: 'view/:id',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'STUDENTS.VIEW' },
    loadComponent: () => import('./student-view/student-view.component').then(m => m.StudentViewComponent)
  }
];
