import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { StepsModule } from 'primeng/steps';
import { MenuItem, MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { passwordMatchValidator } from '../../../shared/validators/password.validators';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardModule, ButtonModule, InputTextModule, PasswordModule, StepsModule, RouterLink, TranslateModule],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  activeStep = 0;
  loading = false;
  emailForm!: FormGroup;
  otpForm!: FormGroup;
  resetForm!: FormGroup;

  steps: MenuItem[] = [
    { label: 'Email' },
    { label: 'Verify OTP' },
    { label: 'New Password' }
  ];

  get tenantSlug(): string { return this.tenantService.getTenantSlug(); }

  ngOnInit(): void {
    this.emailForm = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
    this.otpForm = this.fb.group({ otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]] });
    this.resetForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: passwordMatchValidator });
  }

  onSendOtp(): void {
    if (this.emailForm.invalid) { this.emailForm.markAllAsTouched(); return; }
    this.loading = true;
    this.authService.forgotPassword(this.emailForm.value.email).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'OTP sent to your email', life: 3000 });
        this.activeStep = 1;
      }
    });
  }

  onVerifyOtp(): void {
    if (this.otpForm.invalid) { this.otpForm.markAllAsTouched(); return; }
    this.loading = true;
    this.authService.verifyOtp(this.otpForm.value.otp).subscribe({
      next: success => {
        this.loading = false;
        if (success) {
          this.messageService.add({ severity: 'success', summary: 'Success', detail: 'OTP verified', life: 3000 });
          this.activeStep = 2;
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid OTP', life: 4000 });
        }
      }
    });
  }

  onResetPassword(): void {
    if (this.resetForm.invalid) { this.resetForm.markAllAsTouched(); return; }
    this.loading = true;
    const email = this.emailForm.value.email;
    this.authService.resetPassword(email, this.resetForm.value.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password reset successfully', life: 3000 });
        setTimeout(() => this.router.navigate([`/${this.tenantSlug}/login`]), 1500);
      }
    });
  }
}
