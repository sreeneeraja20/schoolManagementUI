import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { StorageService } from '../../core/services/storage.service';
import { TenantService } from '../../core/services/tenant.service';
import { SeedDataService } from '../../core/services/seed-data.service';
import { SetupBannerComponent } from '../../shared/components/setup-banner/setup-banner.component';
import { AcademicYear } from '../../core/models/academic-year.model';
import { Class } from '../../core/models/class.model';
import { Section } from '../../core/models/section.model';
import { Subject } from '../../core/models/subject.model';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, CardModule, ButtonModule, TranslateModule, SetupBannerComponent],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss'
})
export class SetupComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private seedService = inject(SeedDataService);
  private router = inject(Router);

  academicYearCount = signal(0);
  classCount = signal(0);
  sectionCount = signal(0);
  subjectCount = signal(0);
  hasActiveYear = signal(false);

  cards = [
    { key: 'academic-years', icon: 'pi-calendar', labelKey: 'SETUP.ACADEMIC_YEARS', countFn: () => this.academicYearCount() },
    { key: 'classes', icon: 'pi-building', labelKey: 'SETUP.CLASSES', countFn: () => this.classCount() },
    { key: 'sections', icon: 'pi-list', labelKey: 'SETUP.SECTIONS', countFn: () => this.sectionCount() },
    { key: 'subjects', icon: 'pi-book', labelKey: 'SETUP.SUBJECTS', countFn: () => this.subjectCount() },
  ];

  ngOnInit(): void {
    this.seedService.seed();
    this.loadCounts();
  }

  private loadCounts(): void {
    this.academicYearCount.set(this.storage.get<AcademicYear>('academic_years').length);
    this.classCount.set(this.storage.get<Class>('classes').length);
    this.sectionCount.set(this.storage.get<Section>('sections').length);
    this.subjectCount.set(this.storage.get<Subject>('subjects').length);
    const years = this.storage.get<AcademicYear>('academic_years');
    this.hasActiveYear.set(years.some(y => y.isActive));
  }

  navigate(path: string): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/setup/${path}`]);
  }
}

