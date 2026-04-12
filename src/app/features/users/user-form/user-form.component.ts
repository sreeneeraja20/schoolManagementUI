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
import { User } from '../../../core/models/user.model';
import { Staff } from '../../../core/models/staff.model';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
  providers: [MessageService]
})
export class UserFormComponent implements OnInit, HasUnsavedChanges {
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
      ? this.translate.instant('USERS.EDIT')
      : this.translate.instant('USERS.CREATE');

    const allUsers = this.storage.get<User>('users');
    const allStaff = this.storage.get<Staff>('staff');

    // Staff already linked to another user (exclude current user in edit mode)
    const linkedStaffIds = allUsers
      .filter(u => u.staffId && (this.isEditMode ? u.id !== this.editingId : true))
      .map(u => u.staffId);

    const staffOptions = [
      { label: this.translate.instant('USERS.NOT_LINKED'), value: '' },
      ...allStaff
        .filter(s => !linkedStaffIds.includes(s.id))
        .map(s => ({ label: s.name, value: s.id }))
    ];

    this.formConfig = {
      fields: [
        { key: 'name', label: 'USERS.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
        { key: 'email', label: 'USERS.EMAIL', type: 'email', required: true, colSpan: 1, order: 2, disabled: this.isEditMode },
        { key: 'role', label: 'USERS.ROLE', type: 'dropdown', required: true, colSpan: 1, order: 3,
          options: [{ label: 'Admin', value: 'ADMIN' }, { label: 'Teacher', value: 'TEACHER' }]
        },
        { key: 'staffId', label: 'USERS.LINKED_STAFF', type: 'dropdown', required: false, colSpan: 1, order: 4, options: staffOptions },
        { key: 'password', label: 'USERS.PASSWORD', type: 'password', required: !this.isEditMode, colSpan: 1, order: 5,
          hint: this.isEditMode ? this.translate.instant('USERS.PASSWORD_HINT') : undefined
        },
        { key: 'isFirstLogin', label: 'USERS.IS_FIRST_LOGIN', type: 'toggle', defaultValue: true, colSpan: 1, order: 6 },
        { key: 'isActive', label: 'USERS.ACTIVE', type: 'toggle', defaultValue: true, colSpan: 1, order: 7 }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<User>('users', this.editingId);
      if (item) {
        this.initialValues = {
          name: item.name,
          email: item.email,
          role: item.role,
          staffId: item.staffId ?? '',
          password: '',
          isFirstLogin: item.isFirstLogin,
          isActive: item.isActive
        };
      }
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    const allUsers = this.storage.get<User>('users');

    // Validate unique email per tenant (exclude self in edit mode)
    const emailExists = allUsers.some(u =>
      u.email === val.email &&
      u.tenantId === tenantId &&
      (this.isEditMode ? u.id !== this.editingId : true)
    );
    if (emailExists) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('USERS.EMAIL_EXISTS'), life: 4000 });
      return;
    }

    if (this.isEditMode && this.editingId) {
      const updates: Partial<User> = {
        name: val.name,
        role: val.role,
        staffId: val.staffId ?? '',
        isFirstLogin: val.isFirstLogin ?? false,
        isActive: val.isActive ?? true,
        ...getAuditFieldsForUpdate(this.authService)
      };
      // Only update password if provided
      if (val.password && val.password.trim()) {
        updates.password = val.password;
      }
      this.storage.update<User>('users', this.editingId, updates);
    } else {
      // NOTE: Password is stored as plain text in localStorage (mock phase only).
      // In production, passwords must be hashed using bcrypt or similar.
      const newUser: User = {
        id: 'user-' + Date.now(),
        tenantId,
        email: val.email,
        password: val.password,
        role: val.role,
        name: val.name,
        staffId: val.staffId ?? '',
        isFirstLogin: val.isFirstLogin ?? true,
        isActive: val.isActive ?? true,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add<User>('users', newUser);
    }

    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('USERS.SAVED'), life: 3000 });
    setTimeout(() => this.goBack(), 1500);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void {
    this.goBack();
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/users`]);
  }
}
