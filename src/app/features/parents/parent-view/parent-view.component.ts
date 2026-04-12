import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import { ParentService } from '../parent.service';
import { ParentAccount } from '../../../core/models/parent.model';
import { Student } from '../../../core/models/student.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';

interface LinkedStudent {
  id: string;
  name: string;
  rollNumber: string;
  className: string;
  sectionName: string;
}

@Component({
  selector: 'app-parent-view',
  standalone: true,
  imports: [CommonModule, RouterModule, TranslateModule, ButtonModule, CardModule, DividerModule, TagModule, ToastModule, ConfirmDialogModule, DialogModule],
  templateUrl: './parent-view.component.html',
  styleUrl: './parent-view.component.scss',
  providers: [MessageService, ConfirmationService]
})
export class ParentViewComponent implements OnInit {
  private parentService = inject(ParentService);
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  private translate = inject(TranslateService);

  parent: ParentAccount | null = null;
  linkedStudents: LinkedStudent[] = [];

  showPasswordDialog = false;
  newPassword = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.parent = this.parentService.getById(id);
      if (this.parent) {
        this.loadLinkedStudents(this.parent.studentIds);
      }
    }
  }

  private loadLinkedStudents(studentIds: string[]): void {
    const students = this.storage.get<Student>('students');
    const classes = this.storage.get<Class>('classes');
    const sections = this.storage.get<Section>('sections');

    this.linkedStudents = studentIds.map(sid => {
      const s = students.find(st => st.id === sid);
      if (!s) return null;
      return {
        id: s.id,
        name: s.name,
        rollNumber: s.rollNumber,
        className: classes.find(c => c.id === s.classId)?.name ?? '',
        sectionName: sections.find(sec => sec.id === s.sectionId)?.name ?? ''
      };
    }).filter(Boolean) as LinkedStudent[];
  }

  getLoginStatusSeverity(): string {
    if (!this.parent?.isActive) return 'danger';
    if (!this.parent?.lastLoginAt) return 'warn';
    return 'success';
  }

  getLoginStatusLabel(): string {
    if (!this.parent?.isActive) return this.translate.instant('PARENTS.INACTIVE');
    if (!this.parent?.lastLoginAt) return this.translate.instant('PARENTS.NEVER_LOGGED_IN');
    return this.translate.instant('PARENTS.ACTIVE');
  }

  onEdit(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents/edit/${this.parent!.id}`]);
  }

  onResetPassword(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('PARENTS.RESET_PASSWORD_CONFIRM'),
      accept: () => {
        const newPwd = this.parentService.resetPassword(this.parent!.id);
        this.parent = this.parentService.getById(this.parent!.id);
        this.newPassword = newPwd;
        this.showPasswordDialog = true;
      }
    });
  }

  onToggleActive(): void {
    const action = this.parent?.isActive
      ? this.translate.instant('PARENTS.DEACTIVATE')
      : this.translate.instant('PARENTS.ACTIVATE');
    this.confirmationService.confirm({
      message: `${action} this parent account?`,
      accept: () => {
        this.parentService.toggleActive(this.parent!.id);
        this.parent = this.parentService.getById(this.parent!.id);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: this.parent?.isActive
            ? this.translate.instant('PARENTS.ACTIVE')
            : this.translate.instant('PARENTS.INACTIVE'),
          life: 3000
        });
      }
    });
  }

  onDelete(): void {
    this.confirmationService.confirm({
      message: this.translate.instant('PARENTS.CONFIRM_DELETE'),
      accept: () => {
        this.parentService.delete(this.parent!.id);
        this.messageService.add({
          severity: 'success',
          summary: this.translate.instant('SETUP.SUCCESS'),
          detail: this.translate.instant('PARENTS.DELETED_SUCCESS'),
          life: 2000
        });
        setTimeout(() => this.goBack(), 1500);
      }
    });
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.newPassword);
    this.messageService.add({
      severity: 'success',
      summary: this.translate.instant('SETUP.SUCCESS'),
      detail: this.translate.instant('PARENTS.COPIED'),
      life: 2000
    });
  }

  viewStudent(id: string): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/students/view/${id}`]);
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/parents`]);
  }
}
