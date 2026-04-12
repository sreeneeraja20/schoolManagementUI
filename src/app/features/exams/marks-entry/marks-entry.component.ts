import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { InputNumberModule } from 'primeng/inputnumber';
import { CheckboxModule } from 'primeng/checkbox';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { Exam, ExamSubject, StudentMark } from '../../../core/models/exam.model';
import { Student } from '../../../core/models/student.model';
import { Subject } from '../../../core/models/subject.model';
import { Class } from '../../../core/models/class.model';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';

interface MarksRow {
  studentId: string;
  rollNumber: string;
  name: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks: string;
}

@Component({
  selector: 'app-marks-entry',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    ButtonModule, CardModule, DropdownModule, InputNumberModule,
    CheckboxModule, InputTextModule, TableModule, TagModule, ToastModule, TooltipModule
  ],
  templateUrl: './marks-entry.component.html',
  styleUrl: './marks-entry.component.scss',
  providers: [MessageService]
})
export class MarksEntryComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  exam: Exam | null = null;
  examSubjects: ExamSubject[] = [];
  subjectOptions: { label: string; value: string }[] = [];
  selectedExamSubjectId: string | null = null;
  selectedExamSubject: ExamSubject | null = null;

  rows: MarksRow[] = [];
  className = '';
  loading = false;

  // Summary
  totalStudents = 0;
  marksEnteredCount = 0;
  averageMarks = 0;
  highestMarks = 0;
  lowestMarks = 0;
  passPercent = 0;
  failPercent = 0;

  private subjects: Subject[] = [];

  ngOnInit(): void {
    const examId = this.route.snapshot.paramMap.get('examId');
    if (!examId) { this.goBack(); return; }

    this.exam = this.storage.getById<Exam>('exams', examId);
    if (!this.exam) { this.goBack(); return; }

    const cls = this.storage.getById<Class>('classes', this.exam.classId);
    this.className = cls?.name ?? '';
    this.subjects = this.storage.get<Subject>('subjects');

    this.examSubjects = this.storage.get<ExamSubject>('exam_subjects').filter(es => es.examId === examId);
    this.subjectOptions = this.examSubjects.map(es => {
      const sub = this.subjects.find(s => s.id === es.subjectId);
      return { label: sub?.name ?? es.subjectId, value: es.id };
    });

    if (this.subjectOptions.length > 0) {
      this.selectedExamSubjectId = this.subjectOptions[0].value;
      this.onSubjectChange(this.selectedExamSubjectId);
    }
  }

  onSubjectChange(examSubjectId: string): void {
    this.selectedExamSubjectId = examSubjectId;
    this.selectedExamSubject = this.examSubjects.find(es => es.id === examSubjectId) ?? null;
    this.loadRows();
  }

  private loadRows(): void {
    if (!this.exam || !this.selectedExamSubjectId) return;
    this.loading = true;

    setTimeout(() => {
      const students = this.storage.get<Student>('students').filter(s => s.classId === this.exam!.classId);
      const existingMarks = this.storage.get<StudentMark>('student_marks').filter(
        m => m.examId === this.exam!.id && m.examSubjectId === this.selectedExamSubjectId
      );

      this.rows = students.map(s => {
        const mark = existingMarks.find(m => m.studentId === s.id);
        return {
          studentId: s.id,
          rollNumber: s.rollNumber,
          name: s.name,
          marksObtained: mark ? mark.marksObtained : null,
          isAbsent: mark ? mark.isAbsent : false,
          remarks: mark?.remarks ?? ''
        };
      });

      this.updateSummary();
      this.loading = false;
    }, 600);
  }

  onAbsentChange(row: MarksRow): void {
    if (row.isAbsent) { row.marksObtained = null; }
    this.updateSummary();
  }

  onMarksChange(): void {
    this.updateSummary();
  }

  private updateSummary(): void {
    const maxM = this.selectedExamSubject?.maxMarks ?? this.exam?.maxMarks ?? 100;
    const passingM = this.selectedExamSubject?.passingMarks ?? this.exam?.passingMarks ?? 35;

    this.totalStudents = this.rows.length;
    const entered = this.rows.filter(r => !r.isAbsent && r.marksObtained !== null);
    this.marksEnteredCount = entered.length;

    if (entered.length > 0) {
      const marks = entered.map(r => r.marksObtained as number);
      this.averageMarks = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
      this.highestMarks = Math.max(...marks);
      this.lowestMarks  = Math.min(...marks);
      const pass = entered.filter(r => (r.marksObtained as number) >= passingM).length;
      this.passPercent = Math.round((pass / entered.length) * 100);
      this.failPercent = 100 - this.passPercent;
    } else {
      this.averageMarks = this.highestMarks = this.lowestMarks = 0;
      this.passPercent = this.failPercent = 0;
    }
  }

  saveMarks(): void {
    if (!this.exam || !this.selectedExamSubjectId) return;
    const tenantId = this.tenantService.getTenantId();
    const allMarks = this.storage.get<StudentMark>('student_marks');

    this.rows.forEach(row => {
      const existing = allMarks.find(
        m => m.examId === this.exam!.id && m.examSubjectId === this.selectedExamSubjectId && m.studentId === row.studentId
      );
      if (existing) {
        this.storage.update<StudentMark>('student_marks', existing.id, {
          marksObtained: row.isAbsent ? null : row.marksObtained,
          isAbsent: row.isAbsent, remarks: row.remarks,
          ...getAuditFieldsForUpdate(this.authService)
        });
      } else {
        const newMark: StudentMark = {
          id: `sm-${this.exam!.id}-${this.selectedExamSubjectId}-${row.studentId}`,
          tenantId, examId: this.exam!.id,
          examSubjectId: this.selectedExamSubjectId!,
          studentId: row.studentId,
          marksObtained: row.isAbsent ? null : row.marksObtained,
          isAbsent: row.isAbsent, remarks: row.remarks,
          ...getAuditFieldsForCreate(this.authService)
        };
        this.storage.add('student_marks', newMark);
      }
    });

    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('SETUP.SUCCESS'),
      detail: this.translate.instant('EXAMS.MARKS_SAVED'),
      life: 3000
    });
  }

  getSubjectStatusSeverity(examSubjectId: string): 'success' | 'warn' | 'danger' {
    if (!this.exam) return 'danger';
    const students = this.storage.get<Student>('students').filter(s => s.classId === this.exam!.classId);
    const marks = this.storage.get<StudentMark>('student_marks').filter(
      m => m.examId === this.exam!.id && m.examSubjectId === examSubjectId
    );
    if (marks.length === 0) return 'danger';
    if (marks.length < students.length) return 'warn';
    return 'success';
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams`]);
  }

  goToReportCard(studentId: string): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/exams/report-card/${studentId}`], {
      queryParams: { examId: this.exam?.id }
    });
  }
}
