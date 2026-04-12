import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, map } from 'rxjs';
import { Tenant } from '../models/tenant.model';
import { usePreset } from '@primeng/themes';
import Aura from '@primeng/themes/aura';
@Injectable({ providedIn: 'root' })
export class TenantService {
  private http = inject(HttpClient);
  currentTenant = signal<Tenant | null>(null);

  loadTenant(slug: string): Observable<Tenant | null> {
    return this.http.get<Tenant[]>('/assets/mock/tenants.json').pipe(
      map(tenants => tenants.find(t => t.slug === slug) ?? null),
      tap(tenant => {
        if (tenant) {
          this.currentTenant.set(tenant);
          this.applyTenantTheme(tenant.primaryColor);
        }
      })
    );
  }
  saveTenantTheme(slug: string, colors: Partial<Tenant>) {
    return this.http.patch<Tenant>(`/api/tenants/${slug}/theme`, colors).pipe(
      tap(updated => {
        this.currentTenant.set(updated);
        this.applyTenantTheme(updated.primaryColor);
      })
    );
  }

  applyTenantTheme(primaryColor: string): void {
    // 1. CSS variable — for your own SCSS
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--p-primary-color', primaryColor);
    document.documentElement.style.setProperty('--p-button-primary-background', primaryColor);
    document.documentElement.style.setProperty('--p-button-primary-hover-background', this.adjustColor(primaryColor, -20));
    document.documentElement.style.setProperty('--p-button-primary-active-background', this.adjustColor(primaryColor, -30));
    document.documentElement.style.setProperty('--p-button-primary-border-color', primaryColor);
    document.documentElement.style.setProperty('--p-button-primary-hover-border-color', this.adjustColor(primaryColor, -20));

    // 2. PrimeNG design tokens — for all PrimeNG components
    usePreset({
      ...Aura,
      semantic: {
        ...Aura.semantic,
        primary: {
          color: primaryColor,
          contrastColor: '#ffffff',
          hoverColor: this.adjustColor(primaryColor, -20),
          activeColor: this.adjustColor(primaryColor, -30),
        }
      }
    });
  }

  private adjustColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }
  getTenantId(): string {
    return this.currentTenant()?.id ?? '';
  }

  getTenantSlug(): string {
    return this.currentTenant()?.slug ?? '';
  }
}
