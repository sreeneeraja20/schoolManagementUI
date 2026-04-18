import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SeedDataService } from '../../../core/services/seed-data.service';
import { SetupBannerComponent } from '../../../shared/components/setup-banner/setup-banner.component';
import { Section } from '../../../core/models/section.model';
import { Class } from '../../../core/models/class.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { TableLazyLoadEvent } from '../../../shared/components/data-table/data-table.models';

@Component({
  selector: 'app-section',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule, TranslateModule,
    TableModule, ButtonModule, DialogModule, InputTextModule, InputNumberModule,
    DropdownModule, ToastModule, ConfirmDialogModule, SetupBannerComponent
  ],
  templateUrl: './section.component.html',
  styleUrl: './section.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class SectionComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  classes = signal<Class[]>([]);
  displayedSections = signal<Section[]>([]);
  selectedClassFilter: string | null = null;
  dialogVisible = false;
  isEditMode = signal(false);
  editingId = signal<string | null>(null);
  form!: FormGroup;
  loading = false;
  totalRecords = 0;
  tableState: TableLazyLoadEvent = { page: 0, rows: 10, first: 0, columnFilters: {} };

  classOptions: { label: string; value: string }[] = [];
  classFilterOptions: { label: string; value: string | null }[] = [];

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
    this.classFilterOptions = [{ label: this.translate.instant('SETUP.ALL_CLASSES'), value: null }, ...this.classOptions];
    this.applyFilter();
  }

  private initForm(): void {
    this.form = this.fb.group({
      name: ['', Validators.required],
      classId: [null, Validators.required],
      maxStudents: [40]
    });
  }

  applyFilter(): void {
    this.applyTableQuery();
  }

  private applyTableQuery(): void {
    const request: TableLazyLoadEvent = {
      ...this.tableState,
      columnFilters: {
        ...this.tableState.columnFilters,
        ...(this.selectedClassFilter ? { classId: this.selectedClassFilter } : {})
      }
    };
    const result = this.storage.getPage<Section>('sections', request, {
      globalSearchPredicate: (row, searchText) => {
        const className = this.getClassName(row.classId).toLowerCase();
        return row.name.toLowerCase().includes(searchText) || className.includes(searchText);
      },
      customFilters: {
        classId: (row, value) => row.classId === value
      }
    });
    this.displayedSections.set(result.data);
    this.totalRecords = result.totalRecords;
  }

  onGlobalSearch(value: string): void {
    this.tableState = { ...this.tableState, globalSearch: value, first: 0, page: 0 };
    this.applyTableQuery();
  }

  onLazyLoad(event: any): void {
    const safeRows = Math.max(1, event.rows ?? this.tableState.rows ?? 10);
    this.tableState = {
      ...this.tableState,
      page: Math.floor((event.first ?? 0) / safeRows),
      rows: safeRows,
      first: event.first ?? this.tableState.first,
      sortField: event.sortField ?? this.tableState.sortField,
      sortOrder: event.sortOrder === -1 ? 'desc' : event.sortOrder === 1 ? 'asc' : this.tableState.sortOrder
    };
    this.applyTableQuery();
  }

  onClassFilterChange(classId: string | null): void {
    this.selectedClassFilter = classId;
    this.applyFilter();
  }

  getClassName(classId: string): string {
    return this.classes().find(c => c.id === classId)?.name ?? classId;
  }

  openAddDialog(): void {
    this.isEditMode.set(false);
    this.editingId.set(null);
    this.form.reset({ maxStudents: 40 });
    this.dialogVisible = true;
  }

  openEditDialog(item: Section): void {
    this.isEditMode.set(true);
    this.editingId.set(item.id);
    this.form.patchValue({ name: item.name, classId: item.classId, maxStudents: item.maxStudents ?? 40 });
    this.dialogVisible = true;
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const val = this.form.value;
    const tenantId = this.tenantService.getTenantId();

    if (this.isEditMode()) {
      this.storage.update<Section>('sections', this.editingId()!, { name: val.name, classId: val.classId, maxStudents: val.maxStudents });
    } else {
      const newItem: Section = {
        id: 'sec-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        classId: val.classId,
        classTeacherId: '',
        maxStudents: val.maxStudents ?? 40
      };
      this.storage.add('sections', newItem);
    }
    this.refreshData();
    this.dialogVisible = false;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.SAVED_SUCCESSFULLY'), life: 3000 });
  }

  confirmDelete(item: Section): void {
    this.confirmationService.confirm({
      message: `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${item.name}"?`,
      accept: () => {
        this.storage.delete('sections', item.id);
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
