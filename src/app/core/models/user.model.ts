export type UserRole = 'ADMIN' | 'TEACHER';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  staffId: string;
  isFirstLogin: boolean;
  isActive: boolean;
  lastLogin?: string;
}

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: Partial<User>;
  error?: string;
}

export interface JwtPayload {
  id: string;
  tenantId: string;
  role: UserRole;
  name: string;
  email: string;
  isFirstLogin: boolean;
  exp: number;
}
