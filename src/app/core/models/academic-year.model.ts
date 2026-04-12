import { Auditable } from './audit.model';

export interface AcademicYear extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
