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
import { Exam } from '../../../core/models/exam.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { Class } from '../../../core/models/class.model';

@Component({
  selector: 'app-exam-list',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, ToastModule, ConfirmDialogModule, DataTableComponent],
  templateUrl: './exam-list.component.html',
  styleUrl: './exam-list.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ExamListComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  allData: Exam[] = [];
  data: any[] = [];
  loading = false;
  isAdmin = false;
  tableConfig!: TableConfig;

  private classes: Class[] = [];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.classes = this.storage.get<Class>('classes');

    this.tableConfig = {
      columns: [
        { field: 'name', header: 'EXAMS.NAME', sortable: true, filterable: true, filterType: 'text' },
        {
          field: 'type', header: 'EXAMS.TYPE', filterable: true, filterType: 'dropdown',
          filterOptions: [
            { label: this.translate.instant('EXAMS.UNIT_TEST'), value: 'UNIT_TEST' },
            { label: this.translate.instant('EXAMS.QUARTERLY'), value: 'QUARTERLY' },
            { label: this.translate.instant('EXAMS.HALF_YEARLY'), value: 'HALF_YEARLY' },
            { label: this.translate.instant('EXAMS.ANNUAL'), value: 'ANNUAL' }
          ],
          type: 'badge',
          badgeMap: {
            'UNIT_TEST':   { label: 'Unit Test',   severity: 'info' },
            'QUARTERLY':   { label: 'Quarterly',   severity: 'warning' },
            'HALF_YEARLY': { label: 'Half Yearly', severity: 'success' },
            'ANNUAL':      { label: 'Annual',      severity: 'danger' }
          }
        },
        { field: 'className', header: 'EXAMS.CLASS', filterable: true, filterType: 'text' },
        { field: 'dateRange', header: 'EXAMS.DATE_RANGE' },
        { field: 'maxMarks', header: 'EXAMS.MAX_MARKS' },
        {
          field: 'isPublished', header: 'EXAMS.STATUS',
          type: 'badge',
          badgeMap: {
            'true':  { label: this.translate.instant('EXAMS.PUBLISHED'), severity: 'success' },
            'false': { label: this.translate.instant('EXAMS.DRAFT'),     severity: 'warn' }
          }
        },
        { field: 'createdBy',   header: 'AUDIT.CREATED_BY',   sortable: true, width: '120px' },
        { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' },
        { field: 'updatedBy',   header: 'AUDIT.UPDATED_BY',   sortable: true, width: '120px' },
        { field: 'updatedDate', header: 'AUDIT.UPDATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
      ],
      globalSearch: true,
      paginator: true,
      rowsPerPage: [10, 25, 50],
      defaultRows: 10,
      actions: this.isAdmin ? ['view', 'edit', 'delete'] : ['view'],
      showAddButton: this.isAdmin,
      addButtonLabel: 'EXAMS.ADD',
      emptyMessage: 'EXAMS.NO_EXAMS'
    };

    this.loadData();
  }

  loadData(): void {
    const activeYear = this.storage.get<AcademicYear>('academic_years').find(y => y.isActive);
    this.allData = this.storage.get<Exam>('exams').filter(e =>
      !activeYear || e.academicYearId === activeYear.id
    );
    this.data = this.buildRows(this.allData);
  }

  private buildRows(exams: Exam[]): any[] {
    return exams.map(e => ({
      ...e,
      className: this.classes.find(c => c.id === e.classId)?.name ?? e.classId,
      dateRange: `${e.startDate} — ${e.endDate}`,
      isPublished: String(e.isPublished)
    }));
  }

  onFilter(event: TableFilterEvent): void {
    let result = [...this.allData];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    const cf = event.columnFilters;
    if (cf['name']) result = result.filter(r => r.name.toLowerCase().includes(cf['name'].toLowerCase()));
    if (cf['type']) result = result.filter(r => r.type === cf['type']);
    this.data = this.buildRows(result);
  }

  onAdd(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams/create`]);
  }

  onEdit(row: any): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams/edit/${row.id}`]);
  }

  onView(row: any): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams/${row.id}/marks`]);
  }

  onDelete(row: any): void {
    this.confirmationService.confirm({
      message: this.translate.instant('EXAMS.CONFIRM_DELETE'),
      accept: () => {
        this.storage.delete('exams', row.id);
        this.loadData();
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: this.translate.instant('EXAMS.DELETED'),
          life: 3000
        });
      }
    });
  }

  goToReportCards(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/students`]);
  }
}
