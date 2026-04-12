import { Auditable } from './audit.model';

export type ParentRelation = 'Father' | 'Mother' | 'Guardian';

export interface ParentAccount extends Auditable {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  password: string;
  relation: ParentRelation;
  studentIds: string[];
  isFirstLogin: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  lastLoginDevice?: string;
  lastLoginPlatform?: string;
  lastLoginIp?: string;
  loginCount: number;
  preferredLanguage: string;
  notifyAttendance: boolean;
  notifyEvents: boolean;
  notifyExams: boolean;
}
