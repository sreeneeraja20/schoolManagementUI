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
import { User } from '../../../core/models/user.model';
import { Staff } from '../../../core/models/staff.model';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableConfig, TableFilterEvent } from '../../../shared/components/data-table/data-table.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent],
  templateUrl: './user-list.component.html',
  styleUrl: './user-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class UserListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  allData: any[] = [];
  data: any[] = [];
  loading = false;

  tableConfig: TableConfig = {
    columns: [
      { field: 'name', header: 'USERS.NAME', sortable: true, filterable: true, filterType: 'text' },
      { field: 'email', header: 'USERS.EMAIL', sortable: true, filterable: true, filterType: 'text' },
      {
        field: 'role', header: 'USERS.ROLE', filterable: true, filterType: 'dropdown',
        filterOptions: [{ label: 'ADMIN', value: 'ADMIN' }, { label: 'TEACHER', value: 'TEACHER' }],
        type: 'badge',
        badgeMap: {
          'ADMIN': { label: 'Admin', severity: 'danger' },
          'TEACHER': { label: 'Teacher', severity: 'info' }
        }
      },
      { field: 'staffName', header: 'USERS.LINKED_STAFF' },
      {
        field: 'isActive', header: 'USERS.STATUS', type: 'badge',
        badgeMap: {
          'true': { label: 'Active', severity: 'success' },
          'false': { label: 'Inactive', severity: 'danger' }
        }
      },
      {
        field: 'isFirstLogin', header: 'USERS.IS_FIRST_LOGIN', type: 'badge',
        badgeMap: {
          'true': { label: 'Yes', severity: 'warn' },
          'false': { label: 'No', severity: 'success' }
        }
      },
      { field: 'lastLogin', header: 'USERS.LAST_LOGIN', type: 'date', dateFormat: 'medium', sortable: true },
      { field: 'createdBy', header: 'AUDIT.CREATED_BY', sortable: true, width: '120px' },
      { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' },
      { field: 'updatedBy', header: 'AUDIT.UPDATED_BY', sortable: true, width: '120px' },
      { field: 'updatedDate', header: 'AUDIT.UPDATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
    ],
    globalSearch: true,
    paginator: true,
    rowsPerPage: [10, 25, 50],
    defaultRows: 10,
    showAddButton: true,
    addButtonLabel: 'USERS.ADD',
    actions: ['edit', 'delete','resetPassword', 'toggleActive']
  };

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    const users = this.storage.get<User>('users');
    const staff = this.storage.get<Staff>('staff');
    this.allData = users.map(u => ({
      ...u,
      isActive: u.isActive,
      isFirstLogin: u.isFirstLogin,
      staffName: staff.find(s => s.id === u.staffId)?.name ?? this.translate.instant('USERS.NOT_LINKED')
    }));
    this.data = [...this.allData];
    this.loading = false;
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/users/create`]);
  }

  onEdit(row: User): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/users/edit/${row.id}`]);
  }

  onDelete(row: User): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id === row.id) {
      this.messageService.add({ severity: 'warn', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('USERS.CANNOT_DELETE_SELF'), life: 4000 });
      return;
    }
    const allUsers = this.storage.get<User>('users');
    const activeAdmins = allUsers.filter(u => u.role === 'ADMIN' && u.isActive && u.id !== row.id);
    if (row.role === 'ADMIN' && activeAdmins.length === 0) {
      this.messageService.add({ severity: 'warn', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('USERS.CANNOT_DELETE_LAST_ADMIN'), life: 4000 });
      return;
    }
    this.confirmationService.confirm({
      message: this.translate.instant('USERS.CONFIRM_DELETE'),
      accept: () => {
        this.storage.delete('users', row.id);
        this.loadData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('USERS.DELETED'), life: 3000 });
      }
    });
  }

  onResetPassword(row: User): void {
    this.confirmationService.confirm({
      message: this.translate.instant('USERS.RESET_CONFIRM'),
      accept: () => {
        const randomBytes = new Uint32Array(1);
        crypto.getRandomValues(randomBytes);
        const suffix = String(randomBytes[0] % 9000 + 1000);
        const tempPassword = 'TempPass@' + suffix;
        this.storage.update<User>('users', row.id, { password: tempPassword, isFirstLogin: true });
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: this.translate.instant('USERS.RESET_SUCCESS', { password: tempPassword }),
          life: 10000
        });
      }
    });
  }

  onToggleActive(row: User): void {
    const currentUser = this.authService.getCurrentUser();
    if (currentUser?.id === row.id) {
      this.messageService.add({ severity: 'warn', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('USERS.CANNOT_DEACTIVATE_SELF'), life: 4000 });
      return;
    }
    if (row.role === 'ADMIN' && row.isActive) {
      const allUsers = this.storage.get<User>('users');
      const activeAdmins = allUsers.filter(u => u.role === 'ADMIN' && u.isActive && u.id !== row.id);
      if (activeAdmins.length === 0) {
        this.messageService.add({ severity: 'warn', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('USERS.CANNOT_DEACTIVATE_LAST_ADMIN'), life: 4000 });
        return;
      }
    }
    const newStatus = !row.isActive;
    this.storage.update<User>('users', row.id, { isActive: newStatus });
    this.loadData();
    const detail = newStatus
      ? this.translate.instant('USERS.ACTIVATED')
      : this.translate.instant('USERS.DEACTIVATED');
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail, life: 3000 });
  }

  onFilter(event: TableFilterEvent): void {
    let filtered = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.role?.toLowerCase().includes(q) ||
        r.staffName?.toLowerCase().includes(q)
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
}
