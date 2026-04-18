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
import { AcademicYear } from '../../../../core/models/academic-year.model';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { TableConfig, TableLazyLoadEvent } from '../../../../shared/components/data-table/data-table.models';
import { ServerTableService } from '../../../../core/services/server-table.service';

@Component({
  selector: 'app-academic-year-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent],
  templateUrl: './academic-year-list.component.html',
  styleUrl: './academic-year-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class AcademicYearListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private serverTable = inject(ServerTableService);

  data: AcademicYear[] = [];
  totalRecords = 0;
  loading = false;
  tableState: TableLazyLoadEvent = { page: 0, rows: 10, first: 0, columnFilters: {} };

  tableConfig: TableConfig = {
    columns: [
      { field: 'name', header: 'SETUP.NAME', sortable: true, filterable: true, filterType: 'text' },
      { field: 'startDate', header: 'SETUP.START_DATE', sortable: true, type: 'date' },
      { field: 'endDate', header: 'SETUP.END_DATE', sortable: true, type: 'date' },
      {
        field: 'isActive', header: 'SETUP.STATUS', sortable: true, type: 'badge',
        filterable: true, filterType: 'boolean',
        badgeMap: {
          'true': { label: 'Active', severity: 'success' },
          'false': { label: 'Inactive', severity: 'secondary' }
        }
      },
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
    this.loadData(this.tableState);
  }

  loadData(request: TableLazyLoadEvent): void {
    const rows = this.storage.get<AcademicYear>('academic_years');
    const result = this.serverTable.query(rows, request, {
      globalSearchFields: ['name'],
      customFilters: {
        isActive: (row, value) => row.isActive === value
      }
    });
    this.data = result.data;
    this.totalRecords = result.totalRecords;
  }

  onLazyLoad(event: TableLazyLoadEvent): void {
    this.tableState = event;
    this.loadData(event);
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/academic-years/create`]);
  }

  onEdit(row: AcademicYear): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/academic-years/edit/${row.id}`]);
  }

  onDelete(row: AcademicYear): void {
    if (row.isActive) {
      this.messageService.add({ severity: 'error', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('SETUP.ERROR_DELETE_ACTIVE_YEAR'), life: 4000 });
      return;
    }
    this.confirmationService.confirm({
      message: `${this.translate.instant('SETUP.CONFIRM_DELETE')} "${row.name}"?`,
      accept: () => {
        this.storage.delete('academic_years', row.id);
        this.loadData(this.tableState);
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('SETUP.DELETED_SUCCESSFULLY'), life: 3000 });
      }
    });
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup`]);
  }
}
