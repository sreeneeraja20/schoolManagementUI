import { Injectable, inject } from '@angular/core';
import { StorageService } from '../../core/services/storage.service';
import { TenantService } from '../../core/services/tenant.service';
import { AuthService } from '../../core/services/auth.service';
import { ParentAccount } from '../../core/models/parent.model';
import { Student } from '../../core/models/student.model';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../shared/utils/audit.util';

@Injectable({ providedIn: 'root' })
export class ParentService {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);

  private readonly STORAGE_KEY = 'parent_accounts';

  getAll(): ParentAccount[] {
    const tenantId = this.tenantService.getTenantId();
    return this.storage.get<ParentAccount>(this.STORAGE_KEY).filter(p => p.tenantId === tenantId);
  }

  getById(id: string): ParentAccount | null {
    return this.storage.getById<ParentAccount>(this.STORAGE_KEY, id);
  }

  getByStudentId(studentId: string): ParentAccount | null {
    const tenantId = this.tenantService.getTenantId();
    return this.storage.get<ParentAccount>(this.STORAGE_KEY)
      .find(p => p.tenantId === tenantId && p.studentIds.includes(studentId)) ?? null;
  }

  create(parent: ParentAccount): void {
    this.storage.add<ParentAccount>(this.STORAGE_KEY, parent);
  }

  update(id: string, data: Partial<ParentAccount>): void {
    this.storage.update<ParentAccount>(this.STORAGE_KEY, id, {
      ...data,
      ...getAuditFieldsForUpdate(this.authService)
    });
  }

  delete(id: string): void {
    this.storage.delete(this.STORAGE_KEY, id);
  }

  resetPassword(id: string): string {
    const parent = this.getById(id);
    if (!parent) return '';
    const firstWord = parent.name.split(' ')[0] || parent.name;
    const year = new Date().getFullYear();
    const slug = this.tenantService.getTenantSlug().toUpperCase();
    const newPassword = `${slug}-${firstWord}-${year}`;
    this.storage.update<ParentAccount>(this.STORAGE_KEY, id, {
      password: newPassword,
      isFirstLogin: true,
      ...getAuditFieldsForUpdate(this.authService)
    });
    return newPassword;
  }

  toggleActive(id: string): void {
    const parent = this.getById(id);
    if (!parent) return;
    this.storage.update<ParentAccount>(this.STORAGE_KEY, id, {
      isActive: !parent.isActive,
      ...getAuditFieldsForUpdate(this.authService)
    });
  }

  generatePassword(studentName: string): string {
    const slug = this.tenantService.getTenantSlug().toUpperCase();
    const firstName = studentName.split(' ')[0] || studentName;
    const year = new Date().getFullYear();
    return `${slug}-${firstName}-${year}`;
  }

  bulkCreate(
    studentIds: string[],
    passwordStrategy: 'auto' | 'phone' | 'dob'
  ): { created: ParentAccount[]; skipped: { studentId: string; reason: string }[] } {
    const tenantId = this.tenantService.getTenantId();
    const created: ParentAccount[] = [];
    const skipped: { studentId: string; reason: string }[] = [];

    studentIds.forEach(studentId => {
      const student = this.storage.getById<Student>('students', studentId);
      if (!student) {
        skipped.push({ studentId, reason: 'Student not found' });
        return;
      }

      // Check if parent already exists for this student
      const existing = this.getByStudentId(studentId);
      if (existing) {
        skipped.push({ studentId, reason: 'already_exists' });
        return;
      }

      // Determine email
      const email = student.parentEmail ?? '';
      if (!email) {
        skipped.push({ studentId, reason: 'missing_email' });
        return;
      }

      // Generate password
      let password: string;
      if (passwordStrategy === 'phone') {
        password = student.parentPhone ?? this.generatePassword(student.name);
      } else if (passwordStrategy === 'dob') {
        // format DDMMYYYY
        const dob = student.dateOfBirth ?? '';
        if (dob) {
          const parts = dob.split('-');
          const year = parts[0] ?? '';
          const month = parts[1] ?? '';
          const day = parts[2] ?? '';
          password = day && month && year ? `${day}${month}${year}` : this.generatePassword(student.name);
        } else {
          password = this.generatePassword(student.name);
        }
      } else {
        password = this.generatePassword(student.name);
      }

      const newParent: ParentAccount = {
        id: crypto.randomUUID(),
        tenantId,
        name: student.parentName,
        email,
        phone: student.parentPhone,
        password,
        relation: 'Father',
        studentIds: [studentId],
        isFirstLogin: true,
        isActive: true,
        loginCount: 0,
        preferredLanguage: 'en',
        notifyAttendance: true,
        notifyEvents: true,
        notifyExams: true,
        ...getAuditFieldsForCreate(this.authService)
      };

      this.storage.add<ParentAccount>(this.STORAGE_KEY, newParent);
      created.push(newParent);
    });

    return { created, skipped };
  }

  getStats(): { total: number; active: number; neverLoggedIn: number; inactive: number } {
    const all = this.getAll();
    return {
      total: all.length,
      active: all.filter(p => p.isActive).length,
      neverLoggedIn: all.filter(p => !p.lastLoginAt).length,
      inactive: all.filter(p => !p.isActive).length
    };
  }
}
