import { Auditable } from './audit.model';

export interface TimetableSlot extends Auditable {
  id: string;
  tenantId: string;
  classId: string;
  sectionId: string;
  day: string;
  period: number;
  subjectId: string;
  staffId: string;
}
