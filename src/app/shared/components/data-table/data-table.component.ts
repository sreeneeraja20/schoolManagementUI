import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ContentChild, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DropdownModule } from 'primeng/dropdown';
import { MultiSelectModule } from 'primeng/multiselect';
import { CalendarModule } from 'primeng/calendar';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { TableColumn, TableConfig, TableSortEvent, TableFilterEvent, TablePageEvent } from './data-table.models';
import { Menu, MenuModule } from 'primeng/menu';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
  imports: [
    CommonModule, FormsModule, TranslateModule,
    TableModule, ButtonModule, InputTextModule, DropdownModule,
    MultiSelectModule, MenuModule, CalendarModule, TagModule, TooltipModule
  ]
})
export class DataTableComponent implements OnInit, OnDestroy {
  @Input() config!: TableConfig;
  @Input() data: any[] = [];
  @Input() totalRecords = 0;
  @Input() loading = false;
  @Input() simulateApiDelay = true;
  @Input() apiDelayMs = 900;

  @Output() sortChange = new EventEmitter<TableSortEvent>();
  @Output() filterChange = new EventEmitter<TableFilterEvent>();
  @Output() pageChange = new EventEmitter<TablePageEvent>();
  @Output() addClick = new EventEmitter<void>();
  @Output() editClick = new EventEmitter<any>();
  @Output() deleteClick = new EventEmitter<any>();
  @Output() viewClick = new EventEmitter<any>();
  @Output() toggleActiveClick = new EventEmitter<any>();
  @Output() resetPasswordClick = new EventEmitter<any>();
  @Output() rowSelect = new EventEmitter<any[]>();
  @ViewChild('menu') menu!: Menu;

  globalSearchValue = '';
  columnFilters: Record<string, any> = {};
  currentSort: { field: string; order: number } | null = null;
  booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
  ];
  menuItems: MenuItem[] = [];
  readonly minVisibleRows = 5;
  readonly rowHeightRem = 3.2;
  private initialLoading = true;
  private initialLoadingTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private cdr: ChangeDetectorRef) { }
  
  private searchSubject = new Subject<string>();

  ngOnInit(): void {
    this.searchSubject.pipe(debounceTime(300), distinctUntilChanged()).subscribe(() => {
      this.emitFilter();
    });

    if (this.simulateApiDelay) {
      this.initialLoadingTimer = setTimeout(() => {
        this.initialLoading = false;
      }, this.apiDelayMs);
      return;
    }

    this.initialLoading = false;
  }

  ngOnDestroy(): void {
    this.searchSubject.complete();
    if (this.initialLoadingTimer) {
      clearTimeout(this.initialLoadingTimer);
    }
  }

  get tableLoading(): boolean {
    return this.loading || this.initialLoading;
  }

  get spacerRows(): number {
    const renderedRows = this.data.length === 0 ? 1 : this.data.length;
    return Math.max(0, this.minVisibleRows - renderedRows);
  }

  get spacerHeightRem(): number {
    return this.spacerRows * this.rowHeightRem;
  }

  get defaultRows(): number {
    return this.config?.defaultRows ?? 10;
  }

  get rowsPerPage(): number[] {
    return this.config?.rowsPerPage ?? [10, 25, 50];
  }

  get dataKey(): string {
    return this.config?.dataKey ?? 'id';
  }

  onGlobalSearch(value: string): void {
    this.globalSearchValue = value;
    this.searchSubject.next(value);
  }

  onColumnFilter(field: string, value: any): void {
    this.columnFilters[field] = value;
    this.emitFilter();
  }

  onSort(event: any): void {
    if (event.field) {
      this.sortChange.emit({ field: event.field, order: event.order === 1 ? 'asc' : 'desc' });
    }
  }

  onPage(event: any): void {
    this.pageChange.emit({ page: Math.floor(event.first / event.rows), rows: event.rows, first: event.first });
  }

  private emitFilter(): void {
    this.filterChange.emit({ globalSearch: this.globalSearchValue, columnFilters: { ...this.columnFilters } });
  }

  getBadgeLabel(col: TableColumn, value: any): string {
    const key = String(value);
    return col.badgeMap?.[key]?.label ?? key;
  }

  getBadgeSeverity(col: TableColumn, value: any): any {
    const key = String(value);
    return col.badgeMap?.[key]?.severity ?? 'info';
  }

  getListValue(value: any): string {
    if (Array.isArray(value)) return value.join(', ');
    return value ?? '';
  }

  hasFilterableColumns(): boolean {
    return this.config?.columns?.some(c => c.filterable) ?? false;
  }

  onMenuClick(event: MouseEvent, row: any) {
    const target = event.currentTarget as HTMLElement; // capture before async

    this.menuItems = this.getActionItems(row);
    this.cdr.detectChanges();

    setTimeout(() => {
      this.menu.toggle({ currentTarget: target, target } as any);
    }, 0);
  }
  getActionItems(row: any): MenuItem[] {
    const items: MenuItem[] = [];
    this.config?.actions?.forEach(action => {
      if (action === 'view') {
        items.push({ label: 'View', icon: 'pi pi-eye', command: () => this.viewClick.emit(row) });
      } else if (action === 'edit') {
        items.push({ label: 'Edit', icon: 'pi pi-pencil', command: () => this.editClick.emit(row) });
      } else if (action === 'delete') {
        items.push({ label: 'Delete', icon: 'pi pi-trash', command: () => this.deleteClick.emit(row) });
      } else if (action === 'resetPassword') {
        items.push({ label: 'Reset Password', icon: 'pi pi-refresh', command: () => this.resetPasswordClick.emit(row) });
      } else if (action === 'toggleActive') {
        const isActive = row['isActive'];
        items.push({ label: isActive ? 'Deactivate' : 'Activate', icon: isActive ? 'pi pi-times' : 'pi pi-check', command: () => this.toggleActiveClick.emit(row) });
      }
    });
    return items;
  }
  hasAction(action: 'edit' | 'delete' | 'view'): boolean {
    return this.config?.actions?.includes(action) ?? false;
  }
}
