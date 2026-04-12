import { Auditable } from './audit.model';

export interface Section extends Auditable {
  id: string;
  tenantId: string;
  classId: string;
  name: string;
  classTeacherId: string;
  maxStudents: number;
}
