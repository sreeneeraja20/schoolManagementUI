# School Management System — Angular UI

A modern, scalable, multi-tenant School Management System built with Angular 19, PrimeNG, and SCSS theming.

## Tech Stack
- **Angular 19** — standalone components (no NgModules)
- **PrimeNG 17+** — UI component library
- **Angular Signals** — state management
- **ngx-translate** — i18n (English + Tamil)
- **SCSS + CSS Variables** — tenant-specific theming
- **localStorage** — Phase 1 mock persistence

## Multi-Tenancy
- URL-based: `/:tenantSlug/login`, `/:tenantSlug/dashboard`
- 2 demo tenants: `greenvalley` (CBSE, Chennai) and `sunrise` (State board, Coimbatore)
- CSS variable theming injected per tenant

## Demo Credentials
| URL | Email | Password | Role |
|-----|-------|----------|------|
| `/greenvalley/login` | `admin@greenvalley.edu` | `admin123` | Admin |
| `/greenvalley/login` | `teacher@greenvalley.edu` | `teacher123` | Teacher (first login) |
| `/sunrise/login` | `admin@sunrise.edu` | `admin123` | Admin |
| `/sunrise/login` | `teacher@sunrise.edu` | `teacher123` | Teacher (first login) |

## Development
```bash
npm install
g serve
```
Navigate to `http://localhost:4200/greenvalley/login`