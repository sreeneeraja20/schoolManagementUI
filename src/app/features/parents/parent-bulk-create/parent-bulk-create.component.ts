import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { RadioButtonModule } from 'primeng/radiobutton';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';
import { ParentService } from '../parent.service';
import { ParentAccount } from '../../../core/models/parent.model';
import { Student } from '../../../core/models/student.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ExportService } from '../../../shared/utils/export.service';

interface BulkStudentRow {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  sectionName: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  hasMissingEmail: boolean;
  alreadyExists: boolean;
  selected: boolean;
}

@Component({
  selector: 'app-parent-bulk-create',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    ButtonModule, CardModule, DropdownModule, TableModule,
    CheckboxModule, RadioButtonModule, TagModule, ToastModule, DividerModule
  ],
  templateUrl: './parent-bulk-create.component.html',
  styleUrl: './parent-bulk-create.component.scss',
  providers: [MessageService]
})
export class ParentBulkCreateComponent implements OnInit {
  private parentService = inject(ParentService);
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);
  private exportService = inject(ExportService);

  // Step control
  currentStep = 1;

  // Step 1 data
  classOptions: { label: string; value: string }[] = [];
  sectionOptions: { label: string; value: string }[] = [];
  selectedClassId = '';
  selectedSectionId = '';

  // Step 2 data
  studentRows: BulkStudentRow[] = [];
  selectAll = false;
  loading = false;

  // Step 3 data
  passwordStrategy: 'auto' | 'phone' | 'dob' = 'auto';
  forcePasswordChange = true;

  // Step 5 result
  createResult: { created: ParentAccount[]; skipped: { studentId: string; reason: string }[] } | null = null;

  ngOnInit(): void {
    const classes = this.storage.get<Class>('classes');
    this.classOptions = classes.map(c => ({ label: c.name, value: c.id }));
  }

  onClassChange(): void {
    this.sectionOptions = [];
    this.selectedSectionId = '';
    if (!this.selectedClassId) return;
    const sections = this.storage.get<Section>('sections').filter(s => s.classId === this.selectedClassId);
    this.sectionOptions = sections.map(s => ({ label: s.name, value: s.id }));
  }

  loadStudents(): void {
    if (!this.selectedClassId) return;
    this.loading = true;

    setTimeout(() => {
      const students = this.storage.get<Student>('students').filter(s => {
        if (this.selectedSectionId) return s.classId === this.selectedClassId && s.sectionId === this.selectedSectionId;
        return s.classId === this.selectedClassId;
      });

      const classes = this.storage.get<Class>('classes');
      const sections = this.storage.get<Section>('sections');

      this.studentRows = students.map(s => {
        const existingParent = this.parentService.getByStudentId(s.id);
        return {
          id: s.id,
          name: s.name,
          rollNumber: s.rollNumber,
          className: classes.find(c => c.id === s.classId)?.name ?? '',
          sectionName: sections.find(sec => sec.id === s.sectionId)?.name ?? '',
          parentName: s.parentName,
          parentPhone: s.parentPhone,
          parentEmail: s.parentEmail ?? '',
          hasMissingEmail: !s.parentEmail,
          alreadyExists: !!existingParent,
          selected: !existingParent && !!s.parentEmail
        };
      });

      this.currentStep = 2;
      this.loading = false;
    }, 700);
  }

  toggleSelectAll(): void {
    const canSelect = this.studentRows.filter(r => !r.alreadyExists && !r.hasMissingEmail);
    canSelect.forEach(r => (r.selected = this.selectAll));
  }

  get selectedCount(): number {
    return this.studentRows.filter(r => r.selected).length;
  }

  proceedToPasswordStep(): void {
    if (this.selectedCount === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: this.translate.instant('SETUP.ERROR'),
        detail: 'Please select at least one student',
        life: 3000
      });
      return;
    }
    this.currentStep = 3;
  }

  createAccounts(): void {
    const selectedIds = this.studentRows.filter(r => r.selected).map(r => r.id);
    this.createResult = this.parentService.bulkCreate(selectedIds, this.passwordStrategy);
    this.currentStep = 4;

    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('SETUP.SUCCESS'),
      detail: `${this.createResult.created.length} ${this.translate.instant('PARENTS.BULK.RESULT_CREATED')}`,
      life: 4000
    });
  }

  get skippedMissingEmail(): number {
    return this.createResult?.skipped.filter(s => s.reason === 'missing_email').length ?? 0;
  }

  get skippedAlreadyExists(): number {
    return this.createResult?.skipped.filter(s => s.reason === 'already_exists').length ?? 0;
  }

  downloadCredentialsCsv(): void {
    if (!this.createResult) return;
    const rows = this.createResult.created.map(p => {
      const student = this.studentRows.find(sr => p.studentIds.includes(sr.id));
      return {
        studentName: student?.name ?? '',
        className: student?.className ?? '',
        sectionName: student?.sectionName ?? '',
        parentName: p.name,
        relation: p.relation,
        email: p.email,
        phone: p.phone,
        password: p.password,
        schoolCode: this.tenantService.getTenantSlug().toUpperCase()
      };
    });
    const headers = [
      { field: 'studentName', label: 'Student Name' },
      { field: 'className', label: 'Class' },
      { field: 'sectionName', label: 'Section' },
      { field: 'parentName', label: 'Parent Name' },
      { field: 'relation', label: 'Relation' },
      { field: 'email', label: 'Email' },
      { field: 'phone', label: 'Phone' },
      { field: 'password', label: 'Password' },
      { field: 'schoolCode', label: 'School Code' }
    ];
    this.exportService.downloadCsv(rows, headers, 'parent-credentials');
  }

  downloadCredentialsPdf(): void {
    if (!this.createResult) return;
    const headers = ['Student Name', 'Class', 'Section', 'Parent Name', 'Email', 'Phone', 'Password'];
    const rows = this.createResult.created.map(p => {
      const student = this.studentRows.find(sr => p.studentIds.includes(sr.id));
      return [
        student?.name ?? '',
        student?.className ?? '',
        student?.sectionName ?? '',
        p.name,
        p.email,
        p.phone,
        p.password
      ];
    });
    this.exportService.printTable('Parent Login Credentials', headers, rows);
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents`]);
  }
}
