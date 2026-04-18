import { Injectable } from '@angular/core';
import { ServerSideResult, TableLazyLoadEvent } from '../../shared/components/data-table/data-table.models';

export interface ServerTableQueryOptions<T> {
  globalSearchFields?: string[];
  customFilters?: Record<string, (row: T, value: any) => boolean>;
}

@Injectable({ providedIn: 'root' })
export class ServerTableService {
  query<T extends Record<string, any>>(
    rows: T[],
    request: TableLazyLoadEvent,
    options: ServerTableQueryOptions<T> = {}
  ): ServerSideResult<T> {
    const pageRows = request.rows > 0 ? request.rows : 10;
    const first = request.first >= 0 ? request.first : 0;
    const page = request.page >= 0 ? request.page : Math.floor(first / pageRows);

    let filtered = [...rows];
    const globalSearch = (request.globalSearch ?? '').trim().toLowerCase();
    if (globalSearch && options.globalSearchFields?.length) {
      filtered = filtered.filter(row =>
        options.globalSearchFields!.some(field => String(row[field] ?? '').toLowerCase().includes(globalSearch))
      );
    }

    Object.entries(request.columnFilters ?? {}).forEach(([field, value]) => {
      if (value === undefined || value === null || value === '') return;
      const customFilter = options.customFilters?.[field];
      filtered = filtered.filter(row => {
        if (customFilter) return customFilter(row, value);
        return String(row[field] ?? '').toLowerCase().includes(String(value).toLowerCase());
      });
    });

    if (request.sortField) {
      const order = request.sortOrder === 'desc' ? -1 : 1;
      const sortField = request.sortField;
      filtered.sort((a, b) => {
        const av = a[sortField];
        const bv = b[sortField];
        if (av === bv) return 0;
        if (av === null || av === undefined) return -1 * order;
        if (bv === null || bv === undefined) return 1 * order;
        return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * order;
      });
    }

    const totalRecords = filtered.length;
    const start = page * pageRows;
    const data = filtered.slice(start, start + pageRows);
    return { data, totalRecords };
  }
}
