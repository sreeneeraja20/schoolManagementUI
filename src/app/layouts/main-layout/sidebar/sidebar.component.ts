import { Component, inject, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { handleImageError, DEFAULT_LOGO_SVG } from '../../../shared/utils/image.utils';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

interface NavGroup {
  section: string;
  items: NavItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
  @Input() collapsed = false;
  @Input() mobileOpen = false;
  @Output() collapsedChange = new EventEmitter<boolean>();
  @Output() mobileOpenChange = new EventEmitter<boolean>();

  private authService = inject(AuthService);
  private tenantService = inject(TenantService);

  get tenantSlug(): string { return this.tenantService.getTenantSlug(); }
  get tenantName(): string { return this.tenantService.currentTenant()?.schoolName ?? ''; }
  get tenantLogo(): string { return this.tenantService.currentTenant()?.logo ?? ''; }

  navGroups: NavGroup[] = [
    {
      section: 'SIDEBAR.OVERVIEW',
      items: [
        { label: 'SIDEBAR.DASHBOARD', icon: 'pi pi-home', route: 'dashboard', roles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      section: 'SIDEBAR.MANAGE',
      items: [
        { label: 'SIDEBAR.STUDENTS', icon: 'pi pi-user', route: 'students', roles: ['ADMIN', 'TEACHER'] },
        { label: 'SIDEBAR.STAFF', icon: 'pi pi-id-card', route: 'staff', roles: ['ADMIN'] },
        { label: 'SIDEBAR.USERS', icon: 'pi pi-key', route: 'users', roles: ['ADMIN'] },
        { label: 'SIDEBAR.PARENTS', icon: 'pi pi-users', route: 'parents', roles: ['ADMIN'] },
        { label: 'SIDEBAR.TIMETABLE', icon: 'pi pi-calendar', route: 'timetable', roles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      section: 'SIDEBAR.ACADEMIC',
      items: [
        { label: 'SIDEBAR.ATTENDANCE', icon: 'pi pi-check-square', route: 'attendance', roles: ['ADMIN', 'TEACHER'] },
        { label: 'SIDEBAR.EXAMS', icon: 'pi pi-file-edit', route: 'exams', roles: ['ADMIN', 'TEACHER'] },
        { label: 'SIDEBAR.EVENTS', icon: 'pi pi-flag', route: 'events', roles: ['ADMIN', 'TEACHER'] },
      ]
    },
    {
      section: 'SIDEBAR.SCHOOL',
      items: [
        { label: 'SIDEBAR.SETUP', icon: 'pi pi-cog', route: 'setup', roles: ['ADMIN'] },
        { label: 'SIDEBAR.THEME', icon: 'pi pi-cog', route: 'theme', roles: ['ADMIN'] },
      ]
    }
  ];

  filteredNavGroups: NavGroup[] = [];

  ngOnInit(): void {
    this.filteredNavGroups = this.getFilteredNavGroups();

  }

  private getFilteredNavGroups(): NavGroup[] {
    const role = this.authService.getRole() ?? '';
    return this.navGroups
      .map(group => ({
        ...group,
        items: group.items.filter(item => item.roles.includes(role))
      }))
      .filter(group => group.items.length > 0);
  }


  toggleCollapse(): void {
    this.collapsed = !this.collapsed;
    this.collapsedChange.emit(this.collapsed);
  }

  closeMobile(): void {
    this.mobileOpen = false;
    this.mobileOpenChange.emit(false);
  }

  onImgError(event: Event): void { handleImageError(event, DEFAULT_LOGO_SVG); }
}
