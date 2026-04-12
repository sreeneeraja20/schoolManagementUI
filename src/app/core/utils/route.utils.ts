import { ActivatedRouteSnapshot } from '@angular/router';

export function getTenantSlugFromRoute(route: ActivatedRouteSnapshot): string {
  return route.params['tenantSlug'] ?? route.parent?.params['tenantSlug'] ?? 'greenvalley';
}
