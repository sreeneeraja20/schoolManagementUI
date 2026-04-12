import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CardModule } from 'primeng/card';
import { TenantService } from '../../core/services/tenant.service';
import { DEFAULT_TENANT_SLUG } from '../../core/constants/app.constants';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink, CardModule],
  templateUrl: './not-found.component.html',
  styleUrl: './not-found.component.scss'
})
export class NotFoundComponent {
  private tenantService = inject(TenantService);
  get tenantSlug(): string { return this.tenantService.getTenantSlug() || DEFAULT_TENANT_SLUG; }
}
