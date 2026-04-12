import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { SetupBannerComponent } from '../../../shared/components/setup-banner/setup-banner.component';
import { Subject } from '../../../core/models/subject.model';
import { Class } from '../../../core/models/class.model';
import { AcademicYear } from '../../../core/models/academic-year.model';

@Component({
  selector: 'app-subject',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule,
    TableModule, ButtonModule, DialogModule, InputTextModule, MultiSelectModule,
    ToastModule, ConfirmDialogModule, SetupBannerComponent
  ],
  templateUrl: './subject.component.html',
  styleUrl: './subject.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class SubjectComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  subjects = signal<Subject[]>([]);
  classes = signal<Class[]>([]);
  dialogVisible = false;
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  form!: FormGroup;
  loading = false;

  classOptions: { label: string; value: string }[] = [];

  ngOnInit(): void {
    this.seedService.seed();
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
    const years = this.storage.get<AcademicYear>('academic_years');
    const active = years.find(y => y.isActive);
    const allClasses = this.storage.get<Class>('classes');
    const activeClasses = active ? allClasses.filter(c => c.academicYearId === active.id) : allClasses;
    this.classes.set(activeClasses);
    this.classOptions = activeClasses.map(c => ({ label: c.name, value: c.id }));
    this.subjects.set(this.storage.get<Subject>('subjects'));
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      code: ['', Validators.required],
      classIds: [[], Validators.required]
    });
  }

  getClassNames(classIds: string[]): string {
    if (!classIds || classIds.length === 0) return '-';
    return classIds.map(id => this.classes().find(c => c.id === id)?.name ?? id).join(', ');
  }

  openAddDialog(): void {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.form.reset({ classIds: [] });
    this.dialogVisible = true;
  }

  openEditDialog(item: Subject): void {
    this.isEditMode.set(true);
    this.editingId.set(item.id);
    this.form.patchValue({ name: item.name, code: item.code, classIds: item.classIds ?? [] });
    this.dialogVisible = true;
  }

  onCodeInput(event: Event): void {
    const val = (event.target as HTMLInputElement).value.toUpperCase();
    this.form.get('code')?.setValue(val, { emitEvent: false });
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;
    const tenantId = this.tenantService.getTenantId();

    if (this.isEditMode()) {
      this.storage.update<Subject>('subjects', this.editingId()!, { name: val.name, code: val.code.toUpperCase(), classIds: val.classIds });
    } else {
      const newItem: Subject = {
        id: 'sub-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        code: val.code.toUpperCase(),
        classIds: val.classIds
      };
      this.storage.add('subjects', newItem);
    }
    this.refreshData();
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
  }

  confirmDelete(item: Subject): void {
    this.confirmationService.confirm({
      message: `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${item.name}"?`,
      accept: () => {
        this.storage.delete('subjects', item.id);
        this.refreshData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.DELETED_SUCCESSFULLY'), life: 3000 });
      }
    });
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup`]);
  }
}
