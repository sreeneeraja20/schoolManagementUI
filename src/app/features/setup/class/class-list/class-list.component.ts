import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../../core/services/storage.service';
import { TenantService } from '../../../../core/services/tenant.service';
import { SeedDataService } from '../../../../core/services/seed-data.service';
import { SetupBannerComponent } from '../../../../shared/components/setup-banner/setup-banner.component';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableFilterEvent } from '../../../../shared/components/data-table/data-table.models';
import { Class } from '../../../../core/models/class.model';
import { AcademicYear } from '../../../../core/models/academic-year.model';
import { Section } from '../../../../core/models/section.model';

@Component({
  selector: 'app-class-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent, SetupBannerComponent],
  templateUrl: './class-list.component.html',
  styleUrl: './class-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ClassListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  allData: any[] = [];
  data: any[] = [];
  loading = false;
  hasActiveYear = false;
  sections: Section[] = [];

  tableConfig: TableConfig = {
    columns: [
      { field: 'name', header: 'SETUP.NAME', sortable: true, filterable: true, filterType: 'text' },
      { field: 'displayOrder', header: 'SETUP.DISPLAY_ORDER', sortable: true },
      { field: 'sectionNames', header: 'SETUP.SECTIONS', type: 'list' },
      { field: 'createdBy', header: 'AUDIT.CREATED_BY', sortable: true, width: '120px' },
      { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' },
      { field: 'updatedBy', header: 'AUDIT.UPDATED_BY', sortable: true, width: '120px' },
      { field: 'updatedDate', header: 'AUDIT.UPDATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
    ],
    globalSearch: true,
    paginator: true,
    rowsPerPage: [10, 25, 50],
    defaultRows: 10,
    actions: ['edit', 'delete'],
    showAddButton: true,
    addButtonLabel: 'SETUP.ADD',
    emptyMessage: 'SETUP.NO_DATA'
  };

  ngOnInit(): void {
    this.seedService.seed();
    this.loadData();
  }

  loadData(): void {
    const years = this.storage.get<AcademicYear>('academic_years');
    const active = years.find(y => y.isActive);
    this.hasActiveYear = !!active;
    this.sections = this.storage.get<Section>('sections');
    const allClasses = this.storage.get<Class>('classes');
    const filtered = active ? allClasses.filter(c => c.academicYearId === active.id) : [];
    this.allData = filtered.map(c => ({
      ...c,
      sectionNames: this.sections.filter(s => s.classId === c.id).map(s => s.name)
    }));
    this.data = [...this.allData];
  }

  onFilter(event: TableFilterEvent): void {
    let result = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    if (event.columnFilters['name']) {
      const q = event.columnFilters['name'].toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    this.data = result;
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/classes/create`]);
  }

  onEdit(row: Class): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/classes/edit/${row.id}`]);
  }

  onDelete(row: Class): void {
    const hasSections = this.sections.some(s => s.classId === row.id);
    const cascadeNote = hasSections ? ` ${this.translate.instant('SETUP.CASCADE_DELETE_SECTIONS')}.` : '';
    const msg = `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${row.name}"?${cascadeNote}`;
    this.confirmationService.confirm({
      message: msg,
      accept: () => {
        if (hasSections) {
          const updatedSections = this.storage.get<Section>('sections').filter(s => s.classId !== row.id);
          this.storage.set('sections', updatedSections);
        }
        this.storage.delete('classes', row.id);
        this.loadData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.DELETED_SUCCESSFULLY'), life: 3000 });
      }
    });
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup`]);
  }
}
