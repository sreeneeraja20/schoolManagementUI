import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { StorageService } from '../../../core/services/storage.service';
import { TenantService } from '../../../core/services/tenant.service';
import { SchoolEvent } from '../../../core/models/event.model';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: SchoolEvent[];
}

@Component({
  selector: 'app-event-calendar',
  standalone: true,
  imports: [CommonModule, TranslateModule, ButtonModule, CardModule, TagModule],
  templateUrl: './event-calendar.component.html',
  styleUrl: './event-calendar.component.scss'
})
export class EventCalendarComponent implements OnInit {
  private storage = inject(StorageService);
  private tenantService = inject(TenantService);
  private router = inject(Router);

  currentDate = new Date();
  currentYear = this.currentDate.getFullYear();
  currentMonth = this.currentDate.getMonth();

  weeks: CalendarDay[][] = [];
  selectedDate: Date | null = null;
  selectedDateEvents: SchoolEvent[] = [];

  events: SchoolEvent[] = [];

  dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.events = this.storage.get<SchoolEvent>('events');
    this.buildCalendar();
  }

  get monthLabel(): string {
    const d = new Date(this.currentYear, this.currentMonth, 1);
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.buildCalendar();
  }

  buildCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: CalendarDay[] = [];

    // Fill days from previous month to align first day of week
    const startDow = firstDay.getDay();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = new Date(this.currentYear, this.currentMonth, -i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, events: this.getEventsForDate(d) });
    }

    // Current month days
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.currentYear, this.currentMonth, d);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        events: this.getEventsForDate(date)
      });
    }

    // Fill trailing days from next month to complete 6-week grid
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({ date: d, isCurrentMonth: false, isToday: false, events: this.getEventsForDate(d) });
    }

    // Split into weeks of 7
    this.weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      this.weeks.push(days.slice(i, i + 7));
    }

    // Refresh selected date events if a date is already selected
    if (this.selectedDate) {
      this.selectedDateEvents = this.getEventsForDate(this.selectedDate);
    }
  }

  getEventsForDate(date: Date): SchoolEvent[] {
    const dateStr = date.toISOString().split('T')[0];
    return this.events.filter(e => e.startDate <= dateStr && e.endDate >= dateStr);
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate = day.date;
    this.selectedDateEvents = day.events;
  }

  getEventBadgeSeverity(type: string): any {
    switch (type) {
      case 'holiday': return 'info';
      case 'exam': return 'warn';
      case 'event': return 'success';
      default: return 'secondary';
    }
  }

  goToList(): void {
    const slug = this.tenantService.getTenantSlug();
    this.router.navigate([`/${slug}/events`]);
  }
}
