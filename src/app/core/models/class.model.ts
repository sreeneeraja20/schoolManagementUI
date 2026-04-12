import { Auditable } from './audit.model';

export interface Class extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  academicYearId: string;
  displayOrder: number;
}
