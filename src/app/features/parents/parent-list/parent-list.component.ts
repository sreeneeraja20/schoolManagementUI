import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ParentService } from '../parent.service';
import { ParentAccount } from '../../../core/models/parent.model';
import { Student } from '../../../core/models/student.model';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ExportService } from '../../../shared/utils/export.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableConfig, TableFilterEvent } from '../../../shared/components/data-table/data-table.models';

@Component({
  selector: 'app-parent-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DialogModule, DataTableComponent],
  templateUrl: './parent-list.component.html',
  styleUrl: './parent-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ParentListComponent implements OnInit {
  private parentService = inject(ParentService);
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);
  private exportService = inject(ExportService);

  allData: any[] = [];
  data: any[] = [];
  loading = false;

  showPasswordDialog = false;
  newPassword = '';
  resetParentName = '';

  tableConfig: TableConfig = {
    columns: [
      { field: 'name', header: 'PARENTS.NAME', sortable: true, filterable: true, filterType: 'text' },
      { field: 'email', header: 'PARENTS.EMAIL', sortable: true },
      { field: 'phone', header: 'PARENTS.PHONE' },
      { field: 'relation', header: 'PARENTS.RELATION' },
      { field: 'childrenNames', header: 'PARENTS.LINKED_CHILDREN' },
      {
        field: 'isActive', header: 'PARENTS.STATUS', type: 'badge',
        badgeMap: {
          'true': { label: 'Active', severity: 'success' },
          'false': { label: 'Inactive', severity: 'danger' }
        }
      },
      {
        field: 'loginStatus', header: 'PARENTS.LOGIN_DETAILS', type: 'badge',
        badgeMap: {
          'active': { label: 'Active', severity: 'success' },
          'never': { label: 'Never Logged In', severity: 'warn' },
          'inactive': { label: 'Inactive', severity: 'danger' }
        }
      },
      { field: 'lastLoginAt', header: 'PARENTS.LAST_LOGIN', type: 'date', dateFormat: 'medium', sortable: true }
    ],
    globalSearch: true,
    paginator: true,
    rowsPerPage: [10, 25, 50],
    defaultRows: 10,
    showAddButton: true,
    addButtonLabel: 'PARENTS.ADD',
    actions: ['view', 'edit', 'delete', 'resetPassword', 'toggleActive']
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const parents = this.parentService.getAll();
    const students = this.storage.get<Student>('students');

    this.allData = parents.map(p => {
      const childNames = p.studentIds
        .map(sid => students.find(s => s.id === sid)?.name ?? '')
        .filter(n => n)
        .join(', ');

      let loginStatus: string;
      if (!p.isActive) {
        loginStatus = 'inactive';
      } else if (!p.lastLoginAt) {
        loginStatus = 'never';
      } else {
        loginStatus = 'active';
      }

      return { ...p, childrenNames: childNames, loginStatus };
    });

    this.data = [...this.allData];
    this.loading = false;
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents/create`]);
  }

  onBulkCreate(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents/bulk-create`]);
  }

  onView(row: ParentAccount): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents/view/${row.id}`]);
  }

  onEdit(row: ParentAccount): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents/edit/${row.id}`]);
  }

  onDelete(row: ParentAccount): void {
    this.confirmationService.confirm({
      message: this.translate.instant('PARENTS.CONFIRM_DELETE'),
      accept: () => {
        this.parentService.delete(row.id);
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: this.translate.instant('PARENTS.DELETED_SUCCESS'),
          life: 3000
        });
      }
    });
  }

  onResetPassword(row: ParentAccount): void {
    this.confirmationService.confirm({
      message: this.translate.instant('PARENTS.RESET_PASSWORD_CONFIRM'),
      accept: () => {
        const newPwd = this.parentService.resetPassword(row.id);
        this.loadData();
        this.newPassword = newPwd;
        this.resetParentName = row.name;
        this.showPasswordDialog = true;
      }
    });
  }

  onToggleActive(row: ParentAccount): void {
    const action = row.isActive
      ? this.translate.instant('PARENTS.DEACTIVATE')
      : this.translate.instant('PARENTS.ACTIVATE');
    this.confirmationService.confirm({
      message: `${action} this parent account?`,
      accept: () => {
        this.parentService.toggleActive(row.id);
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: row.isActive
            ? this.translate.instant('PARENTS.INACTIVE')
            : this.translate.instant('PARENTS.ACTIVE'),
          life: 3000
        });
      }
    });
  }

  onFilter(event: TableFilterEvent): void {
    let filtered = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.phone?.toLowerCase().includes(q) ||
        r.relation?.toLowerCase().includes(q) ||
        r.childrenNames?.toLowerCase().includes(q)
      );
    }
    if (event.columnFilters) {
      Object.entries(event.columnFilters).forEach(([field, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          filtered = filtered.filter(r => String(r[field]).toLowerCase().includes(String(value).toLowerCase()));
        }
      });
    }
    this.data = filtered;
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.newPassword).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: this.translate.instant('SETUP.SUCCESS'),
        detail: this.translate.instant('PARENTS.COPIED'),
        life: 2000
      });
    });
  }

  downloadCsv(): void {
    const headers = [
      { field: 'name', label: 'Parent Name' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'relation', label: 'Relation' },
      { field: 'childrenNames', label: 'Children' },
      { field: 'isActive', label: 'Active' },
      { field: 'loginStatus', label: 'Login Status' },
      { field: 'lastLoginAt', label: 'Last Login' }
    ];
    this.exportService.downloadCsv(this.data, headers, 'parent-accounts');
  }
}
