import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { Student } from '../../../core/models/student.model';
import { getAuditFieldsForCreate, getAuditFieldsForUpdate } from '../../../shared/utils/audit.util';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { AcademicYear } from '../../../core/models/academic-year.model';
import { DynamicFormComponent } from '../../../shared/components/dynamic-form/dynamic-form.component';
import { DynamicFormConfig, FormField } from '../../../shared/components/dynamic-form/dynamic-form.models';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';
import { HasUnsavedChanges } from '../../../core/interfaces/has-unsaved-changes.interface';
import { Validators } from '@angular/forms';

@Component({
  selector: 'app-student-form',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, ToastModule, DynamicFormComponent, ImageUploadComponent],
  templateUrl: './student-form.component.html',
  styleUrl: './student-form.component.scss',
  providers: [MessageService]
})
export class StudentFormComponent implements OnInit, HasUnsavedChanges {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  isEditMode = false;
  editingId: string | null = null;
  initialValues?: Record<string, any>;
  pageTitle = '';
  classes: Class[] = [];
  sections: Section[] = [];
  photoUrl: string = '';

  formConfig!: DynamicFormConfig;

  private formDirty = false;
  private formSubmitted = false;
  private previousClassId: string | null = null;

  hasUnsavedChanges(): boolean {
    return this.formDirty && !this.formSubmitted;
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  ngOnInit(): void {
    this.editingId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.editingId;
    this.pageTitle = this.isEditMode
      ? this.translate.instant('STUDENTS.EDIT')
      : this.translate.instant('STUDENTS.CREATE');

    this.classes = this.storage.get<Class>('classes');
    this.sections = this.storage.get<Section>('sections');
    this.buildForm();

    if (this.isEditMode && this.editingId) {
      const item = this.storage.getById<Student>('students', this.editingId);
      if (item) {
        // Update section options for the stored classId
        this.updateSectionOptions(item.classId);
        this.previousClassId = item.classId;
        this.initialValues = {
          name: item.name,
          rollNumber: item.rollNumber,
          dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : null,
          gender: item.gender,
          classId: item.classId,
          sectionId: item.sectionId,
          parentName: item.parentName,
          parentPhone: item.parentPhone,
          parentEmail: item.parentEmail,
          address: item.address
        };
        this.photoUrl = item.photoUrl ?? '';
      }
    }
  }

  buildForm(selectedClassId?: string): void {
    const classOptions = this.classes.map(c => ({ label: c.name, value: c.id }));
    const sectionOptions = selectedClassId
      ? this.sections.filter(s => s.classId === selectedClassId).map(s => ({ label: s.name, value: s.id }))
      : this.sections.map(s => ({ label: s.name, value: s.id }));

    this.formConfig = {
      fields: [
        { key: 'name', label: 'STUDENTS.NAME', type: 'text', required: true, colSpan: 2, order: 1 },
        { key: 'rollNumber', label: 'STUDENTS.ROLL_NUMBER', type: 'text', required: true, colSpan: 1, order: 2 },
        { key: 'dateOfBirth', label: 'STUDENTS.DATE_OF_BIRTH', type: 'calendar', required: true, colSpan: 1, order: 3 },
        { key: 'gender', label: 'STUDENTS.GENDER', type: 'dropdown', required: true, colSpan: 1, order: 4,
          options: [
            { label: this.translate.instant('STUDENTS.MALE'), value: 'M' },
            { label: this.translate.instant('STUDENTS.FEMALE'), value: 'F' },
            { label: this.translate.instant('STUDENTS.OTHER'), value: 'Other' }
          ]
        },
        { key: 'classId', label: 'STUDENTS.CLASS', type: 'dropdown', required: true, colSpan: 1, order: 5, options: classOptions },
        { key: 'sectionId', label: 'STUDENTS.SECTION', type: 'dropdown', required: true, colSpan: 1, order: 6, options: sectionOptions },
        { key: 'parentName', label: 'STUDENTS.PARENT_NAME', type: 'text', required: true, colSpan: 1, order: 7 },
        { key: 'parentPhone', label: 'STUDENTS.PARENT_PHONE', type: 'text', required: true, colSpan: 1, order: 8 ,
          validators: [Validators.pattern(/^\d{10}$/)],
          hint: '10-digit mobile number'
        },
        { key: 'parentEmail', label: 'STUDENTS.PARENT_EMAIL', type: 'email', required: true, colSpan: 1, order: 9 },
        { key: 'address', label: 'STUDENTS.ADDRESS', type: 'textarea', colSpan: 2, order: 10 }
      ],
      columns: 2,
      submitLabel: 'COMMON.SAVE',
      cancelLabel: 'COMMON.CANCEL'
    };
  }

  updateSectionOptions(classId: string): void {
    const sectionOptions = this.sections
      .filter(s => s.classId === classId)
      .map(s => ({ label: s.name, value: s.id }));
    
    const sectionField = this.formConfig.fields.find(f => f.key === 'sectionId');
    if (sectionField) {
      sectionField.options = sectionOptions;
    }
  }

  onFormChange(values: any): void {
    this.formDirty = true;
    // Only rebuild section options if classId actually changed
    if (values.classId && values.classId !== this.previousClassId) {
      this.previousClassId = values.classId;
      this.updateSectionOptions(values.classId);
    }
  }

  onSubmit(val: any): void {
    const tenantId = this.tenantService.getTenantId();
    const years = this.storage.get<AcademicYear>('academic_years');
    const activeYear = years.find(y => y.isActive);

    const dob = val.dateOfBirth instanceof Date
      ? val.dateOfBirth.toISOString().split('T')[0]
      : val.dateOfBirth;

    if (this.isEditMode && this.editingId) {
      this.storage.update<Student>('students', this.editingId, {
        name: val.name, rollNumber: val.rollNumber, dateOfBirth: dob,
        gender: val.gender, classId: val.classId, sectionId: val.sectionId,
        parentName: val.parentName, parentPhone: val.parentPhone, parentEmail: val.parentEmail, address: val.address,
        photoUrl: this.photoUrl,
        ...getAuditFieldsForUpdate(this.authService)
      });
    } else {
      const newItem: Student = {
        id: 'stu-' + Date.now().toString(36),
        tenantId,
        name: val.name,
        rollNumber: val.rollNumber,
        dateOfBirth: dob,
        gender: val.gender,
        classId: val.classId,
        sectionId: val.sectionId,
        parentName: val.parentName,
        parentPhone: val.parentPhone,
        parentEmail: val.parentEmail,
        address: val.address,
        academicYearId: activeYear?.id ?? '',
        photoUrl: this.photoUrl,
        ...getAuditFieldsForCreate(this.authService)
      };
      this.storage.add('students', newItem);
    }
    this.formSubmitted = true;
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('STUDENTS.SAVED'), life: 3000 });
    setTimeout(() => this.goBack(), 1000);
  }

  onCancel(): void { this.goBack(); }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/students`]);
  }
}
