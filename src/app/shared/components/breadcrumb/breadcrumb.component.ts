import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { TenantService } from '../../../core/services/tenant.service';

interface BreadcrumbItem {
  label: string;
  routerLink?: string;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule],
  templateUrl: './breadcrumb.component.html',
  styleUrl: './breadcrumb.component.scss'
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [];
  homeLink = '';

  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  private tenantService = inject(TenantService);
  private subscription = new Subscription();

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.subscription.add(
      this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
        this.buildBreadcrumbs();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private buildBreadcrumbs(): void {
    const tenantSlug = this.tenantService.getTenantSlug();
    this.homeLink = `/${tenantSlug}/dashboard`;

    const crumbs: BreadcrumbItem[] = [];
    let route: ActivatedRoute | null = this.activatedRoute.root;
    let url = '';

    while (route) {
      const children: ActivatedRoute[] = route.children;
      let found = false;
      for (const child of children) {
        const routeConfig = child.snapshot;
        const segment = routeConfig.url.map((s: { path: string }) => s.path).join('/');
        if (segment) {
          url += '/' + segment;
        }

        const breadcrumbKey: string | undefined = routeConfig.data?.['breadcrumb'];
        if (breadcrumbKey !== undefined) {
          if (breadcrumbKey) {
            crumbs.push({ label: breadcrumbKey, routerLink: `/${url}` });
          }
        }

        route = child;
        found = true;
        break;
      }
      if (!found) break;
    }

    // Last item has no routerLink (current page)
    if (crumbs.length > 0) {
      crumbs[crumbs.length - 1] = { ...crumbs[crumbs.length - 1], routerLink: undefined };
    }

    this.breadcrumbs = crumbs;
  }
}
