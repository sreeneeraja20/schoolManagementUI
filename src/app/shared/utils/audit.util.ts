// TODO (Phase 2 — Backend): When API integration is added, the backend should:
// 1. Extract the JWT from the Authorization header
// 2. Decrypt/verify the JWT to get the user identity
// 3. Auto-populate createdBy/updatedBy server-side
// Currently, the UI reads from the fake JWT payload for localStorage mock.
import { AuthService } from '../../core/services/auth.service';

export function getAuditFieldsForCreate(authService: AuthService): {
  createdBy: string;
  createdDate: string;
  updatedBy: string;
  updatedDate: string;
} {
  const user = authService.getCurrentUser();
  const now = new Date().toISOString();
  return {
    createdBy: user?.name ?? 'Unknown',
    createdDate: now,
    updatedBy: user?.name ?? 'Unknown',
    updatedDate: now
  };
}

export function getAuditFieldsForUpdate(authService: AuthService): {
  updatedBy: string;
  updatedDate: string;
} {
  const user = authService.getCurrentUser();
  return {
    updatedBy: user?.name ?? 'Unknown',
    updatedDate: new Date().toISOString()
  };
}
