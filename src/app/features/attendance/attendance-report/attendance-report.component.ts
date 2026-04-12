import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TagModule } from 'primeng/tag';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ExportService } from '../../../shared/utils/export.service';
import { DataTableComponent } from '../../../shared/components/data-table/data-table.component';
import { TableConfig, TableFilterEvent } from '../../../shared/components/data-table/data-table.models';
import { AttendanceRecord } from '../../../core/models/attendance.model';
import { Student } from '../../../core/models/student.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';

@Component({
  selector: 'app-attendance-report',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    ButtonModule, CardModule, CalendarModule, DropdownModule, TagModule,
    DataTableComponent
  ],
  templateUrl: './attendance-report.component.html',
  styleUrl: './attendance-report.component.scss'
})
export class AttendanceReportComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private exportService = inject(ExportService);

  fromDate: Date | null = null;
  toDate: Date | null = null;
  selectedClassId: string | null = null;
  selectedSectionId: string | null = null;

  classes: Class[] = [];
  sections: Section[] = [];
  classOptions: { label: string; value: string }[] = [];
  sectionOptions: { label: string; value: string }[] = [];

  allData: any[] = [];
  data: any[] = [];
  totalPresent = 0;
  totalAbsent = 0;
  totalLate = 0;
  attendancePercent = 0;

  tableConfig: TableConfig = {
    columns: [
      { field: 'studentName', header: 'ATTENDANCE.STUDENT_NAME', sortable: true },
      { field: 'rollNumber', header: 'ATTENDANCE.ROLL_NUMBER' },
      { field: 'date', header: 'ATTENDANCE.DATE', type: 'date', sortable: true },
      { field: 'status', header: 'ATTENDANCE.STATUS', type: 'badge',
        badgeMap: {
          'PRESENT': { label: 'Present', severity: 'success' },
          'ABSENT': { label: 'Absent', severity: 'danger' },
          'LATE': { label: 'Late', severity: 'warn' }
        }
      },
      { field: 'createdBy', header: 'AUDIT.CREATED_BY', sortable: true, width: '120px' },
      { field: 'createdDate', header: 'AUDIT.CREATED_DATE', type: 'date', dateFormat: 'medium', sortable: true, width: '160px' }
    ],
    globalSearch: true,
    paginator: true,
    rowsPerPage: [10, 25, 50],
    defaultRows: 25,
    emptyMessage: 'TABLE.NO_RECORDS'
  };

  ngOnInit(): void {
    this.classes = this.storage.get<Class>('classes');
    this.sections = this.storage.get<Section>('sections');
    this.classOptions = this.classes.map(c => ({ label: c.name, value: c.id }));
    this.loadData();
  }

  onClassChange(classId: string): void {
    this.selectedClassId = classId;
    this.selectedSectionId = null;
    this.sectionOptions = this.sections.filter(s => s.classId === classId).map(s => ({ label: s.name, value: s.id }));
    this.applyFilters();
  }

  onSectionChange(sectionId: string): void {
    this.selectedSectionId = sectionId;
    this.applyFilters();
  }

  loadData(): void {
    const students = this.storage.get<Student>('students');
    const records = this.storage.get<AttendanceRecord>('attendance');

    this.allData = records.map(r => {
      const student = students.find(s => s.id === r.studentId);
      return {
        ...r,
        studentName: student?.name ?? 'Unknown',
        rollNumber: student?.rollNumber ?? '',
        classId: student?.classId ?? '',
        sectionId: student?.sectionId ?? ''
      };
    });

    this.applyFilters();
  }

  applyFilters(): void {
    let result = [...this.allData];

    if (this.fromDate) {
      const from = this.fromDate.toISOString().split('T')[0];
      result = result.filter(r => r.date >= from);
    }
    if (this.toDate) {
      const to = this.toDate.toISOString().split('T')[0];
      result = result.filter(r => r.date <= to);
    }
    if (this.selectedClassId) {
      result = result.filter(r => r.classId === this.selectedClassId);
    }
    if (this.selectedSectionId) {
      result = result.filter(r => r.sectionId === this.selectedSectionId);
    }

    this.data = result;
    this.computeStats();
  }

  computeStats(): void {
    this.totalPresent = this.data.filter(r => r.status === 'PRESENT').length;
    this.totalAbsent = this.data.filter(r => r.status === 'ABSENT').length;
    this.totalLate = this.data.filter(r => r.status === 'LATE').length;
    const total = this.data.length;
    this.attendancePercent = total > 0 ? Math.round(((this.totalPresent + this.totalLate) / total) * 100) : 0;
  }

  onFilter(event: TableFilterEvent): void {
    let result = [...this.data];
    if (event.globalSearch) {
      const q = event.globalSearch.toLowerCase();
      result = result.filter(r =>
        r.studentName.toLowerCase().includes(q) ||
        r.rollNumber.toLowerCase().includes(q)
      );
    }
    this.data = result;
  }

  goToMarking(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/attendance`]);
  }

  onExportCsv(): void {
    const headers = [
      { field: 'studentName', label: 'Student Name' },
      { field: 'rollNumber', label: 'Roll No' },
      { field: 'date', label: 'Date' },
      { field: 'status', label: 'Status' },
      { field: 'createdBy', label: 'Marked By' }
    ];
    this.exportService.downloadCsv(this.data, headers, 'attendance_report');
  }

  onPrint(): void {
    const title = 'Attendance Report' +
      (this.fromDate ? ' | From: ' + this.fromDate.toLocaleDateString() : '') +
      (this.toDate ? ' To: ' + this.toDate.toLocaleDateString() : '');
    const headers = ['Student Name', 'Roll No', 'Date', 'Status', 'Marked By'];
    const rows = this.data.map(r => [r.studentName, r.rollNumber, r.date, r.status, r.createdBy ?? '']);
    this.exportService.printTable(title, headers, rows);
  }
}