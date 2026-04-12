import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../../core/services/storage.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Section } from '../../../../core/models/section.model';
import { Class } from '../../../../core/models/class.model';
import { AcademicYear } from '../../../../core/models/academic-year.model';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../../shared/components/dynamic-form/dynamic-form.models';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../../shared/utils/audit.util';
import { HasUnsavedChanges } from '../../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-section-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './section-form.component.html',
  styleUrl: './section-form.component.scss',
  providers: [MessageService]
})
export class SectionFormComponent implements OnInit, HasUnsavedChanges {
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

  formConfig: DynamicFormConfig = {
    fields: [],
    columns: 2,
    submitLabel: 'COMMON.SAVE',
    cancelLabel: 'COMMON.CANCEL'
  };

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editingId;
    this.pageTitle = this.isEditMode ? this.translate.instant('SETUP.EDIT_SECTION') : this.translate.instant('SETUP.CREATE_SECTION');

    const years = this.storage.get<AcademicYear>('academic_years');
    const active = years.find(y => y.isActive);
    const allClasses = this.storage.get<Class>('classes');
    const classes = active ? allClasses.filter(c => c.academicYearId === active.id) : allClasses;
    const classOptions = classes.map(c => ({ label: c.name, value: c.id }));

    this.formConfig = {
      fields: [
        { key: 'name', label: 'SETUP.NAME', type: 'text', required: true, colSpan: 1, order: 1 },
        { key: 'classId', label: 'SETUP.CLASS', type: 'dropdown', required: true, options: classOptions, colSpan: 1, order: 2 },
        { key: 'maxStudents', label: 'SETUP.MAX_STUDENTS', type: 'number', defaultValue: 40, min: 1, colSpan: 1, order: 3 }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<Section>('sections', this.editingId);
      if (item) {
        this.initialValues = { name: item.name, classId: item.classId, maxStudents: item.maxStudents ?? 40 };
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    if (this.isEditMode && this.editingId) {
      this.storage.update<Section>('sections', this.editingId, { name: val.name, classId: val.classId, maxStudents: val.maxStudents, ...getAuditFieldsForUpdate(this.authService) });
    } else {
      const newItem: Section = {
        id: 'sec-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        classId: val.classId,
        classTeacherId: '',
        maxStudents: val.maxStudents ?? 40,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('sections', newItem);
    }
    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
    setTimeout(() => this.goBack(), 1000);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void { this.goBack(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/sections`]);
  }
}
