import { Injectable, inject } from '@angular/core';
import { TenantService } from './tenant.service';
import { ServerSideResult, TableLazyLoadEvent } from '../../shared/components/data-table/data-table.models';

export interface StoragePageOptions<T> {
  globalSearchFields?: string[];
  customFilters?: Record<string, (row: T, value: any) => boolean>;
  globalSearchPredicate?: (row: T, searchText: string) => boolean;
  fixedFilters?: Record<string, any>;
}

@Injectable({ providedIn: 'root' })
export class StorageService {
  private tenantService = inject(TenantService);

  private key(name: string): string {
    return `${this.tenantService.getTenantSlug()}_${name}`;
  }

  get<T>(key: string): T[] {
    try {
      const data = localStorage.getItem(this.key(key));
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`[StorageService] Failed to read key "${key}":`, error);
      return [];
    }
  }

  getPage<T extends Record<string, any>>(
    key: string,
    params: TableLazyLoadEvent,
    options: StoragePageOptions<T> = {}
  ): ServerSideResult<T> {
    const rows = this.get<T>(key);
    const pageRows = Math.max(1, params.rows || 10);
    const first = params.first >= 0 ? params.first : 0;
    const page = params.page >= 0 ? params.page : Math.floor(first / pageRows);

    let filtered = [...rows];
    const globalSearch = (params.globalSearch ?? '').trim().toLowerCase();
    if (globalSearch) {
      if (options.globalSearchPredicate) {
        filtered = filtered.filter(row => options.globalSearchPredicate?.(row, globalSearch) ?? false);
      } else if ((options.globalSearchFields?.length ?? 0) > 0) {
        filtered = filtered.filter(row =>
          (options.globalSearchFields ?? []).some(field =>
            String(row[field] ?? '').toLowerCase().includes(globalSearch)
          )
        );
      }
    }

    const allFilters = { ...(options.fixedFilters ?? {}), ...(params.columnFilters ?? {}) };
    Object.entries(allFilters).forEach(([field, value]) => {
      if (value === undefined || value === null || value === '') return;
      const customFilter = options.customFilters?.[field];
      filtered = filtered.filter(row => {
        if (customFilter) return customFilter(row, value);
        return String(row[field] ?? '').toLowerCase().includes(String(value).toLowerCase());
      });
    });

    if (params.sortField) {
      const order = params.sortOrder === 'desc' ? -1 : 1;
      const sortField = params.sortField;
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
    return {
      data: filtered.slice(start, start + pageRows),
      totalRecords
    };
  }

  set<T>(key: string, data: T[]): void {
    localStorage.setItem(this.key(key), JSON.stringify(data));
  }

  getById<T extends { id: string }>(key: string, id: string): T | null {
    return this.get<T>(key).find(item => item.id === id) ?? null;
  }

  add<T>(key: string, item: T): void {
    const data = this.get<T>(key);
    data.push(item);
    this.set(key, data);
  }

  update<T extends { id: string }>(key: string, id: string, item: Partial<T>): void {
    const data = this.get<T>(key).map(existing =>
      existing.id === id ? { ...existing, ...item } : existing
    );
    this.set(key, data);
  }

  delete(key: string, id: string): void {
    const data = this.get<{ id: string }>(key).filter(item => item.id !== id);
    this.set(key, data);
  }
}
