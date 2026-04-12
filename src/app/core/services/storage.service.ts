import { Injectable, inject } from '@angular/core';
import { TenantService } from './tenant.service';

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
