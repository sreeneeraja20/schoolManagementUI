import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { passwordMatchValidator } from '../../../shared/validators/password.validators';
import { handleImageError } from '../../../shared/utils/image.utils';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonModule, PasswordModule, TranslateModule],
  templateUrl: './change-password.component.html',
  styleUrl: './change-password.component.scss'
})
export class ChangePasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  changePasswordForm!: FormGroup;
  loading = false;

  get tenantSlug(): string { return this.tenantService.getTenantSlug(); }
  get schoolName(): string { return this.tenantService.currentTenant()?.schoolName ?? ''; }
  get tenantLogo(): string { return this.tenantService.currentTenant()?.logo ?? ''; }

  ngOnInit(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: success => {
        this.loading = false;
        if (success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password changed successfully', life: 3000 });
          setTimeout(() => this.router.navigate([`/${this.tenantSlug}/dashboard`]), 1500);
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Current password is incorrect', life: 4000 });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to change password', life: 4000 });
      }
    });
  }

  onCancel(): void { this.authService.logout(); }
  onImgError(event: Event): void { handleImageError(event); }
}
