import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ToastModule } from 'primeng/toast';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { SetupBannerComponent } from '../../../shared/components/setup-banner/setup-banner.component';
import { Student } from '../../../core/models/student.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { AttendanceRecord, AttendanceStatus } from '../../../core/models/attendance.model';
import { getAuditFieldsForCreate } from '../../../shared/utils/audit.util';

interface AttendanceRow {
  studentId: string;
  rollNumber: string;
  name: string;
  status: AttendanceStatus;
}

@Component({
  selector: 'app-attendance-marking',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    ButtonModule, CardModule, CalendarModule, DropdownModule,
    TableModule, RadioButtonModule, ToastModule, TagModule,
    SetupBannerComponent
  ],
  templateUrl: './attendance-marking.component.html',
  styleUrl: './attendance-marking.component.scss',
  providers: [MessageService]
})
export class AttendanceMarkingComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  selectedDate: Date = new Date();
  selectedClassId: string | null = null;
  selectedSectionId: string | null = null;

  classes: Class[] = [];
  sections: Section[] = [];
  filteredSections: Section[] = [];
  classOptions: { label: string; value: string }[] = [];
  sectionOptions: { label: string; value: string }[] = [];

  students: Student[] = [];
  attendanceRows: AttendanceRow[] = [];
  hasStudents = false;
  isLoaded = false;
  loading = false;

  ngOnInit(): void {
    this.classes = this.storage.get<Class>('classes');
    this.sections = this.storage.get<Section>('sections');
    this.classOptions = this.classes.map(c => ({ label: c.name, value: c.id }));
  }

  onClassChange(classId: string): void {
    this.selectedClassId = classId;
    this.selectedSectionId = null;
    this.filteredSections = this.sections.filter(s => s.classId === classId);
    this.sectionOptions = this.filteredSections.map(s => ({ label: s.name, value: s.id }));
    this.attendanceRows = [];
    this.isLoaded = false;
  }

  onSectionChange(sectionId: string): void {
    this.selectedSectionId = sectionId;
    this.loadAttendance();
  }

  onDateChange(): void {
    if (this.selectedClassId && this.selectedSectionId) {
      this.loadAttendance();
    }
  }

  loadAttendance(): void {
    if (!this.selectedClassId || !this.selectedSectionId) return;
    this.loading = true;
    this.isLoaded = false;

    setTimeout(() => {
      this.students = this.storage.get<Student>('students').filter(
        s => s.classId === this.selectedClassId && s.sectionId === this.selectedSectionId
      );
      this.hasStudents = this.students.length > 0;

      const dateStr = this.formatDate(this.selectedDate);
      const existing = this.storage.get<AttendanceRecord>('attendance').filter(
        a => a.date === dateStr && this.students.some(s => s.id === a.studentId)
      );

      this.attendanceRows = this.students.map(s => {
        const existing_record = existing.find(a => a.studentId === s.id);
        return {
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          status: existing_record?.status ?? 'PRESENT'
        };
      });
      this.isLoaded = true;
      this.loading = false;
    }, 650);
  }

  markAll(status: AttendanceStatus): void {
    this.attendanceRows = this.attendanceRows.map(r => ({ ...r, status }));
  }

  saveAttendance(): void {
    const tenantId = this.tenantService.getTenantId();
    const dateStr = this.formatDate(this.selectedDate);

    const allRecords = this.storage.get<AttendanceRecord>('attendance').filter(
      a => !(a.date === dateStr && this.attendanceRows.some(r => r.studentId === a.studentId))
    );

    const newRecords: AttendanceRecord[] = this.attendanceRows.map(r => ({
      id: `att-${r.studentId}-${dateStr}`,
      tenantId,
      studentId: r.studentId,
      date: dateStr,
      status: r.status,
      period: 0,
      subjectId: '',
      ...getAuditFieldsForCreate(this.authService)
    }));

    this.storage.set('attendance', [...allRecords, ...newRecords]);
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('ATTENDANCE.SAVED'), life: 3000 });
  }

  goToReport(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/attendance/report`]);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
