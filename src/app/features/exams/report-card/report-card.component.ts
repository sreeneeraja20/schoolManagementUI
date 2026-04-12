import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { DividerModule } from 'primeng/divider';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { Exam, ExamSubject, StudentMark, GradeScale, DEFAULT_GRADE_SCALE } from '../../../core/models/exam.model';
import { Student } from '../../../core/models/student.model';
import { Subject } from '../../../core/models/subject.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { AttendanceRecord } from '../../../core/models/attendance.model';

interface SubjectResult {
  subjectName: string;
  maxMarks: number;
  marksObtained: number | null;
  isAbsent: boolean;
  percentage: number | null;
  grade: string;
  gradePoint: number;
  result: 'Pass' | 'Fail' | 'Absent';
}

interface ExamResult {
  exam: Exam;
  subjects: SubjectResult[];
  totalMaxMarks: number;
  totalMarks: number;
  overallPercent: number;
  overallGrade: string;
  overallGradePoint: number;
}

@Component({
  selector: 'app-report-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, TagModule, TableModule, DividerModule],
  templateUrl: './report-card.component.html',
  styleUrl: './report-card.component.scss'
})
export class ReportCardComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private translate = inject(TranslateService);

  student: Student | null = null;
  className = '';
  sectionName = '';
  academicYearName = '';
  schoolName = '';
  examResults: ExamResult[] = [];
  gradeScale = DEFAULT_GRADE_SCALE;
  loading = false;
  readonly minVisibleRows = 5;
  readonly rowHeightRem = 3.2;

  // Attendance
  totalDays = 0;
  presentDays = 0;
  attendancePercent = 0;

  ngOnInit(): void {
    this.loading = true;

    setTimeout(() => {
      const studentId = this.route.snapshot.paramMap.get('studentId');
      const examId    = this.route.snapshot.queryParamMap.get('examId');
      if (!studentId) { this.goBack(); return; }

      this.student = this.storage.getById<Student>('students', studentId);
      if (!this.student) { this.goBack(); return; }

      const cls   = this.storage.getById<Class>('classes', this.student.classId);
      const sec   = this.storage.getById<Section>('sections', this.student.sectionId);
      const year  = this.storage.getById<AcademicYear>('academic_years', this.student.academicYearId);
      this.className      = cls?.name ?? '';
      this.sectionName    = sec?.name ?? '';
      this.academicYearName = year?.name ?? '';
      this.schoolName = this.tenantService.currentTenant()?.schoolName ?? '';

      // Load exams
      let exams = this.storage.get<Exam>('exams').filter(e => e.classId === this.student!.classId);
      if (examId) { exams = exams.filter(e => e.id === examId); }

      const subjects  = this.storage.get<Subject>('subjects');
      const allExamSubjects = this.storage.get<ExamSubject>('exam_subjects');
      const allMarks  = this.storage.get<StudentMark>('student_marks');

      this.examResults = exams.map(exam => {
        const examSubjects = allExamSubjects.filter(es => es.examId === exam.id);
        const subjectResults: SubjectResult[] = examSubjects.map(es => {
          const sub = subjects.find(s => s.id === es.subjectId);
          const mark = allMarks.find(m => m.examId === exam.id && m.examSubjectId === es.id && m.studentId === studentId);
          const maxM = es.maxMarks;
          const obtained = mark?.marksObtained ?? null;
          const absent = mark?.isAbsent ?? false;
          const pct = (!absent && obtained !== null) ? Math.round((obtained / maxM) * 100) : null;
          const gs = pct !== null ? this.getGrade(pct) : { grade: '-', gradePoint: 0 };
          const passed = !absent && obtained !== null && obtained >= es.passingMarks;
          return {
            subjectName: sub?.name ?? es.subjectId,
            maxMarks: maxM,
            marksObtained: absent ? null : obtained,
            isAbsent: absent,
            percentage: pct,
            grade: absent ? 'AB' : gs.grade,
            gradePoint: absent ? 0 : gs.gradePoint,
            result: absent ? 'Absent' : (passed ? 'Pass' : 'Fail')
          };
        });

        const totalMax  = subjectResults.reduce((s, r) => s + r.maxMarks, 0);
        const totalObt  = subjectResults.filter(r => !r.isAbsent && r.marksObtained !== null).reduce((s, r) => s + (r.marksObtained as number), 0);
        const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : 0;
        const overallGs = this.getGrade(overallPct);

        return {
          exam, subjects: subjectResults,
          totalMaxMarks: totalMax,
          totalMarks: totalObt,
          overallPercent: overallPct,
          overallGrade: overallGs.grade,
          overallGradePoint: overallGs.gradePoint
        };
      });

      // Attendance
      const records = this.storage.get<AttendanceRecord>('attendance').filter(a => a.studentId === studentId);
      this.totalDays = records.length;
      this.presentDays = records.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      this.attendancePercent = this.totalDays > 0 ? Math.round((this.presentDays / this.totalDays) * 100) : 0;
      this.loading = false;
    }, 700);
  }

  getGrade(percentage: number): GradeScale {
    return DEFAULT_GRADE_SCALE.find(g => percentage >= g.minPercent && percentage <= g.maxPercent)
      ?? DEFAULT_GRADE_SCALE[DEFAULT_GRADE_SCALE.length - 1];
  }

  getResultSeverity(result: string): 'success' | 'danger' | 'warn' {
    if (result === 'Pass') return 'success';
    if (result === 'Fail') return 'danger';
    return 'warn';
  }

  getSpacerRows(dataLength: number, additionalRows: number = 0): number {
    return Math.max(0, this.minVisibleRows - (dataLength + additionalRows));
  }

  printCard(): void { window.print(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams`]);
  }
}
