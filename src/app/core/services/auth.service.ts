import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { User, LoginResult, JwtPayload } from '../models/user.model';
import { TenantService } from './tenant.service';
import { StorageService } from './storage.service';
import { TOKEN_EXPIRY_MS } from '../constants/app.constants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);
  private tenantService = inject(TenantService);
  private storage = inject(StorageService);

  login(email: string, password: string, tenantId: string): Observable<LoginResult> {
    const users = this.storage.get<User>('users');
    const user = users.find(u => u.email === email && u.tenantId === tenantId);
    if (!user || user.password !== password) {
      return of({ success: false, error: 'Invalid email or password' });
    }
    if (!user.isActive) {
      return of({ success: false, error: 'Account is deactivated. Contact your administrator.' });
    }
    // Update lastLogin timestamp
    this.storage.update<User>('users', user.id, { lastLogin: new Date().toISOString() });
    const token = this.generateToken(user);
    localStorage.setItem('access_token', token);
    return of({ success: true, token, user });
  }

  logout(): void {
    const slug = this.tenantService.getTenantSlug();
    localStorage.removeItem('access_token');
    this.router.navigate([`/${slug}/login`]);
  }

  changePassword(oldPassword: string, newPassword: string): Observable<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return of(false);
    const users = this.storage.get<User>('users');
    const found = users.find(u => u.id === currentUser.id && u.password === oldPassword);
    if (!found) return of(false);
    // Update password in storage
    this.storage.update<User>('users', currentUser.id, { password: newPassword });
    const payload = this.decodeToken();
    if (!payload) return of(false);
    const newPayload: JwtPayload = { ...payload, isFirstLogin: false };
    const token = this.encodeToken(newPayload);
    localStorage.setItem('access_token', token);
    return of(true);
  }

  forgotPassword(_email: string): Observable<boolean> {
    return of(true);
  }

  verifyOtp(otp: string): Observable<boolean> {
    return of(otp.length === 6);
  }

  resetPassword(_email: string, _newPassword: string): Observable<boolean> {
    return of(true);
  }

  getCurrentUser(): JwtPayload | null {
    return this.decodeToken();
  }

  isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    return !!token;
  }

  getRole(): string | null {
    return this.decodeToken()?.role ?? null;
  }

  decodeToken(): JwtPayload | null {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length < 2) return null;
      return JSON.parse(atob(parts[1]));
    } catch {
      return null;
    }
  }

  private generateToken(user: User): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload: JwtPayload = {
      id: user.id,
      tenantId: user.tenantId,
      role: user.role,
      name: user.name,
      email: user.email,
      isFirstLogin: user.isFirstLogin,
      exp: Date.now() + TOKEN_EXPIRY_MS
    };
    return this.encodeToken(payload, header);
  }

  private encodeToken(payload: JwtPayload, header?: string): string {
    const h = header ?? btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const p = btoa(JSON.stringify(payload));
    // NOTE: This is a mock JWT for development only. Replace with real signing in production.
    const sig = btoa('fakesignature');
    return `${h}.${p}.${sig}`;
  }
}

