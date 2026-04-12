import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { SetupBannerComponent } from '../../../shared/components/setup-banner/setup-banner.component';
import { Class } from '../../../core/models/class.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { Section } from '../../../core/models/section.model';

@Component({
  selector: 'app-class',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, TranslateModule,
    TableModule, ButtonModule, DialogModule, InputTextModule, InputNumberModule,
    ToastModule, ConfirmDialogModule, SetupBannerComponent
  ],
  templateUrl: './class.component.html',
  styleUrl: './class.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ClassComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  classes = signal<Class[]>([]);
  sections = signal<Section[]>([]);
  activeYear = signal<AcademicYear | null>(null);
  dialogVisible = false;
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  form!: FormGroup;
  loading = false;

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
    const active = years.find(y => y.isActive) ?? null;
    this.activeYear.set(active);
    const allClasses = this.storage.get<Class>('classes');
    this.classes.set(active ? allClasses.filter(c => c.academicYearId === active.id) : []);
    this.sections.set(this.storage.get<Section>('sections'));
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      displayOrder: [null, [Validators.required, Validators.min(1)]]
    });
  }

  getSectionsForClass(classId: string): string {
    return this.sections().filter(s => s.classId === classId).map(s => s.name).join(', ') || '-';
  }

  openAddDialog(): void {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.form.reset();
    this.dialogVisible = true;
  }

  openEditDialog(item: Class): void {
    this.isEditMode.set(true);
    this.editingId.set(item.id);
    this.form.patchValue({ name: item.name, displayOrder: item.displayOrder });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;
    const tenantId = this.tenantService.getTenantId();
    const activeYear = this.activeYear();
    if (!activeYear) return;

    if (this.isEditMode()) {
      this.storage.update<Class>('classes', this.editingId()!, { name: val.name, displayOrder: val.displayOrder });
    } else {
      const newItem: Class = {
        id: 'cls-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        academicYearId: activeYear.id,
        displayOrder: val.displayOrder
      };
      this.storage.add('classes', newItem);
    }
    this.refreshData();
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
  }

  confirmDelete(item: Class): void {
    const hasSections = this.sections().some(s => s.classId === item.id);
    const cascadeNote = hasSections ? ` ${this.translate.instant('SETUP.CASCADE_DELETE_SECTIONS')}.` : '';
    const msg = `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${item.name}"?${cascadeNote}`;

    this.confirmationService.confirm({
      message: msg,
      accept: () => {
        if (hasSections) {
          const updatedSections = this.storage.get<Section>('sections').filter(s => s.classId !== item.id);
          this.storage.set('sections', updatedSections);
        }
        this.storage.delete('classes', item.id);
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
