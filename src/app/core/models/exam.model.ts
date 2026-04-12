import { Auditable } from './audit.model';

export type ExamType = 'UNIT_TEST' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL';

export interface Exam extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  type: ExamType;
  academicYearId: string;
  classId: string;
  startDate: string;
  endDate: string;
  maxMarks: number;
  passingMarks: number;
  isPublished: boolean;
}

export interface ExamSubject extends Auditable {
  id: string;
  tenantId: string;
  examId: string;
  subjectId: string;
  examDate: string;
  maxMarks: number;
  passingMarks: number;
}

export interface StudentMark extends Auditable {
  id: string;
  tenantId: string;
  examId: string;
  examSubjectId: string;
  studentId: string;
  marksObtained: number | null;
  isAbsent: boolean;
  remarks?: string;
}

export interface GradeScale {
  minPercent: number;
  maxPercent: number;
  grade: string;
  gradePoint: number;
  description: string;
}

export const DEFAULT_GRADE_SCALE: GradeScale[] = [
  { minPercent: 91, maxPercent: 100, grade: 'A+', gradePoint: 10, description: 'Outstanding' },
  { minPercent: 81, maxPercent: 90,  grade: 'A',  gradePoint: 9,  description: 'Excellent' },
  { minPercent: 71, maxPercent: 80,  grade: 'B+', gradePoint: 8,  description: 'Very Good' },
  { minPercent: 61, maxPercent: 70,  grade: 'B',  gradePoint: 7,  description: 'Good' },
  { minPercent: 51, maxPercent: 60,  grade: 'C+', gradePoint: 6,  description: 'Above Average' },
  { minPercent: 41, maxPercent: 50,  grade: 'C',  gradePoint: 5,  description: 'Average' },
  { minPercent: 33, maxPercent: 40,  grade: 'D',  gradePoint: 4,  description: 'Below Average' },
  { minPercent: 0,  maxPercent: 32,  grade: 'F',  gradePoint: 0,  description: 'Fail' },
];
