export interface TableColumn {
  field: string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  filterType?: 'text' | 'dropdown' | 'date' | 'multiSelect' | 'boolean';
  filterOptions?: { label: string; value: any }[];
  type?: 'text' | 'date' | 'badge' | 'list' | 'custom';
  badgeMap?: Record<string, { label: string; severity: string }>;
  width?: string;
  frozen?: boolean;
  dateFormat?: string;
  customTemplate?: string;
}

export interface TableConfig {
  columns: TableColumn[];
  globalSearch?: boolean;
  paginator?: boolean;
  rowsPerPage?: number[];
  defaultRows?: number;
  showAddButton?: boolean;
  addButtonLabel?: string;
  actions?: ('edit' | 'delete' | 'view' | 'resetPassword' | 'toggleActive')[];
  selectable?: boolean;
  emptyMessage?: string;
  responsive?: boolean;
  dataKey?: string;
}

export interface TableSortEvent {
  field: string;
  order: 'asc' | 'desc';
}

export interface TableFilterEvent {
  globalSearch?: string;
  columnFilters: Record<string, any>;
}

export interface TablePageEvent {
  page: number;
  rows: number;
  first: number;
}
