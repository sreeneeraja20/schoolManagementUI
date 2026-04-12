import { Auditable } from './audit.model';

export interface Staff extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  subjectIds: string[];
  qualification: string;
  joiningDate: string;
  photoUrl?: string;
}
