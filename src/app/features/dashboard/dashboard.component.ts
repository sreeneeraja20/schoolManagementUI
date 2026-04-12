import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { StorageService } from '../../core/services/storage.service';
import { TenantService } from '../../core/services/tenant.service';
import { AuthService } from '../../core/services/auth.service';
import { SeedDataService } from '../../core/services/seed-data.service';
import { Student } from '../../core/models/student.model';
import { Staff } from '../../core/models/staff.model';
import { AttendanceRecord } from '../../core/models/attendance.model';
import { SchoolEvent } from '../../core/models/event.model';
import { Exam } from '../../core/models/exam.model';
import { AcademicYear } from '../../core/models/academic-year.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TranslateModule, CardModule, ButtonModule, TagModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private seedService = inject(SeedDataService);
  private router = inject(Router);

  isAdmin = false;
  totalStudents = 0;
  totalStaff = 0;
  todayAttendancePercent = 0;
  upcomingEventsCount = 0;
  upcomingExamsCount = 0;
  upcomingEvents: SchoolEvent[] = [];

  ngOnInit(): void {
    this.seedService.seed();
    const user = this.authService.getCurrentUser();
    this.isAdmin = user?.role === 'ADMIN';
    this.loadStats();
  }

  private loadStats(): void {
    this.totalStudents = this.storage.get<Student>('students').length;
    this.totalStaff = this.storage.get<Staff>('staff').length;

    // Today's attendance percentage
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = this.storage.get<AttendanceRecord>('attendance').filter(a => a.date === today);
    if (todayRecords.length > 0) {
      const present = todayRecords.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      this.todayAttendancePercent = Math.round((present / todayRecords.length) * 100);
    }

    // Upcoming events in next 7 days
    const now = new Date();
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);
    const todayStr = now.toISOString().split('T')[0];
    const in7DaysStr = in7Days.toISOString().split('T')[0];
    const events = this.storage.get<SchoolEvent>('events');
    this.upcomingEvents = events.filter(e => e.startDate >= todayStr && e.startDate <= in7DaysStr).slice(0, 5);
    this.upcomingEventsCount = events.filter(e => e.startDate >= todayStr && e.startDate <= in7DaysStr).length;

    // Upcoming exams
    const activeYear = this.storage.get<AcademicYear>('academic_years').find(y => y.isActive);
    const exams = this.storage.get<Exam>('exams').filter(e => !activeYear || e.academicYearId === activeYear.id);
    this.upcomingExamsCount = exams.filter(e => e.startDate > todayStr).length;
  }

  navigate(path: string): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/${path}`]);
  }

  getEventSeverity(type: string): any {
    switch (type) {
      case 'holiday': return 'info';
      case 'exam': return 'warn';
      case 'event': return 'success';
      default: return 'secondary';
    }
  }
}
