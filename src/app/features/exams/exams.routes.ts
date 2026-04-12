import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { firstLoginGuard } from '../../core/guards/first-login.guard';
import { roleGuard } from '../../core/guards/role.guard';
import { unsavedChangesGuard } from '../../core/guards/unsaved-changes.guard';

export const examsRoutes: Routes = [
  {
    path: '',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: '' },
    loadComponent: () => import('./exam-list/exam-list.component').then(m => m.ExamListComponent)
  },
  {
    path: 'create',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'EXAMS.CREATE' },
    loadComponent: () => import('./exam-form/exam-form.component').then(m => m.ExamFormComponent)
  },
  {
    path: 'edit/:id',
    canActivate: [authGuard, firstLoginGuard, roleGuard],
    canDeactivate: [unsavedChangesGuard],
    data: { requiredRole: ['ADMIN'], breadcrumb: 'EXAMS.EDIT' },
    loadComponent: () => import('./exam-form/exam-form.component').then(m => m.ExamFormComponent)
  },
  {
    path: 'report-card/:studentId',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'EXAMS.REPORT_CARD' },
    loadComponent: () => import('./report-card/report-card.component').then(m => m.ReportCardComponent)
  },
  {
    path: ':examId/marks',
    canActivate: [authGuard, firstLoginGuard],
    data: { requiredRole: ['ADMIN', 'TEACHER'], breadcrumb: 'EXAMS.MARKS_ENTRY' },
    loadComponent: () => import('./marks-entry/marks-entry.component').then(m => m.MarksEntryComponent)
  }
];
