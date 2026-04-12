import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const setupRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: '' },
    loadComponent: () => import('./setup.component').then(m => m.SetupComponent)
  },
  {
    path: 'academic-years',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.ACADEMIC_YEARS' },
    loadComponent: () => import('./academic-year/academic-year-list/academic-year-list.component').then(m => m.AcademicYearListComponent)
  },
  {
    path: 'academic-years/create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.CREATE_ACADEMIC_YEAR' },
    loadComponent: () => import('./academic-year/academic-year-form/academic-year-form.component').then(m => m.AcademicYearFormComponent)
  },
  {
    path: 'academic-years/edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.EDIT_ACADEMIC_YEAR' },
    loadComponent: () => import('./academic-year/academic-year-form/academic-year-form.component').then(m => m.AcademicYearFormComponent)
  },
  {
    path: 'classes',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.CLASSES' },
    loadComponent: () => import('./class/class-list/class-list.component').then(m => m.ClassListComponent)
  },
  {
    path: 'classes/create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.CREATE_CLASS' },
    loadComponent: () => import('./class/class-form/class-form.component').then(m => m.ClassFormComponent)
  },
  {
    path: 'classes/edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.EDIT_CLASS' },
    loadComponent: () => import('./class/class-form/class-form.component').then(m => m.ClassFormComponent)
  },
  {
    path: 'sections',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.SECTIONS' },
    loadComponent: () => import('./section/section-list/section-list.component').then(m => m.SectionListComponent)
  },
  {
    path: 'sections/create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.CREATE_SECTION' },
    loadComponent: () => import('./section/section-form/section-form.component').then(m => m.SectionFormComponent)
  },
  {
    path: 'sections/edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.EDIT_SECTION' },
    loadComponent: () => import('./section/section-form/section-form.component').then(m => m.SectionFormComponent)
  },
  {
    path: 'subjects',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.SUBJECTS' },
    loadComponent: () => import('./subject/subject-list/subject-list.component').then(m => m.SubjectListComponent)
  },
  {
    path: 'subjects/create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.CREATE_SUBJECT' },
    loadComponent: () => import('./subject/subject-form/subject-form.component').then(m => m.SubjectFormComponent)
  },
  {
    path: 'subjects/edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'SETUP.EDIT_SUBJECT' },
    loadComponent: () => import('./subject/subject-form/subject-form.component').then(m => m.SubjectFormComponent)
  }
];
