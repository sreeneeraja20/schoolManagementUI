import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TenantService } from '../../../core/services/tenant.service';

interface ColorOption {
  name: string;
  hex: string;
}

const COLOR_OPTIONS: ColorOption[] = [
  { name: 'Ocean blue',    hex: '#1565C0' },
  { name: 'Forest green',  hex: '#2E7D32' },
  { name: 'Royal purple',  hex: '#6A1B9A' },
  { name: 'Sunset orange', hex: '#E65100' },
  { name: 'Berry pink',    hex: '#AD1457' },
  { name: 'Charcoal',      hex: '#37474F' },
];

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, ToggleSwitchModule],
  templateUrl: './theme-settings.component.html',
  styleUrl: './theme-settings.component.scss'
})
export class ThemeSettingsComponent {
  private tenantService = inject(TenantService);
  colorOptions = COLOR_OPTIONS;
  selectedColor = signal<ColorOption>(
    COLOR_OPTIONS.find(c => c.hex === this.tenantService.currentTenant()?.primaryColor)
    ?? COLOR_OPTIONS[0]
  );
  saving = signal(false);
  saved = signal(false);

  select(color: ColorOption): void {
    this.selectedColor.set(color);
    // Live preview — apply immediately
    this.tenantService.applyTenantTheme(color.hex);
  }

  lighten(hex: string, pct: number): string {
    const n = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (n >> 16) + Math.round((255 - (n >> 16)) * pct));
    const g = Math.min(255, ((n >> 8) & 0xff) + Math.round((255 - ((n >> 8) & 0xff)) * pct));
    const b = Math.min(255, (n & 0xff) + Math.round((255 - (n & 0xff)) * pct));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  }

  save(): void {
    this.saving.set(true);
    this.tenantService.saveTenantTheme(this.tenantService.getTenantSlug(), {
      primaryColor: this.selectedColor().hex
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: () => this.saving.set(false)
    });
  }
}