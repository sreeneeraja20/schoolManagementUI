import { Auditable } from './audit.model';

export interface Subject extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  classIds: string[];
}
