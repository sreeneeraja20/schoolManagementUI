import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { getTenantSlugFromRoute } from '../utils/route.utils';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    const slug = getTenantSlugFromRoute(route);
    return router.createUrlTree([`/${slug}/login`]);
  }
  return true;
};
