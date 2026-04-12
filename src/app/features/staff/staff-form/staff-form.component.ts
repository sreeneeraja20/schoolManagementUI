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
import { Staff } from '../../../core/models/staff.model';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';
import { Subject } from '../../../core/models/subject.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-staff-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent, ImageUploadComponent],
  templateUrl: './staff-form.component.html',
  styleUrl: './staff-form.component.scss',
  providers: [MessageService]
})
export class StaffFormComponent implements OnInit, HasUnsavedChanges {
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
  photoUrl: string = '';

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
      ? this.translate.instant('STAFF.EDIT')
      : this.translate.instant('STAFF.CREATE');

    const subjects = this.storage.get<Subject>('subjects');
    const subjectOptions = subjects.map(s => ({ label: s.name, value: s.id }));

    this.formConfig = {
      fields: [
        { key: 'name', label: 'STAFF.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
        { key: 'email', label: 'STAFF.EMAIL', type: 'email', required: true, colSpan: 1, order: 2 },
        { key: 'phone', label: 'STAFF.PHONE', type: 'text', required: true, colSpan: 1, order: 3 },
        { key: 'role', label: 'STAFF.ROLE', type: 'dropdown', required: true, colSpan: 1, order: 4,
          options: [{ label: 'Admin', value: 'ADMIN' }, { label: 'Teacher', value: 'TEACHER' }]
        },
        { key: 'qualification', label: 'STAFF.QUALIFICATION', type: 'text', colSpan: 1, order: 5 },
        { key: 'joiningDate', label: 'STAFF.JOINING_DATE', type: 'calendar', required: true, colSpan: 1, order: 6 },
        { key: 'subjectIds', label: 'STAFF.SUBJECTS', type: 'multiSelect', colSpan: 1, order: 7, options: subjectOptions }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<Staff>('staff', this.editingId);
      if (item) {
        this.initialValues = {
          name: item.name,
          email: item.email,
          phone: item.phone,
          role: item.role,
          qualification: item.qualification,
          joiningDate: item.joiningDate ? new Date(item.joiningDate) : null,
          subjectIds: item.subjectIds ?? []
        };
        this.photoUrl = item.photoUrl ?? '';
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    const joiningDate = val.joiningDate instanceof Date
      ? val.joiningDate.toISOString().split('T')[0]
      : val.joiningDate;

    if (this.isEditMode && this.editingId) {
      this.storage.update<Staff>('staff', this.editingId, {
        name: val.name, email: val.email, phone: val.phone, role: val.role,
        qualification: val.qualification, joiningDate, subjectIds: val.subjectIds ?? [],
        photoUrl: this.photoUrl,
        ...getAuditFieldsForUpdate(this.authService)
      });
    } else {
      const newItem: Staff = {
        id: 'stf-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        email: val.email,
        phone: val.phone,
        role: val.role,
        qualification: val.qualification,
        joiningDate,
        subjectIds: val.subjectIds ?? [],
        photoUrl: this.photoUrl,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('staff', newItem);
    }
    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('STAFF.SAVED'), life: 3000 });
    setTimeout(() => this.goBack(), 1000);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void { this.goBack(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff`]);
  }
}
