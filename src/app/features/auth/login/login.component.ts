import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { handleImageError } from '../../../shared/utils/image.utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, ButtonModule, InputTextModule, PasswordModule, CheckboxModule, TranslateModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  loginForm!: FormGroup;
  loading = false;

  get tenantSlug(): string { return this.tenantService.getTenantSlug(); }
  get schoolName(): string { return this.tenantService.currentTenant()?.schoolName ?? 'School'; }
  get tenantLogo(): string { return this.tenantService.currentTenant()?.logo ?? ''; }
  get bgImageStyle(): string {
    const img = this.tenantService.currentTenant()?.loginBgImage;
    return img ? `url(${img})` : '';
  }
  get bgFallback(): string {
    const p = this.tenantService.currentTenant()?.primaryColor ?? '#2E7D32';
    const s = this.tenantService.currentTenant()?.secondaryColor ?? '#1565C0';
    return `linear-gradient(135deg, ${p}, ${s})`;
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      rememberMe: [false]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.loading = true;
    const { email, password } = this.loginForm.value;
    const tenantId = this.tenantService.getTenantId();

    this.authService.login(email, password, tenantId).subscribe({
      next: result => {
        this.loading = false;
        if (result.success && result.user) {
          if (result.user.isFirstLogin) {
            this.router.navigate([`/${this.tenantSlug}/change-password`]);
          } else {
            this.router.navigate([`/${this.tenantSlug}/dashboard`]);
          }
        } else {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Invalid email or password', life: 4000 });
        }
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Login failed', life: 4000 });
      }
    });
  }

  onImgError(event: Event): void { handleImageError(event); }
}
