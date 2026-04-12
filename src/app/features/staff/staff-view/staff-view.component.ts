import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { Staff } from '../../../core/models/staff.model';
import { Subject } from '../../../core/models/subject.model';
import { TimetableSlot } from '../../../core/models/timetable.model';
import { ImageUploadComponent } from '../../../shared/components/image-upload/image-upload.component';

@Component({
  selector: 'app-staff-view',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, DividerModule, TagModule, ImageUploadComponent],
  templateUrl: './staff-view.component.html',
  styleUrl: './staff-view.component.scss'
})
export class StaffViewComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  staff: Staff | null = null;
  subjectNames: string = '';
  initials: string = '';
  timetableSlots: TimetableSlot[] = [];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.staff = this.storage.getById<Staff>('staff', id);
      if (this.staff) {
        this.initials = this.getInitials(this.staff.name);
        const subjects = this.storage.get<Subject>('subjects');
        this.subjectNames = (this.staff.subjectIds ?? [])
          .map(sid => subjects.find(s => s.id === sid)?.name ?? sid)
          .join(', ');
        this.timetableSlots = this.storage.get<TimetableSlot>('timetable')
          .filter(t => t.staffId === id);
      }
    }
  }

  private getInitials(name: string): string {
    return name.split(' ').filter(n => n.length > 0).map(n => n[0]).join('').toUpperCase().substring(0, 2);
  }

  getRoleSeverity(role: string): 'danger' | 'info' {
    return role === 'ADMIN' ? 'danger' : 'info';
  }

  onEdit(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff/edit/${this.staff!.id}`]);
  }

  goBack(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/staff`]);
  }
}
