import { Auditable } from './audit.model';

export interface Student extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  rollNumber: string;
  classId: string;
  sectionId: string;
  dateOfBirth: string;
  gender: 'M' | 'F' | 'Other';
  parentName: string;
  parentPhone: string;
  address: string;
  academicYearId: string;
  photoUrl?: string;
  parentEmail?: string;
}
