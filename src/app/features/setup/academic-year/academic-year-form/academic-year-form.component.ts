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
import { AcademicYear } from '../../../../core/models/academic-year.model';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../../shared/components/dynamic-form/dynamic-form.models';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../../shared/utils/audit.util';
import { HasUnsavedChanges } from '../../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-academic-year-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './academic-year-form.component.html',
  styleUrl: './academic-year-form.component.scss',
  providers: [MessageService]
})
export class AcademicYearFormComponent implements OnInit, HasUnsavedChanges {
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
    fields: [
      { key: 'name', label: 'SETUP.NAME', type: 'text', required: true, colSpan: 2, placeholder: 'e.g. 2025-2026', order: 1 },
      { key: 'startDate', label: 'SETUP.START_DATE', type: 'calendar', required: true, colSpan: 1, order: 2 },
      { key: 'endDate', label: 'SETUP.END_DATE', type: 'calendar', required: true, colSpan: 1, order: 3 },
      { key: 'isActive', label: 'SETUP.ACTIVE', type: 'toggle', defaultValue: false, colSpan: 2, order: 4 }
    ],
    columns: 2,
    submitLabel: 'COMMON.SAVE',
    cancelLabel: 'COMMON.CANCEL'
  };

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editingId;
    this.pageTitle = this.isEditMode ? this.translate.instant('SETUP.EDIT_ACADEMIC_YEAR') : this.translate.instant('SETUP.CREATE_ACADEMIC_YEAR');
    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<AcademicYear>('academic_years', this.editingId);
      if (item) {
        this.initialValues = {
          name: item.name,
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
          isActive: item.isActive
        };
      }
    }
  }

  private formatDate(d: Date | string): string {
    if (!d) return '';
    const date = d instanceof Date ? d : new Date(d);
    return date.toISOString().split('T')[0];
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    let years = this.storage.get<AcademicYear>('academic_years');

    if (val.isActive) {
      years = years.map(y => ({ ...y, isActive: false }));
    }

    if (this.isEditMode && this.editingId) {
      years = years.map(y => y.id === this.editingId ? {
        ...y, name: val.name, startDate: this.formatDate(val.startDate), endDate: this.formatDate(val.endDate), isActive: val.isActive,
        ...getAuditFieldsForUpdate(this.authService)
      } : y);
    } else {
      const newItem: AcademicYear = {
        id: 'ay-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        startDate: this.formatDate(val.startDate),
        endDate: this.formatDate(val.endDate),
        isActive: val.isActive,
        ...getAuditFieldsForCreate(this.authService)
      };
      years.push(newItem);
    }
    this.storage.set('academic_years', years);
    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
    setTimeout(() => this.goBack(), 1000);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void {
    this.goBack();
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/academic-years`]);
  }
}
