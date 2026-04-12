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
import { SchoolEvent } from '../../../core/models/event.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';

@Component({
  selector: 'app-event-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent],
  templateUrl: './event-form.component.html',
  styleUrl: './event-form.component.scss',
  providers: [MessageService]
})
export class EventFormComponent implements OnInit, HasUnsavedChanges {
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
      ? this.translate.instant('EVENTS.EDIT')
      : this.translate.instant('EVENTS.CREATE');

    this.formConfig = {
      fields: [
        { key: 'title', label: 'EVENTS.EVENT_TITLE', type: 'text', required: true, colSpan: 2, order: 1 },
        { key: 'type', label: 'EVENTS.TYPE', type: 'dropdown', required: true, colSpan: 1, order: 2,
          options: [
            { label: this.translate.instant('EVENTS.HOLIDAY'), value: 'holiday' },
            { label: this.translate.instant('EVENTS.EXAM'), value: 'exam' },
            { label: this.translate.instant('EVENTS.EVENT'), value: 'event' }
          ]
        },
        { key: 'forRoles', label: 'EVENTS.FOR_ROLES', type: 'multiSelect', required: true, colSpan: 1, order: 3,
          options: [
            { label: 'Admin', value: 'ADMIN' },
            { label: 'Teacher', value: 'TEACHER' },
            { label: 'Student', value: 'STUDENT' }
          ]
        },
        { key: 'startDate', label: 'EVENTS.START_DATE', type: 'calendar', required: true, colSpan: 1, order: 4 },
        { key: 'endDate', label: 'EVENTS.END_DATE', type: 'calendar', required: true, colSpan: 1, order: 5 },
        { key: 'description', label: 'EVENTS.DESCRIPTION', type: 'textarea', colSpan: 2, order: 6, rows: 3 }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<SchoolEvent>('events', this.editingId);
      if (item) {
        this.initialValues = {
          title: item.title,
          type: item.type,
          forRoles: item.forRoles,
          startDate: item.startDate ? new Date(item.startDate) : null,
          endDate: item.endDate ? new Date(item.endDate) : null,
          description: item.description
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
      this.storage.update<SchoolEvent>('events', this.editingId, {
        title: val.title, type: val.type, forRoles: val.forRoles ?? [],
        startDate, endDate, description: val.description ?? '',
        ...getAuditFieldsForUpdate(this.authService)
      });
    } else {
      const newItem: SchoolEvent = {
        id: 'evt-' + Date.now().toString(36),
        tenantId,
        title: val.title,
        type: val.type,
        forRoles: val.forRoles ?? [],
        startDate,
        endDate,
        description: val.description ?? '',
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('events', newItem);
    }
    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('EVENTS.SAVED'), life: 3000 });
    setTimeout(() => this.goBack(), 1000);
  }

  onFormChange(_values: any): void {
    this.formDirty = true;
  }

  onCancel(): void { this.goBack(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/events`]);
  }
}
