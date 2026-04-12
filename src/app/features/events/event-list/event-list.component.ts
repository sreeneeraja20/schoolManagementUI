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
import { SchoolEvent } from '../../../core/models/event.model';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent],
  templateUrl: './event-list.component.html',
  styleUrl: './event-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class EventListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  allData: SchoolEvent[] = [];
  data: SchoolEvent[] = [];
  loading = false;
  isAdmin = false;

  tableConfig!: TableConfig;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';

    this.tableConfig = {
      columns: [
        { field: 'title', header: 'EVENTS.EVENT_TITLE', sortable: true, filterable: true, filterType: 'text' },
        { field: 'type', header: 'EVENTS.TYPE', filterable: true, filterType: 'dropdown',
          filterOptions: [
            { label: 'Holiday', value: 'holiday' },
            { label: 'Exam', value: 'exam' },
            { label: 'Event', value: 'event' }
          ],
          type: 'badge',
          badgeMap: {
            'holiday': { label: 'Holiday', severity: 'info' },
            'exam': { label: 'Exam', severity: 'warn' },
            'event': { label: 'Event', severity: 'success' }
          }
        },
        { field: 'startDate', header: 'EVENTS.START_DATE', type: 'date', sortable: true },
        { field: 'endDate', header: 'EVENTS.END_DATE', type: 'date' },
        { field: 'forRoles', header: 'EVENTS.FOR_ROLES', type: 'list' },
        { field: 'description', header: 'EVENTS.DESCRIPTION' },
        { field: 'createdBy', header: 'AUDIT.CREATED_BY', sortable: true, width: '120px' },
        { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' },
        { field: 'updatedBy', header: 'AUDIT.UPDATED_BY', sortable: true, width: '120px' },
        { field: 'updatedDate', header: 'AUDIT.UPDATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
      ],
      globalSearch: true,
      paginator: true,
      rowsPerPage: [10, 25, 50],
      defaultRows: 10,
      actions: this.isAdmin ? ['edit', 'delete'] : [],
      showAddButton: this.isAdmin,
      addButtonLabel: 'EVENTS.ADD',
      emptyMessage: 'TABLE.NO_RECORDS'
    };

    this.loadData();
  }

  loadData(): void {
    this.allData = this.storage.get<SchoolEvent>('events');
    this.data = [...this.allData];
  }

  onFilter(event: TableFilterEvent): void {
    let result = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      result = result.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
      );
    }
    const cf = event.columnFilters;
    if (cf['title']) result = result.filter(r => r.title.toLowerCase().includes(cf['title'].toLowerCase()));
    if (cf['type']) result = result.filter(r => r.type === cf['type']);
    this.data = result;
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/events/create`]);
  }

  onEdit(row: SchoolEvent): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/events/edit/${row.id}`]);
  }

  onDelete(row: SchoolEvent): void {
    this.confirmationService.confirm({
      message: this.translate.instant('EVENTS.CONFIRM_DELETE'),
      accept: () => {
        this.storage.delete('events', row.id);
        this.loadData();
        this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('EVENTS.DELETED'), life: 3000 });
      }
    });
  }

  goToCalendar(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/events/calendar`]);
  }
}
