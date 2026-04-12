import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getTenantSlugFromRoute } from '../utils/route.utils';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const requiredRoles: string[] = route.data['requiredRole'] ?? [];

  if (requiredRoles.length === 0) return true;

  const role = authService.getRole();
  if (!role || !requiredRoles.includes(role)) {
    const slug = getTenantSlugFromRoute(route);
    return router.createUrlTree([`/${slug}/unauthorized`]);
  }
  return true;
};
