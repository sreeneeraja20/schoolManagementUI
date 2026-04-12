import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { Validators } from '@angular/forms';
import { ParentService } from '../parent.service';
import { ParentAccount } from '../../../core/models/parent.model';
import { Student } from '../../../core/models/student.model';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-parent-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DialogModule, DynamicFormComponent],
  templateUrl: './parent-form.component.html',
  styleUrl: './parent-form.component.scss',
  providers: [MessageService]
})
export class ParentFormComponent implements OnInit, HasUnsavedChanges {
  private parentService = inject(ParentService);
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

  showCredentialsDialog = false;
  generatedEmail = '';
  generatedPassword = '';

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
      ? this.translate.instant('PARENTS.EDIT')
      : this.translate.instant('PARENTS.CREATE');

    const students = this.storage.get<Student>('students');
    const studentOptions = students.map(s => ({
      label: `${s.name} (${s.rollNumber})`,
      value: s.id
    }));

    this.formConfig = {
      fields: [
        { key: 'name', label: 'PARENTS.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
        {
          key: 'relation', label: 'PARENTS.RELATION', type: 'dropdown', required: true, colSpan: 1, order: 2,
          options: [
            { label: this.translate.instant('PARENTS.FATHER'), value: 'Father' },
            { label: this.translate.instant('PARENTS.MOTHER'), value: 'Mother' },
            { label: this.translate.instant('PARENTS.GUARDIAN'), value: 'Guardian' }
          ]
        },
        { key: 'email', label: 'PARENTS.EMAIL', type: 'email', required: true, colSpan: 1, order: 3, disabled: this.isEditMode },
        {
          key: 'phone', label: 'PARENTS.PHONE', type: 'text', required: true, colSpan: 1, order: 4,
          validators: [Validators.pattern(/^\d{10}$/)],
          hint: '10-digit mobile number'
        },
        {
          key: 'preferredLanguage', label: 'PARENTS.LANGUAGE', type: 'dropdown', required: false, colSpan: 1, order: 5,
          options: [
            { label: 'English', value: 'en' },
            { label: 'Tamil', value: 'ta' }
          ],
          defaultValue: 'en'
        },
        {
          key: 'studentIds', label: 'PARENTS.SELECT_STUDENTS', type: 'multiSelect', required: true, colSpan: 2, order: 6,
          options: studentOptions
        },
        ...(!this.isEditMode ? [
          {
            key: 'passwordMode', label: 'PARENTS.PASSWORD_MODE', type: 'radio' as const, required: true, colSpan: 2 as const, order: 7,
            defaultValue: 'auto',
            options: [
              { label: this.translate.instant('PARENTS.AUTO_GENERATE'), value: 'auto' },
              { label: this.translate.instant('PARENTS.CUSTOM_PASSWORD'), value: 'custom' }
            ]
          },
          {
            key: 'customPassword', label: 'PARENTS.CUSTOM_PASSWORD', type: 'password' as const, required: false, colSpan: 1 as const, order: 8,
            showIf: (val: any) => val?.passwordMode === 'custom'
          }
        ] : [])
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.parentService.getById(this.editingId);
      if (item) {
        this.initialValues = {
          name: item.name,
          relation: item.relation,
          email: item.email,
          phone: item.phone,
          preferredLanguage: item.preferredLanguage,
          studentIds: item.studentIds
        };
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();

    if (this.isEditMode && this.editingId) {
      const updates: Partial<ParentAccount> = {
        name: val.name,
        relation: val.relation,
        phone: val.phone,
        preferredLanguage: val.preferredLanguage ?? 'en',
        studentIds: val.studentIds ?? [],
        ...getAuditFieldsForUpdate(this.authService)
      };
      this.parentService.update(this.editingId, updates);
      this.formSubmitted = true;
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('SETUP.SUCCESS'),
        detail: this.translate.instant('PARENTS.UPDATED_SUCCESS'),
        life: 3000
      });
      setTimeout(() => this.goBack(), 1500);
    } else {
      // Check unique email per tenant
      const existing = this.parentService.getAll().find(p => p.email === val.email);
      if (existing) {
        this.messageService.add({
          severity: 'error',
          summary: this.translate.instant('SETUP.ERROR'),
          detail: this.translate.instant('USERS.EMAIL_EXISTS'),
          life: 4000
        });
        return;
      }

      const password = val.passwordMode === 'custom' && val.customPassword
        ? val.customPassword
        : this.parentService.generatePassword(val.name);

      const newParent: ParentAccount = {
        id: crypto.randomUUID(),
        tenantId,
        name: val.name,
        email: val.email,
        phone: val.phone,
        password,
        relation: val.relation,
        studentIds: val.studentIds ?? [],
        isFirstLogin: true,
        isActive: true,
        loginCount: 0,
        preferredLanguage: val.preferredLanguage ?? 'en',
        notifyAttendance: true,
        notifyEvents: true,
        notifyExams: true,
        ...getAuditFieldsForCreate(this.authService)
      };

      this.parentService.create(newParent);
      this.formSubmitted = true;

      this.generatedEmail = val.email;
      this.generatedPassword = password;
      this.showCredentialsDialog = true;
    }
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void {
    this.goBack();
  }

  copyCredentials(): void {
    const text = `Email: ${this.generatedEmail}\nPassword: ${this.generatedPassword}`;
    navigator.clipboard.writeText(text);
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('SETUP.SUCCESS'),
      detail: this.translate.instant('PARENTS.COPIED'),
      life: 2000
    });
  }

  onCredentialsClose(): void {
    this.showCredentialsDialog = false;
    this.goBack();
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents`]);
  }
}
