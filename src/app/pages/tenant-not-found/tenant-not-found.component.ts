import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tenant-not-found',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule],
  templateUrl: './tenant-not-found.component.html',
  styleUrl: './tenant-not-found.component.scss'
})
export class TenantNotFoundComponent {}
