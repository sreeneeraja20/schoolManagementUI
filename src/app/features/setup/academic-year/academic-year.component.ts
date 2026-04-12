import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { CheckboxModule } from 'primeng/checkbox';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AcademicYear } from '../../../core/models/academic-year.model';

@Component({
  selector: 'app-academic-year',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule,
    TableModule, ButtonModule, DialogModule, InputTextModule,
    CalendarModule, CheckboxModule, TagModule, ToastModule, ConfirmDialogModule, TooltipModule
  ],
  templateUrl: './academic-year.component.html',
  styleUrl: './academic-year.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class AcademicYearComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  academicYears = signal<AcademicYear[]>([]);
  dialogVisible = false;
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  form!: FormGroup;
  loading = false;

  ngOnInit(): void {
    this.initForm();
    this.refreshData();
  }

  private refreshData(): void {
    this.loading = true;
    setTimeout(() => {
      this.loadData();
      this.loading = false;
    }, 650);
  }

  private loadData(): void {
    this.academicYears.set(this.storage.get<AcademicYear>('academic_years'));
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      startDate: [null, Validators.required],
      endDate: [null, Validators.required],
      isActive: [false]
    }, { validators: this.dateRangeValidator });
  }

  private dateRangeValidator(group: FormGroup) {
    const start = group.get('startDate')?.value;
    const end = group.get('endDate')?.value;
    if (start && end && new Date(end) <= new Date(start)) {
      return { dateRange: true };
    }
    return null;
  }

  openAddDialog(): void {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.form.reset({ isActive: false });
    this.dialogVisible = true;
  }

  openEditDialog(item: AcademicYear): void {
    this.isEditMode.set(true);
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      startDate: new Date(item.startDate),
      endDate: new Date(item.endDate),
      isActive: item.isActive
    });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const val = this.form.value;
    const tenantId = this.tenantService.getTenantId();
    let years = this.storage.get<AcademicYear>('academic_years');

    if (val.isActive) {
      years = years.map(y => ({ ...y, isActive: false }));
    }

    if (this.isEditMode()) {
      const id = this.editingId()!;
      years = years.map(y => y.id === id ? {
        ...y,
        name: val.name,
        startDate: this.formatDate(val.startDate),
        endDate: this.formatDate(val.endDate),
        isActive: val.isActive
      } : y);
    } else {
      const newItem: AcademicYear = {
        id: this.generateId(),
        tenantId,
        name: val.name,
        startDate: this.formatDate(val.startDate),
        endDate: this.formatDate(val.endDate),
        isActive: val.isActive
      };
      years.push(newItem);
    }

    this.storage.set('academic_years', years);
    this.refreshData();
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
  }

  confirmDelete(item: AcademicYear): void {
    if (item.isActive) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('SETUP.ERROR_DELETE_ACTIVE_YEAR'), life: 4000 });
      return;
    }
    this.confirmationService.confirm({
      message: `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${item.name}"?`,
      accept: () => {
        this.storage.delete('academic_years', item.id);
        this.refreshData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.DELETED_SUCCESSFULLY'), life: 3000 });
      }
    });
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  }

  private generateId(): string {
    return 'ay-' + Date.now().toString(36);
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup`]);
  }
}
