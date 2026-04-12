Here's the full documentation for your **School Management UI** application:

---

# 📚 School Management System — UI Documentation

**Repository:** [prammoodhkholi-create/school-management-ui](https://github.com/prammoodhkholi-create/school-management-ui)
**Tech Stack:** Angular 19 (standalone components) · PrimeNG 19 · SCSS · ngx-translate (EN/Tamil) · localStorage persistence

---

## 1. Architecture Overview

```
src/app/
├── app.component.ts          # Root component
├── app.config.ts              # App configuration (providers, i18n, etc.)
├── app.routes.ts              # Top-level route definitions
├── core/                      # Singleton services, guards, models, constants
│   ├── constants/
│   ├── guards/
│   ├── interceptors/
│   ├── interfaces/
│   ├── models/
│   ├── services/
│   └── utils/
├── features/                  # Lazy-loaded feature modules
│   ├── attendance/
│   ├── auth/
│   ├── dashboard/
│   ├── events/
│   ├── exams/
│   ├── setup/
│   ├── staff/
│   ├── students/
│   ├── timetable/
│   └── users/
├── layouts/                   # Main layout + auth layout shells
│   ├── auth-layout/
│   └── main-layout/
│       ├── header/
│       └── sidebar/
├── pages/                     # Standalone error/utility pages
│   ├── not-found/
│   ├── tenant-not-found/
│   └── unauthorized/
└── shared/                    # Reusable components, utilities, validators
    ├── components/
    │   ├── breadcrumb/
    │   ├── confirm-dialog/
    │   ├── csv-import-dialog/
    │   ├── data-table/
    │   ├── dynamic-form/
    │   ├── image-upload/
    │   ├── page-loader/
    │   ├── setup-banner/
    │   ├── skeleton-card/
    │   └── toast/
    ├── utils/
    └── validators/
```

---

## 2. Multi-Tenant Architecture

All routes are prefixed with `/:tenantSlug`. The `TenantService` resolves the tenant from the URL slug and scopes all localStorage data per tenant.

### Tenant Model
| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique tenant ID |
| `slug` | `string` | URL slug (e.g. `green-valley`) |
| `schoolName` | `string` | Display name |
| `board` | `string` | Education board |
| `logo` | `string` | Logo URL |
| `primaryColor` / `secondaryColor` | `string` | Theme colors |
| `attendanceMode` | `'daily' \| 'per-period'` | How attendance is tracked |
| `periodsPerDay` | `number` | Number of periods |
| `periodTimings` | `PeriodTiming[]` | Start/end times per period |
| `workingDays` | `string[]` | e.g. `['Monday', ..., 'Friday']` |

---

## 3. Authentication & Authorization

### User Roles
| Role | Access |
|------|--------|
| `ADMIN` | Full access to all modules |
| `TEACHER` | Students, Attendance, Timetable (view), Events, Dashboard |

### Auth Flow
1. **Login** — `/:tenantSlug/login` → validates against `users` in localStorage → generates fake JWT → stores in `sessionStorage`
2. **First Login Guard** — if `isFirstLogin === true`, forces redirect to change password
3. **Role Guard** — reads `requiredRole` from route `data` and checks against JWT payload
4. **Unsaved Changes Guard** — warns before navigating away from dirty forms (all create/edit routes)

### Guards
| Guard | File | Purpose |
|-------|------|---------|
| `authGuard` | `auth.guard.ts` | Redirects to login if not authenticated |
| `firstLoginGuard` | `first-login.guard.ts` | Forces password change on first login |
| `roleGuard` | `role.guard.ts` | Blocks access if user role doesn't match `requiredRole` |
| `tenantGuard` | `tenant.guard.ts` | Validates tenant slug exists |
| `unsavedChangesGuard` | `unsaved-changes.guard.ts` | `canDeactivate` — warns if form is dirty |

### User Model
| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique user ID |
| `tenantId` | `string` | Owning tenant |
| `email` | `string` | Login email |
| `password` | `string` | Password (plaintext in localStorage mock) |
| `role` | `'ADMIN' \| 'TEACHER'` | Authorization role |
| `name` | `string` | Display name |
| `staffId` | `string` | Linked staff record |
| `isFirstLogin` | `boolean` | Forces password change |
| `isActive` | `boolean` | Account active/deactivated |
| `lastLogin?` | `string` | ISO timestamp of last login |

---

## 4. Route Map

### Auth Routes (`/:tenantSlug/`)
| Path | Component | Access |
|------|-----------|--------|
| `login` | `LoginComponent` | Public |
| `change-password` | `ChangePasswordComponent` | Authenticated |
| `forgot-password` | `ForgotPasswordComponent` | Public |

### Main Routes (`/:tenantSlug/` — inside `MainLayoutComponent`)
| Path | Module | Access |
|------|--------|--------|
| `dashboard` | Dashboard | ADMIN, TEACHER |
| `students` | Students (child routes) | ADMIN, TEACHER |
| `staff` | Staff (child routes) | ADMIN |
| `users` | User Accounts (child routes) | ADMIN |
| `attendance` | Attendance (child routes) | ADMIN, TEACHER |
| `timetable` | Timetable (child routes) | ADMIN, TEACHER |
| `events` | Events (child routes) | ADMIN, TEACHER |
| `exams` | Exams & Grades (child routes) | ADMIN, TEACHER |
| `setup` | Setup (child routes) | ADMIN |
| `parents` | Parents (child routes) | ADMIN |

### Students Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` (empty) | `StudentListComponent` | Searchable/filterable list with data-table |
| `create` | `StudentFormComponent` | Add new student (unsaved changes guard) |
| `edit/:id` | `StudentFormComponent` | Edit student (unsaved changes guard) |
| `view/:id` | `StudentViewComponent` | Profile card with photo, details, attendance summary |

### Staff Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `StaffListComponent` | Role badges, subject resolution |
| `create` | `StaffFormComponent` | Add staff |
| `edit/:id` | `StaffFormComponent` | Edit staff |
| `view/:id` | `StaffViewComponent` | Profile card with subjects & timetable summary |

### Users Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `UserListComponent` | Active/inactive status, reset password, activate/deactivate |
| `create` | `UserFormComponent` | Create user account |
| `edit/:id` | `UserFormComponent` | Edit user account |

### Parents Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `ParentListComponent` | List parent accounts with active/inactive status, reset password |
| `create` | `ParentFormComponent` | Add parent account (unsaved changes guard) |
| `edit/:id` | `ParentFormComponent` | Edit parent account (unsaved changes guard) |
| `view/:id` | `ParentViewComponent` | Parent profile with linked students and login activity |
| `bulk-create` | `ParentBulkCreateComponent` | Wizard: select students → set password strategy → review results |

### Attendance Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `AttendanceMarkingComponent` | Date + class/section → radio per student (Present/Absent/Late) |
| `report` | `AttendanceReportComponent` | Date-range/class/section filters + summary stat cards |

### Timetable Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `TimetableViewComponent` | Read-only 8×6 period/day grid |
| `builder` | `TimetableBuilderComponent` | Click-to-edit dropdowns per cell, conflict detection |

### Events Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `EventListComponent` | Type badges (holiday/exam/event) |
| `create` | `EventFormComponent` | Add event |
| `edit/:id` | `EventFormComponent` | Edit event |
| `calendar` | `EventCalendarComponent` | Custom month grid with colored dots per type |

### Exams Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `ExamListComponent` | Exam schedule list |
| `create` | `ExamFormComponent` | Schedule an exam |
| `edit/:id` | `ExamFormComponent` | Edit exam |
| `:examId/marks` | `MarksEntryComponent` | Enter marks per student per subject |
| `report-card/:studentId` | `ReportCardComponent` | Printable report card with grades |

### Setup Child Routes
| Path | Component | Description |
|------|-----------|-------------|
| ` ` | `SetupComponent` | Landing with cards linking to sub-modules |
| `academic-years` | `AcademicYearListComponent` | List with active/inactive toggle |
| `academic-years/create` | `AcademicYearFormComponent` | Add year |
| `academic-years/edit/:id` | `AcademicYearFormComponent` | Edit year |
| `classes` | `ClassListComponent` | List |
| `classes/create` | `ClassFormComponent` | Add |
| `classes/edit/:id` | `ClassFormComponent` | Edit |
| `sections` | `SectionListComponent` | List |
| `sections/create` | `SectionFormComponent` | Add |
| `sections/edit/:id` | `SectionFormComponent` | Edit |
| `subjects` | `SubjectListComponent` | List |
| `subjects/create` | `SubjectFormComponent` | Add |
| `subjects/edit/:id` | `SubjectFormComponent` | Edit |

---

## 5. Data Models

### Student (extends Auditable)
| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | auto |
| `tenantId` | `string` | auto |
| `name` | `string` | ✅ |
| `rollNumber` | `string` | ✅ |
| `classId` | `string` | ✅ |
| `sectionId` | `string` | ✅ |
| `dateOfBirth` | `string` (ISO date) | ✅ |
| `gender` | `'M' \| 'F' \| 'Other'` | ✅ |
| `parentName` | `string` | ✅ |
| `parentPhone` | `string` | ✅ |
| `address` | `string` | |
| `academicYearId` | `string` | auto |
| `photoUrl?` | `string` (base64 data URI) | |

### Staff (extends Auditable)
| Field | Type | Required |
|-------|------|----------|
| `id` | `string` | auto |
| `tenantId` | `string` | auto |
| `name` | `string` | ✅ |
| `email` | `string` | ✅ |
| `phone` | `string` | ✅ |
| `role` | `string` | ✅ |
| `subjectIds` | `string[]` | |
| `qualification` | `string` | |
| `joiningDate` | `string` (ISO date) | ✅ |
| `photoUrl?` | `string` | |

### AttendanceRecord (extends Auditable)
| Field | Type |
|-------|------|
| `id` | `string` |
| `tenantId` | `string` |
| `studentId` | `string` |
| `date` | `string` (ISO date) |
| `status` | `'PRESENT' \| 'ABSENT' \| 'LATE'` |
| `period?` | `number` |
| `subjectId?` | `string` |

### TimetableSlot (extends Auditable)
| Field | Type |
|-------|------|
| `id` | `string` |
| `tenantId` | `string` |
| `classId` | `string` |
| `sectionId` | `string` |
| `day` | `string` (e.g. `'Monday'`) |
| `period` | `number` |
| `subjectId` | `string` |
| `staffId` | `string` |

### SchoolEvent (extends Auditable)
| Field | Type |
|-------|------|
| `id` | `string` |
| `tenantId` | `string` |
| `title` | `string` |
| `description` | `string` |
| `startDate` / `endDate` | `string` (ISO date) |
| `type` | `'holiday' \| 'exam' \| 'event'` |
| `forRoles` | `string[]` |

### AcademicYear
| Field | Type |
|-------|------|
| `id` | `string` |
| `tenantId` | `string` |
| `name` | `string` (e.g. `'2025-2026'`) |
| `startDate` / `endDate` | `string` |
| `isActive` | `boolean` |

### Class / Section / Subject
| Class | Section | Subject |
|-------|---------|---------|
| `id`, `tenantId`, `name`, `academicYearId`, `displayOrder` | `id`, `tenantId`, `classId`, `name`, `classTeacherId`, `maxStudents` | `id`, `tenantId`, `name`, `code`, `classIds[]` |

### ParentAccount (extends Auditable)
| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique parent ID |
| `tenantId` | `string` | Owning tenant |
| `name` | `string` | Full name |
| `email` | `string` | Login email |
| `phone` | `string` | Contact phone |
| `password` | `string` | Password (plaintext in localStorage mock) |
| `relation` | `'Father' \| 'Mother' \| 'Guardian'` | Relationship to students |
| `studentIds` | `string[]` | Linked student IDs |
| `isFirstLogin` | `boolean` | Forces password change |
| `isActive` | `boolean` | Account active/deactivated |
| `lastLoginAt?` | `string` | ISO timestamp |
| `lastLoginDevice?` | `string` | Device info |
| `loginCount` | `number` | Total logins |
| `preferredLanguage` | `string` | Language preference |
| `notifyAttendance` / `notifyEvents` / `notifyExams` | `boolean` | Notification preferences |

### Auditable (mixin on all entities)
| Field | Type | Description |
|-------|------|-------------|
| `createdBy?` | `string` | User name who created |
| `createdDate?` | `string` | ISO timestamp |
| `updatedBy?` | `string` | User name who last updated |
| `updatedDate?` | `string` | ISO timestamp |

---

## 6. Core Services

| Service | File | Purpose |
|---------|------|---------|
| `AuthService` | `auth.service.ts` | Login/logout, JWT management, `getCurrentUser()`, `getRole()` |
| `StorageService` | `storage.service.ts` | CRUD on localStorage, namespaced per tenant (`get`, `getById`, `add`, `update`, `delete`) |
| `TenantService` | `tenant.service.ts` | Resolves tenant from URL slug, provides `currentTenant()`, `getTenantSlug()`, `getTenantId()` |
| `I18nService` | `i18n.service.ts` | Language switching (English / Tamil), wraps `ngx-translate` |
| `ParentService` | `parent.service.ts` | CRUD on `parent_accounts`, password reset, student linkage |
| `SeedDataService` | `seed-data.service.ts` | Seeds demo data on first load: 12 students, 6 staff, attendance, timetable, events, exams |

---

## 7. Shared / Reusable Components

### `app-data-table`
Configurable data table wrapping PrimeNG `p-table`.

| Input | Type | Description |
|-------|------|-------------|
| `config` | `TableConfig` | Columns, actions, pagination, global search, etc. |
| `data` | `any[]` | Row data |

| Output | Description |
|--------|-------------|
| `addClick` | Add button clicked |
| `editClick` | Edit action on a row |
| `deleteClick` | Delete action on a row |
| `viewClick` | View action on a row |
| `sortChange` | Column sort changed |
| `filterChange` | Column filter changed |
| `pageChange` | Pagination changed |

**Features:** Sortable/filterable columns, dropdown/text filters, global search, pagination, action buttons (edit/delete/view), CSV/PDF export buttons. Maintains a **minimum visible height of 5 rows** regardless of record count — a transparent spacer row is injected via `pTemplate="footer"` so the table never collapses to a tiny height when data is sparse.

### `app-dynamic-form`
Config-driven reactive form builder.

| Input | Type | Description |
|-------|------|-------------|
| `config` | `DynamicFormConfig` | Field definitions, columns, button labels |
| `initialValues?` | `Record<string, any>` | Pre-fill values (edit mode) |

| Output | Description |
|--------|-------------|
| `formSubmit` | Form submitted (validated values) |
| `formCancel` | Cancel button clicked |
| `formChange` | Any field value changed |
| `formDirty` | Form became dirty (for unsaved changes guard) |

**Supported field types:** `text`, `number`, `email`, `password`, `textarea`, `dropdown`, `multiSelect`, `calendar`, `checkbox`, `toggle`, `radio`

### `app-image-upload`
Circular photo picker with drag-drop.

| Input | Description |
|-------|-------------|
| `imageUrl` | Current photo (base64 or URL) |
| `maxSizeKB` | Max file size (default 500KB) |
| `acceptTypes` | MIME types (`image/png,image/jpeg`) |
| `readonly` | Disable upload |

| Output | Description |
|--------|-------------|
| `imageChange` | Emits base64 data URI |
| `imageRemove` | Photo removed |

### `app-breadcrumb`
Auto-generated breadcrumb navigation. Reads `data.breadcrumb` (i18n key) from the active route chain. Renders: 🏠 Home > Module > Page.

### `app-csv-import-dialog`
Bulk CSV import dialog with template download, preview, validation, and error reporting.

### Other Shared Components
| Component | Purpose |
|-----------|---------|
| `app-confirm-dialog` | Wraps PrimeNG `p-confirmDialog` |
| `app-setup-banner` | "Please configure X first" warning banner |
| `app-page-loader` | Full-page loading spinner |
| `app-skeleton-card` | Skeleton placeholder during loading |
| `app-toast` | Toast notification wrapper |

---

## 8. Shared Utilities

| File | Purpose |
|------|---------|
| `audit.util.ts` | `getAuditFieldsForCreate()` / `getAuditFieldsForUpdate()` — reads current user from `AuthService` |
| `image.utils.ts` | `handleImageError()` — fallback to default logo SVG |

---

## 9. Layout Structure

### Main Layout (`MainLayoutComponent`)
```
┌─────────────────────────────────────────────────┐
│  Sidebar (260px / 70px collapsed)               │
│  ┌──────────────────────────────────────────┐   │
│  │  Logo + School Name                      │   │
│  │  ─────────────────                       │   │
│  │  🏠 Dashboard                             │   │
│  │  👥 Students                              │   │
│  │  🪪 Staff (ADMIN only)                    │   │
│  │  🔑 Users (ADMIN only)                    │   │
│  │  ☑️ Attendance                             │   │
│  │  📅 Timetable                             │   │
│  │  🚩 Events                                │   │
│  │  📝 Exams                                 │   │
│  │  ⚙️ Setup (ADMIN only)                    │   │
│  │  👨‍👩‍👦 Parents (ADMIN only)               │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │  Header (64px)                            │   │
│  │  [☰ mobile] [EN|தமிழ்] [👤 User ▼]       │   │
│  ├──────────────────────────────────────────┤   │
│  │  Breadcrumb: 🏠 > Students > Create      │   │
│  ├──────────────────────────────────────────┤   │
│  │                                           │   │
│  │  <router-outlet> (page content)           │   │
│  │                                           │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Header Features
- **Language switcher** — EN / தமிழ் toggle
- **User menu** — avatar with initials, dropdown: Change Password, Logout
- **Mobile hamburger** — toggles sidebar on small screens

---

## 10. Internationalization (i18n)

**Languages:** English (`en.json`), Tamil (`ta.json`)

**Key groups:**
| Namespace | Coverage |
|-----------|----------|
| `LOGIN` | Login, forgot password forms |
| `CHANGE_PASSWORD` | Change password form |
| `SIDEBAR` | Navigation labels |
| `COMMON` | Save, Cancel, Delete, Edit, Add, Search, Loading |
| `TABLE` | Global search, pagination labels |
| `FORM` | Validation messages (required, min, max, email) |
| `STUDENTS` | All student-related labels |
| `STAFF` | All staff-related labels |
| `USERS` | User account management labels |
| `ATTENDANCE` | Marking and report labels |
| `TIMETABLE` | View and builder labels |
| `EVENTS` | Event list, form, calendar labels |
| `EXAMS` | Exam scheduling, marks, report card labels |
| `DASHBOARD` | Stats, quick actions |
| `SETUP` | Academic years, classes, sections, subjects CRUD |
| `PARENTS` | Parent account list, form, view, bulk-create labels |
| `AUDIT` | Created/updated by/date labels |
| `IMPORT` / `EXPORT` | CSV import, PDF/Excel export |
| `BREADCRUMB` | Home, unsaved changes message |

---

## 11. Styling & Theming

### CSS Variables (`src/styles/_variables.scss`)
| Variable | Default | Purpose |
|----------|---------|---------|
| `--primary-color` | `#2E7D32` (green) | Primary theme color |
| `--secondary-color` | `#1565C0` (blue) | Secondary accent |
| `--font-family` | `'Inter', sans-serif` | Global font |
| `--surface-ground` | `#f8f9fa` | Page background |
| `--surface-card` | `#ffffff` | Card/panel background |
| `--text-color` | `#495057` | Primary text |
| `--text-color-secondary` | `#6c757d` | Muted text |
| `--border-radius` | `8px` | Global border radius |
| `--sidebar-width` | `260px` | Expanded sidebar |
| `--sidebar-collapsed-width` | `70px` | Collapsed sidebar |
| `--header-height` | `64px` | Header bar height |

---

## 12. Data Persistence

Currently uses **localStorage** (mock backend). Data is namespaced per tenant:
- Key format: `{tenantId}_{collection}` (e.g. `tenant-001_students`)
- `SeedDataService` populates demo data on first load

### Storage Collections
| Key | Entity | Seeded Count |
|-----|--------|-------------|
| `academic_years` | `AcademicYear` | 1 |
| `classes` | `Class` | Multiple |
| `sections` | `Section` | Multiple |
| `subjects` | `Subject` | Multiple |
| `students` | `Student` | 12 |
| `staff` | `Staff` | 6 |
| `attendance` | `AttendanceRecord` | 5 days |
| `timetable` | `TimetableSlot` | Full week (Class 1A) |
| `events` | `SchoolEvent` | 7 |
| `exams` | `Exam` | Seeded |
| `users` | `User` | 2 (admin + teacher) |
| `parent_accounts` | `ParentAccount` | Not seeded — created manually or via bulk-create wizard |

---

## 13. Cross-Cutting Features

| Feature | Description |
|---------|-------------|
| **Audit Trail** | All entities extend `Auditable`. `createdBy`/`updatedBy` auto-set from JWT user. Visible in list tables. |
| **Breadcrumbs** | Auto-generated from route `data.breadcrumb` keys. Clickable parent links. |
| **Unsaved Changes Guard** | All create/edit routes warn before navigation. Also handles browser `beforeunload`. |
| **CSV Import** | Bulk import for students/staff via `app-csv-import-dialog`. Template download, validation, preview. |
| **Export** | CSV export and Print/PDF on list pages. |
| **Photo Upload** | Circular drag-drop uploader. Base64 storage. Used on student & staff forms/profiles. |
| **Responsive** | Sidebar collapses, mobile hamburger menu, fluid grids. |

---

## 14. Default Credentials (Demo)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@greenvalley.edu` | `admin123` |
| Teacher | `teacher@greenvalley.edu` | `teacher123` |

---

## 15. Build & Run

```bash
# Install dependencies
npm install

# Development server
ng serve

# Production build
ng build

# Access at
http://localhost:4200/green-valley/login
```

---
