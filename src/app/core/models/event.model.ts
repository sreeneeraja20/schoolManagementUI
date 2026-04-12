import { Auditable } from './audit.model';

export interface SchoolEvent extends Auditable {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type: 'holiday' | 'exam' | 'event';
  forRoles: string[];
}
