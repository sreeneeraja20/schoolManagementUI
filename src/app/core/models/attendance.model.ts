export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

import { Auditable } from './audit.model';

export interface AttendanceRecord extends Auditable {
  id: string;
  tenantId: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  period?: number;
  subjectId?: string;
}
