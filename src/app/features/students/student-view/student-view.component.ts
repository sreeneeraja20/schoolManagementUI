import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { Student } from '../../../core/models/student.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { AttendanceRecord } from '../../../core/models/attendance.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-student-view',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, DividerModule, TagModule, ImageUploadComponent],
  templateUrl: './student-view.component.html',
  styleUrl: './student-view.component.scss'
})
export class StudentViewComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  student: Student | null = null;
  className: string = '';
  sectionName: string = '';
  academicYearName: string = '';
  initials: string = '';

  totalDays: number = 0;
  presentPercent: number = 0;
  absentPercent: number = 0;
  latePercent: number = 0;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.student = this.storage.getById<Student>('students', id);
      if (this.student) {
        this.initials = this.getInitials(this.student.name);
        const classes = this.storage.get<Class>('classes');
        const sections = this.storage.get<Section>('sections');
        const years = this.storage.get<AcademicYear>('academic_years');
        this.className = classes.find(c => c.id === this.student!.classId)?.name ?? '';
        this.sectionName = sections.find(s => s.id === this.student!.sectionId)?.name ?? '';
        this.academicYearName = years.find(y => y.id === this.student!.academicYearId)?.name ?? '';
        this.loadAttendanceSummary(id);
      }
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  private loadAttendanceSummary(studentId: string): void {
    const records = this.storage.get<AttendanceRecord>('attendance').filter(r => r.studentId === studentId);
    this.totalDays = records.length;
    if (this.totalDays > 0) {
      const present = records.filter(r => r.status === 'PRESENT').length;
      const absent = records.filter(r => r.status === 'ABSENT').length;
      const late = records.filter(r => r.status === 'LATE').length;
      this.presentPercent = Math.round((present / this.totalDays) * 100);
      this.absentPercent = Math.round((absent / this.totalDays) * 100);
      this.latePercent = Math.round((late / this.totalDays) * 100);
    }
  }

  onEdit(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/students/edit/${this.student!.id}`]);
  }

  getGenderLabel(gender: string): string {
    if (gender === 'M') return 'STUDENTS.MALE';
    if (gender === 'F') return 'STUDENTS.FEMALE';
    return 'STUDENTS.OTHER';
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/students`]);
  }

  goToReportCard(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams/report-card/${this.student!.id}`]);
  }
}
