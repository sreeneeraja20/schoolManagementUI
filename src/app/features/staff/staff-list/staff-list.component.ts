import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableConfig, TableFilterEvent } from '../../../shared/components/data-table/data-table.models';
import { Staff } from '../../../core/models/staff.model';
import { Subject } from '../../../core/models/subject.model';
import { CsvImportDialogComponent, CsvImportConfig } from '../../../shared/components/csv-import-dialog/csv-import-dialog.component';
import { ExportService } from '../../../shared/utils/export.service';
import { getAuditFieldsForCreate } from '../../../shared/utils/audit.util';

@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent, CsvImportDialogComponent],
  templateUrl: './staff-list.component.html',
  styleUrl: './staff-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class StaffListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private exportService = inject(ExportService);

  showImportDialog = false;

  importConfig: CsvImportConfig = {
    entityType: 'staff',
    columns: [
      { field: 'name', label: 'Name', required: true },
      { field: 'email', label: 'Email', required: true },
      { field: 'phone', label: 'Phone', required: false },
      { field: 'role', label: 'Role (ADMIN/TEACHER)', required: true },
      { field: 'qualification', label: 'Qualification', required: false },
      { field: 'joiningDate', label: 'Joining Date (YYYY-MM-DD)', required: false },
      { field: 'subjects', label: 'Subjects (semicolon separated)', required: false }
    ],
    exampleRow: 'Jane Smith,jane@school.com,9876543210,TEACHER,B.Ed,2022-06-01,Mathematics;Science',
    templateFilename: 'staff'
  };

  allData: any[] = [];
  data: any[] = [];
  loading = false;
  subjects: Subject[] = [];

  tableConfig: TableConfig = {
    columns: [
      { field: 'name', header: 'STAFF.NAME', sortable: true, filterable: true, filterType: 'text' },
      { field: 'email', header: 'STAFF.EMAIL', filterable: true, filterType: 'text' },
      { field: 'phone', header: 'STAFF.PHONE' },
      { field: 'role', header: 'STAFF.ROLE', filterable: true, filterType: 'dropdown',
        filterOptions: [{ label: 'ADMIN', value: 'ADMIN' }, { label: 'TEACHER', value: 'TEACHER' }],
        type: 'badge',
        badgeMap: {
          'ADMIN': { label: 'Admin', severity: 'danger' },
          'TEACHER': { label: 'Teacher', severity: 'info' }
        }
      },
      { field: 'subjectNames', header: 'STAFF.SUBJECTS', type: 'list' },
      { field: 'qualification', header: 'STAFF.QUALIFICATION' },
      { field: 'joiningDate', header: 'STAFF.JOINING_DATE', type: 'date', sortable: true },
      { field: 'createdBy', header: 'AUDIT.CREATED_BY', sortable: true, width: '120px' },
      { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' },
      { field: 'updatedBy', header: 'AUDIT.UPDATED_BY', sortable: true, width: '120px' },
      { field: 'updatedDate', header: 'AUDIT.UPDATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
    ],
    globalSearch: true,
    paginator: true,
    rowsPerPage: [10, 25, 50],
    defaultRows: 10,
    actions: ['view', 'edit', 'delete'],
    showAddButton: true,
    addButtonLabel: 'STAFF.ADD',
    emptyMessage: 'TABLE.NO_RECORDS'
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.subjects = this.storage.get<Subject>('subjects');
    const staff = this.storage.get<Staff>('staff');
    this.allData = staff.map(s => ({
      ...s,
      subjectNames: (s.subjectIds ?? []).map(id => this.subjects.find(sub => sub.id === id)?.name ?? id)
    }));
    this.data = [...this.allData];
  }

  onFilter(event: TableFilterEvent): void {
    let result = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.role.toLowerCase().includes(q)
      );
    }
    const cf = event.columnFilters;
    if (cf['name']) result = result.filter(r => r.name.toLowerCase().includes(cf['name'].toLowerCase()));
    if (cf['email']) result = result.filter(r => r.email.toLowerCase().includes(cf['email'].toLowerCase()));
    if (cf['role']) result = result.filter(r => r.role === cf['role']);
    this.data = result;
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff/create`]);
  }

  onImportCsv(rows: Record<string, string>[]): void {
    const tenantId = this.tenantService.getTenantId();
    const subjects = this.storage.get<Subject>('subjects');
    let imported = 0;

    for (const row of rows) {
      const subjectIds: string[] = [];
      if (row['subjects']) {
        for (const subName of row['subjects'].split(';').map(s => s.trim()).filter(Boolean)) {
          const sub = subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
          if (sub) subjectIds.push(sub.id);
        }
      }
      const newStaff: Staff = {
        id: 'stf-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
        tenantId,
        name: row['name'],
        email: row['email'],
        phone: row['phone'] ?? '',
        role: row['role'] ?? 'TEACHER',
        qualification: row['qualification'] ?? '',
        joiningDate: row['joiningDate'] ?? '',
        subjectIds,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add<Staff>('staff', newStaff);
      imported++;
    }
    this.loadData();
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('IMPORT.SUCCESS', { count: imported }), life: 4000 });
  }

  onExportCsv(): void {
    const headers = [
      { field: 'name', label: 'Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'role', label: 'Role' },
      { field: 'qualification', label: 'Qualification' },
      { field: 'joiningDate', label: 'Joining Date' },
      { field: 'subjectNames', label: 'Subjects' }
    ];
    this.exportService.downloadCsv(this.data, headers, 'staff');
  }

  onPrint(): void {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Qualification', 'Joining Date', 'Subjects'];
    const rows = this.data.map(r => [
      r.name, r.email, r.phone, r.role, r.qualification, r.joiningDate,
      Array.isArray(r.subjectNames) ? r.subjectNames.join(', ') : ''
    ]);
    this.exportService.printTable('Staff List', headers, rows);
  }

  onView(row: Staff): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff/view/${row.id}`]);
  }

  onEdit(row: Staff): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff/edit/${row.id}`]);
  }

  onDelete(row: Staff): void {
    this.confirmationService.confirm({
      message: this.translate.instant('STAFF.CONFIRM_DELETE'),
      accept: () => {
        this.storage.delete('staff', row.id);
        this.loadData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('STAFF.DELETED'), life: 3000 });
      }
    });
  }
}
