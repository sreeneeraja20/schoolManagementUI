import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DropdownModule } from 'primeng/dropdown';
import { ToastModule } from 'primeng/toast';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { MessageService } from 'primeng/api';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { AuthService } from '../../../core/services/auth.service';
import { TimetableSlot } from '../../../core/models/timetable.model';
import { Class } from '../../../core/models/class.model';
import { Section } from '../../../core/models/section.model';
import { Subject } from '../../../core/models/subject.model';
import { Staff } from '../../../core/models/staff.model';
import { getAuditFieldsForCreate } from '../../../shared/utils/audit.util';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface EditableCell {
  period: number;
  day: string;
  subjectId: string;
  staffId: string;
  subjectName: string;
  staffName: string;
}

@Component({
  selector: 'app-timetable-builder',
  standalone: true,
  imports: [
    CommonModule, FormsModule, TranslateModule,
    ButtonModule, CardModule, DropdownModule, ToastModule, OverlayPanelModule
  ],
  templateUrl: './timetable-builder.component.html',
  styleUrl: './timetable-builder.component.scss',
  providers: [MessageService]
})
export class TimetableBuilderComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private translate = inject(TranslateService);

  classes: Class[] = [];
  sections: Section[] = [];
  subjects: Subject[] = [];
  staff: Staff[] = [];

  classOptions: { label: string; value: string }[] = [];
  sectionOptions: { label: string; value: string }[] = [];
  subjectOptions: { label: string; value: string }[] = [];
  staffOptions: { label: string; value: string }[] = [];

  selectedClassId: string | null = null;
  selectedSectionId: string | null = null;

  days = DAYS;
  periods = PERIODS;

  // Grid stores cells as [period][day]
  grid: Record<number, Record<string, EditableCell>> = {};

  // Currently editing cell
  editingCell: EditableCell | null = null;

  ngOnInit(): void {
    this.classes = this.storage.get<Class>('classes');
    this.sections = this.storage.get<Section>('sections');
    this.subjects = this.storage.get<Subject>('subjects');
    this.staff = this.storage.get<Staff>('staff');
    this.classOptions = this.classes.map(c => ({ label: c.name, value: c.id }));
    this.subjectOptions = this.subjects.map(s => ({ label: s.name, value: s.id }));
    this.staffOptions = this.staff.map(s => ({ label: s.name, value: s.id }));
  }

  onClassChange(classId: string): void {
    this.selectedClassId = classId;
    this.selectedSectionId = null;
    this.sectionOptions = this.sections.filter(s => s.classId === classId).map(s => ({ label: s.name, value: s.id }));
    this.grid = {};
  }

  onSectionChange(sectionId: string): void {
    this.selectedSectionId = sectionId;
    this.buildGrid();
  }

  buildGrid(): void {
    const slots = this.storage.get<TimetableSlot>('timetable').filter(
      s => s.classId === this.selectedClassId && s.sectionId === this.selectedSectionId
    );

    const newGrid: Record<number, Record<string, EditableCell>> = {};
    for (const period of this.periods) {
      newGrid[period] = {};
      for (const day of this.days) {
        const slot = slots.find(s => s.period === period && s.day === day);
        newGrid[period][day] = {
          period,
          day,
          subjectId: slot?.subjectId ?? '',
          staffId: slot?.staffId ?? '',
          subjectName: slot ? (this.subjects.find(sub => sub.id === slot.subjectId)?.name ?? '') : '',
          staffName: slot ? (this.staff.find(stf => stf.id === slot.staffId)?.name ?? '') : ''
        };
      }
    }
    this.grid = newGrid;
  }

  startEdit(cell: EditableCell): void {
    this.editingCell = { ...cell };
  }

  cancelEdit(): void {
    this.editingCell = null;
  }

  applyEdit(): void {
    if (!this.editingCell) return;
    const { period, day, subjectId, staffId } = this.editingCell;

    // Check for conflict: same staff, same period, same day, different class/section
    if (staffId) {
      const allSlots = this.storage.get<TimetableSlot>('timetable');
      const conflict = allSlots.find(s =>
        s.staffId === staffId &&
        s.period === period &&
        s.day === day &&
        !(s.classId === this.selectedClassId && s.sectionId === this.selectedSectionId)
      );
      if (conflict) {
        this.messageService.add({ severity: 'warn', summary: this.translate.instant('SETUP.ERROR'), detail: this.translate.instant('TIMETABLE.CONFLICT'), life: 4000 });
        return;
      }
    }

    // Update local grid
    this.grid[period][day] = {
      ...this.grid[period][day],
      subjectId,
      staffId,
      subjectName: this.subjects.find(s => s.id === subjectId)?.name ?? '',
      staffName: this.staff.find(s => s.id === staffId)?.name ?? ''
    };
    this.editingCell = null;
  }

  saveAll(): void {
    if (!this.selectedClassId || !this.selectedSectionId) return;
    const tenantId = this.tenantService.getTenantId();

    // Remove existing slots for this class/section
    const allSlots = this.storage.get<TimetableSlot>('timetable').filter(
      s => !(s.classId === this.selectedClassId && s.sectionId === this.selectedSectionId)
    );

    // Build new slots from grid (only where subjectId is set)
    const newSlots: TimetableSlot[] = [];
    for (const period of this.periods) {
      for (const day of this.days) {
        const cell = this.grid[period]?.[day];
        if (cell?.subjectId) {
          newSlots.push({
            id: `tt-${this.selectedClassId}-${this.selectedSectionId}-${day}-${period}`,
            tenantId,
            classId: this.selectedClassId,
            sectionId: this.selectedSectionId,
            day,
            period,
            subjectId: cell.subjectId,
            staffId: cell.staffId,
            ...getAuditFieldsForCreate(this.authService)
          });
        }
      }
    }

    this.storage.set('timetable', [...allSlots, ...newSlots]);
    this.messageService.add({ severity: 'success', summary: this.translate.instant('SETUP.SUCCESS'), detail: this.translate.instant('TIMETABLE.SAVED'), life: 3000 });
  }

  goToView(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/timetable`]);
  }

  getDayKey(day: string): string {
    return `TIMETABLE.${day.toUpperCase()}`;
  }
}
