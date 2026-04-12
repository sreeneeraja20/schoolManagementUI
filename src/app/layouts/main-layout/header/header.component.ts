import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TenantService } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonModule, MenuModule, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  @Output() toggleSidebar = new EventEmitter<void>();

  private authService = inject(AuthService);
  private i18nService = inject(I18nService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  get currentLang(): string { return this.i18nService.getCurrentLang(); }
  get userName(): string { return this.authService.getCurrentUser()?.name ?? ''; }
  get userInitials(): string {
    const name = this.userName;
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  userMenuItems: MenuItem[] = [
    { label: 'Change Password', icon: 'pi pi-key', command: () => this.goToChangePassword() },
    { label: 'Logout', icon: 'pi pi-sign-out', command: () => this.authService.logout() }
  ];

  setLang(lang: 'en' | 'ta'): void { this.i18nService.setLanguage(lang); }

  private goToChangePassword(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/change-password`]);
  }
}
