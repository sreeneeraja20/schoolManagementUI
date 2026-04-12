import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { Exam, ExamSubject } from '../../../core/models/exam.model';
import { Class } from '../../../core/models/class.model';
import { Subject } from '../../../core/models/subject.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';

@Component({
  selector: 'app-exam-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './exam-form.component.html',
  styleUrl: './exam-form.component.scss',
  providers: [MessageService]
})
export class ExamFormComponent implements OnInit, HasUnsavedChanges {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  isEditMode = false;
  editingId: string | null = null;
  initialValues?: Record<string, any>;
  pageTitle = '';
  formConfig!: DynamicFormConfig;

  private formDirty = false;
  private formSubmitted = false;

  hasUnsavedChanges(): boolean {
    return this.formDirty && !this.formSubmitted;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editingId;
    this.pageTitle = this.isEditMode
      ? this.translate.instant('EXAMS.EDIT')
      : this.translate.instant('EXAMS.CREATE');

    const classes = this.storage.get<Class>('classes');
    const activeYear = this.storage.get<AcademicYear>('academic_years').find(y => y.isActive);
    const classOptions = classes
      .filter(c => !activeYear || c.academicYearId === activeYear.id)
      .map(c => ({ label: c.name, value: c.id }));

    this.formConfig = {
      fields: [
        { key: 'name', label: 'EXAMS.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
        {
          key: 'type', label: 'EXAMS.TYPE', type: 'dropdown', required: true, colSpan: 1, order: 2,
          options: [
            { label: this.translate.instant('EXAMS.UNIT_TEST'),   value: 'UNIT_TEST' },
            { label: this.translate.instant('EXAMS.QUARTERLY'),   value: 'QUARTERLY' },
            { label: this.translate.instant('EXAMS.HALF_YEARLY'), value: 'HALF_YEARLY' },
            { label: this.translate.instant('EXAMS.ANNUAL'),      value: 'ANNUAL' }
          ]
        },
        { key: 'classId', label: 'EXAMS.CLASS', type: 'dropdown', required: true, colSpan: 1, order: 3, options: classOptions },
        { key: 'startDate', label: 'EXAMS.START_DATE', type: 'calendar', required: true, colSpan: 1, order: 4 },
        { key: 'endDate',   label: 'EXAMS.END_DATE',   type: 'calendar', required: true, colSpan: 1, order: 5 },
        { key: 'maxMarks',     label: 'EXAMS.MAX_MARKS',     type: 'number', required: true, colSpan: 1, order: 6, min: 1 },
        { key: 'passingMarks', label: 'EXAMS.PASSING_MARKS', type: 'number', required: true, colSpan: 1, order: 7, min: 1 }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<Exam>('exams', this.editingId);
      if (item) {
        this.initialValues = {
          name: item.name,
          type: item.type,
          classId: item.classId,
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate:   item.endDate   ? new Date(item.endDate)   : null,
          maxMarks:     item.maxMarks,
          passingMarks: item.passingMarks
        };
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    const startDate = val.startDate instanceof Date
      ? val.startDate.toISOString().split('T')[0]
      : val.startDate;
    const endDate = val.endDate instanceof Date
      ? val.endDate.toISOString().split('T')[0]
      : val.endDate;

    if (this.isEditMode && this.editingId) {
      this.storage.update<Exam>('exams', this.editingId, {
        name: val.name, type: val.type, classId: val.classId,
        startDate, endDate, maxMarks: val.maxMarks, passingMarks: val.passingMarks,
        ...getAuditFieldsForUpdate(this.authService)
      });
      // Update exam subjects if marks changed
      const examSubjects = this.storage.get<ExamSubject>('exam_subjects').filter(es => es.examId === this.editingId);
      examSubjects.forEach(es => {
        this.storage.update<ExamSubject>('exam_subjects', es.id, {
          maxMarks: val.maxMarks, passingMarks: val.passingMarks,
          ...getAuditFieldsForUpdate(this.authService)
        });
      });
    } else {
      const examId = 'exam-' + Date.now().toString(36);
      const newExam: Exam = {
        id: examId, tenantId,
        name: val.name, type: val.type, classId: val.classId,
        startDate, endDate, maxMarks: val.maxMarks, passingMarks: val.passingMarks,
        isPublished: false,
        academicYearId: this.storage.get<AcademicYear>('academic_years').find(y => y.isActive)?.id ?? '',
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('exams', newExam);

      // Auto-create ExamSubject records
      const subjects = this.storage.get<Subject>('subjects').filter(s => s.classIds.includes(val.classId));
      const examSubjects: ExamSubject[] = subjects.map((s, i) => ({
        id: `es-${examId}-${i}`,
        tenantId, examId,
        subjectId: s.id,
        examDate: startDate,
        maxMarks: val.maxMarks,
        passingMarks: val.passingMarks,
        ...getAuditFieldsForCreate(this.authService)
      }));
      const existing = this.storage.get<ExamSubject>('exam_subjects');
      this.storage.set('exam_subjects', [...existing, ...examSubjects]);
    }

    this.formSubmitted = true;
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('SETUP.SUCCESS'),
      detail: this.translate.instant('EXAMS.SAVED'),
      life: 3000
    });
    setTimeout(() => this.goBack(), 1000);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void { this.goBack(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams`]);
  }
}
