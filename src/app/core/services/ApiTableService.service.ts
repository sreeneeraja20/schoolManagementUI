import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TableLazyLoadEvent, ServerSideResult } from '../../shared/components/data-table/data-table.models';

@Injectable({ providedIn: 'root' })
export class ApiTableService {
  private http = inject(HttpClient);

  getPage<T>(endpoint: string, params: TableLazyLoadEvent, options?: { globalSearchFields?: string[] }): Observable<ServerSideResult<T>> {
    const body = {
      page: params.page,
      size: params.rows,
      sortField: params.sortField || null,
      sortOrder: params.sortOrder || 'asc',
      globalSearch: params.globalSearch || '',
      globalSearchFields: options?.globalSearchFields || [],
      columnFilters: params.columnFilters || {}
    };

    return this.http.post<ServerSideResult<T>>(`/api/${endpoint}`, body);
  }
}