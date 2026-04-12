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
import { Class } from '../../../../core/models/class.model';
import { AcademicYear } from '../../../../core/models/academic-year.model';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../../shared/components/dynamic-form/dynamic-form.models';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../../shared/utils/audit.util';
import { HasUnsavedChanges } from '../../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-class-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './class-form.component.html',
  styleUrl: './class-form.component.scss',
  providers: [MessageService]
})
export class ClassFormComponent implements OnInit, HasUnsavedChanges {
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
      { key: 'name', label: 'SETUP.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
      { key: 'displayOrder', label: 'SETUP.DISPLAY_ORDER', type: 'number', required: true, min: 1, colSpan: 1, order: 2, defaultValue: 1 }
    ],
    columns: 2,
    submitLabel: 'COMMON.SAVE',
    cancelLabel: 'COMMON.CANCEL'
  };

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editingId;
    this.pageTitle = this.isEditMode ? this.translate.instant('SETUP.EDIT_CLASS') : this.translate.instant('SETUP.CREATE_CLASS');
    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<Class>('classes', this.editingId);
      if (item) {
        this.initialValues = { name: item.name, displayOrder: item.displayOrder };
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    const years = this.storage.get<AcademicYear>('academic_years');
    const activeYear = years.find(y => y.isActive);

    if (this.isEditMode && this.editingId) {
      this.storage.update<Class>('classes', this.editingId, { name: val.name, displayOrder: val.displayOrder, ...getAuditFieldsForUpdate(this.authService) });
    } else {
      if (!activeYear) {
        this.messageService.add({ severity: 'error', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('SETUP.DEPENDENCY_ACADEMIC_YEAR'), life: 4000 });
        return;
      }
      const newItem: Class = {
        id: 'cls-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        academicYearId: activeYear.id,
        displayOrder: val.displayOrder,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('classes', newItem);
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
    this.router.navigate([`/${slug}/setup/classes`]);
  }
}
