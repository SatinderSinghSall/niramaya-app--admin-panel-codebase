# Niramaya Admin Panel

The **Niramaya Admin Panel** is the web-based administration workspace
for the Niramaya mobile app a wellness platform.

It provides authorized administrators with a centralized interface for
managing users, wellness content, consultations, goals, progress,
notifications, administrators, database information, API activity, and
their own administrator profile.

The Admin Panel is a frontend application and uses the **existing
Niramaya backend APIs**. It does not connect directly to MongoDB.

---

## 1. Project Location

```text
website/Admin/admin-panel
```

The Admin Panel is part of the larger Niramaya full-stack project.

---

## 2. Technology Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- Lucide React icons

### Authentication

- Administrator authentication through the Niramaya backend API
- JWT-based authentication handled by the existing backend
- Client-side administrator authentication state through
  `AdminAuthContext`

### Backend Integration

The Admin Panel communicates with the existing Niramaya API through:

```text
components/pages
      ↓
lib/api.ts
      ↓
Niramaya Backend API
      ↓
MongoDB
```

The Admin Panel must not access MongoDB directly.

---

## 3. Application Structure

```text
admin-panel/
│
├── app/
│   ├── (dashboard)/
│   │   ├── admins/
│   │   ├── api-logs/
│   │   ├── ayurveda/
│   │   ├── consultations/
│   │   ├── dashboard/
│   │   ├── database/
│   │   ├── goals/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── progress/
│   │   ├── users/
│   │   ├── yoga/
│   │   └── layout.tsx
│   │
│   ├── login/
│   │   └── page.tsx
│   │
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── content/
│   │   └── ContentManagementPage.tsx
│   │
│   ├── layout/
│   │   ├── AdminShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── Topbar.tsx
│   │
│   └── public/
│       ├── AdminHero.tsx
│       ├── AdminWorkspacePreview.tsx
│       ├── CapabilitiesSection.tsx
│       ├── CapabilityCard.tsx
│       ├── PublicFooter.tsx
│       └── PublicNavbar.tsx
│
├── context/
│   └── AdminAuthContext.tsx
│
├── lib/
│   ├── api.ts
│   └── auth.ts
│
├── public/
│
├── types/
│   ├── admin-management.ts
│   ├── admin.ts
│   ├── content.ts
│   ├── database.ts
│   ├── goal.ts
│   ├── notification.ts
│   └── progress.ts
│
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── package-lock.json
├── postcss.config.mjs
└── tsconfig.json
```

---

# 4. Routes

## Public Routes

### `/`

The public Admin Portal landing page.

It contains:

- Niramaya administration branding
- Administration overview
- Workspace preview
- Platform capabilities
- Responsive public navigation
- Responsive footer

The public page is componentized under:

```text
components/public/
```

---

### `/login`

Administrator sign-in page.

The login page:

- Accepts administrator email and password
- Uses `AdminAuthContext`
- Shows validation/authentication errors
- Provides password visibility control
- Disables form controls while authentication is running
- Displays a full-screen sign-in loader
- Redirects authenticated administrators to `/dashboard`

---

# 5. Protected Administration Routes

All routes inside:

```text
app/(dashboard)/
```

belong to the authenticated administration workspace.

The dashboard route group currently contains:

Route Purpose

---

`/dashboard` Main administration dashboard
`/users` User management
`/ayurveda` Ayurveda content management
`/yoga` Yoga content management
`/consultations` Consultation management
`/notifications` Notification management
`/goals` Goal management
`/progress` Progress management
`/admins` Administrator management
`/profile` Current administrator profile
`/database` Database/collection information
`/api-logs` API request logs

---

# 6. Dashboard Layout

The authenticated administration area uses a shared layout:

```text
app/(dashboard)/layout.tsx
```

The layout uses:

```text
AdminShell
├── Sidebar
├── Topbar
└── Page content
```

### `AdminShell`

Provides the overall authenticated administration application structure.

### `Sidebar`

Provides navigation between administration modules.

The sidebar also provides access to:

- Current administrator profile
- Administrator role information
- Sign out

### `Topbar`

Provides the upper administration navigation area and contextual
administrator information.

---

# 7. Public Components

The public Admin Portal has been separated into reusable components.

```text
components/public/
```

### `PublicNavbar.tsx`

Responsive public navigation.

Provides:

- Niramaya branding
- Overview navigation
- Capabilities navigation
- Administration navigation
- Admin sign-in/dashboard action
- Mobile navigation menu

---

### `AdminHero.tsx`

The main public Admin Portal introduction section.

It introduces the administration workspace and provides the primary
entry point into the portal.

---

### `AdminWorkspacePreview.tsx`

A visual representation of the administration workspace.

This is a presentation component only. It should not contain fake live
platform statistics that could be mistaken for real backend data.

---

### `CapabilitiesSection.tsx`

Displays the major administration capabilities.

---

### `CapabilityCard.tsx`

Reusable card component for individual administration capabilities.

---

### `PublicFooter.tsx`

Reusable responsive footer for the public Admin Portal pages.

---

# 8. Authentication

Administrator authentication is centralized in:

```text
context/AdminAuthContext.tsx
```

The context is responsible for the client-side administrator
authentication state.

Typical flow:

```text
Login Page
    ↓
AdminAuthContext.login()
    ↓
Backend Admin Authentication API
    ↓
Authentication token/session
    ↓
Admin authentication state
    ↓
Dashboard
```

Protected administration pages should rely on the existing
authentication context and shared dashboard layout rather than
implementing separate authentication logic for each page.

---

# 9. API Client

API communication is centralized in:

```text
lib/api.ts
```

This keeps backend communication separate from UI components.

A typical architecture is:

```text
Page / Component
        ↓
      lib/api.ts
        ↓
Existing Niramaya Backend
        ↓
    Admin API Routes
        ↓
      Services
        ↓
      MongoDB
```

When adding a new administration feature:

1.  Use the existing backend API.
2.  Add or reuse an API client function.
3.  Define/extend the appropriate TypeScript type.
4.  Consume the API from the page/component.
5.  Handle loading, empty, success, and error states.

Do not add direct database access to the frontend.

---

# 10. Type Definitions

Frontend API and UI types are kept under:

```text
types/
```

Current type files include:

```text
admin-management.ts
admin.ts
content.ts
database.ts
goal.ts
notification.ts
progress.ts
```

Types should be extended when a backend response gains new fields rather
than using untyped objects throughout the UI.

---

# 11. Admin Dashboard

The dashboard is intended to provide an operational overview of the
Niramaya platform.

Current dashboard data includes areas such as:

- Authenticated administrator identity
- Platform overview
- User statistics
- Goal statistics
- Progress statistics
- Consultation statistics
- Notification statistics
- Ayurveda content statistics
- Yoga content statistics
- Collection/document counts
- Health/profile coverage
- Recent users
- Recent consultations
- API/system health
- API activity
- Seven-day API activity
- Recent API requests
- Database/server status

The dashboard is designed to use real backend data rather than
hard-coded analytics.

---

# 12. API Logs

The Admin Panel includes:

```text
/api-logs
```

The API Logs page provides administrator visibility into backend API
requests.

The backend API logging system records information such as:

- HTTP method
- Request route
- HTTP status code
- Response time
- Administrator
- IP address
- User agent
- Error code
- Error message
- Request timestamp

The Admin Panel can display request details and provide administrator
controls according to the permissions enforced by the backend.

API log deletion is restricted by the backend to the appropriate
administrator role.

Frontend UI permissions must not be treated as the security boundary.
The backend remains responsible for authorization.

---

# 13. Error Handling

Administration pages should provide clear states for:

### Loading

Display an appropriate loading indicator or skeleton.

### Empty

When the backend returns no records, show an informative empty state
rather than an empty table.

### Error

Display a user-friendly error message while preserving useful backend
error information when appropriate.

### Authentication failure

If an administrator session becomes invalid or expires, the application
should return the administrator to the login flow according to the
existing authentication implementation.

---

# 14. Responsive Design

The Admin Panel is intended to work across:

- Desktop
- Laptop
- Tablet
- Mobile

The authenticated administration interface uses a responsive
sidebar/topbar layout.

The public Admin Portal uses:

- Desktop navigation
- Mobile navigation menu
- Responsive hero section
- Responsive workspace preview
- Responsive capabilities grid
- Responsive footer

Responsive behavior should be implemented as part of the component
rather than added as a later desktop-to-mobile patch.

---

# 15. UI Principles

The Admin Panel follows a professional administration-oriented visual
language.

### Visual direction

- Niramaya green as the primary brand color
- White administration surfaces
- Warm neutral page backgrounds
- Subtle borders
- Restrained shadows
- Clear typography hierarchy
- Lucide icons
- Consistent spacing
- Responsive layouts

The UI should feel like a real administration portal rather than an AI
product landing page.

Avoid unnecessary:

- Glowing effects
- Excessive gradients
- Decorative blobs
- Fake analytics
- Excessive glassmorphism
- Unnecessary animations
- Marketing-style copy inside the authenticated admin application

---

# 16. Componentization Guidelines

New functionality should preferably be split into focused components.

For example, a dashboard feature should not become one very large page.

Prefer:

```text
components/dashboard/
├── DashboardHeader.tsx
├── SystemHealth.tsx
├── PlatformSummary.tsx
├── AttentionRequired.tsx
├── ActivityOverview.tsx
└── ...
```

over putting every dashboard section into:

```text
app/(dashboard)/dashboard/page.tsx
```

Similarly, reusable UI should live in appropriate component directories.

---

# 17. Backend Architecture Boundary

The Admin Panel is only the frontend administration client.

The backend remains responsible for:

- Authentication
- Authorization
- Role checks
- Input validation
- Database access
- Business logic
- Error handling
- API logging
- Data integrity

The frontend is responsible for:

- Presentation
- User interaction
- Client-side state
- API requests
- Loading/error/empty states
- Responsive UI
- Navigation

Never move backend authorization or database logic into the Admin Panel
simply for convenience.

---

# 18. Administrator Roles

The application uses backend-enforced administrator roles.

Examples of administrative role behavior include:

- Viewing administration data
- Managing platform resources
- Managing administrators
- Performing privileged operations such as API log deletion

The backend authorization middleware is the source of truth for role
permissions.

Do not rely on hiding a frontend button as the only protection for a
privileged action.

---

# 19. Development

From the Admin Panel directory:

```bash
cd website/Admin/admin-panel
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The Next.js development server is normally available at:

```text
http://localhost:3000
```

The Admin Panel must be configured to communicate with the running
Niramaya backend.

---

# 20. Production Build

Create a production build:

```bash
npm run build
```

Run the production application:

```bash
npm run start
```

Before deployment, verify:

- Backend API URL/configuration
- Authentication configuration
- Production environment variables
- CORS configuration on the backend
- API availability
- Administrator authentication
- Protected route behavior

---

# 21. Adding a New Administration Module

When adding a new module, follow this pattern:

### Step 1 --- Backend

Create or reuse:

```text
Backend route
    ↓
Controller
    ↓
Service
    ↓
Model
```

### Step 2 --- Frontend API

Add the required API client functions in:

```text
lib/api.ts
```

or the existing API abstraction used by the module.

### Step 3 --- Types

Add or update types under:

```text
types/
```

### Step 4 --- Page

Create:

```text
app/(dashboard)/module-name/page.tsx
```

### Step 5 --- Components

Move reusable UI into:

```text
components/
```

### Step 6 --- Navigation

Add the module to the appropriate administration navigation.

### Step 7 --- States

Implement:

```text
Loading
Success
Empty
Error
Unauthorized
```

### Step 8 --- Responsive behavior

Verify the module at:

```text
Desktop
Tablet
Mobile
```

---

# 22. Important Development Rules

1.  **Use the existing backend APIs.**
2.  **Do not connect the frontend directly to MongoDB.**
3.  **Do not create a second backend for the Admin Panel.**
4.  **Keep authorization enforced by the backend.**
5.  **Use real backend data instead of invented statistics.**
6.  **Keep reusable UI in components.**
7.  **Keep pages focused on composition and page-level state.**
8.  **Handle loading and errors explicitly.**
9.  **Keep the UI responsive.**
10. **Preserve the existing Niramaya visual identity.**
11. **Avoid unnecessary AI-style visual effects.**
12. **Do not duplicate backend business logic in the frontend.**

---

# 23. Current Module Map

```text
Niramaya Admin
│
├── Dashboard
│   └── Platform overview & operational analytics
│
├── Users
│   └── User administration
│
├── Ayurveda
│   └── Ayurveda content management
│
├── Yoga
│   └── Yoga content management
│
├── Consultations
│   └── Consultation administration
│
├── Notifications
│   └── Notification administration
│
├── Goals
│   └── Wellness goal management
│
├── Progress
│   └── Progress records
│
├── Administrators
│   └── Administrator management
│
├── Database
│   └── Database/collection information
│
├── API Logs
│   └── Backend request activity
│
└── Profile
    └── Current administrator profile
```

---

# 24. Recommended Development Flow

For future Admin Panel work:

```text
Requirement
    ↓
Inspect existing backend API
    ↓
Reuse existing endpoint/service
    ↓
Define TypeScript response type
    ↓
Create API client function
    ↓
Create/reuse components
    ↓
Build page
    ↓
Loading state
    ↓
Empty state
    ↓
Error state
    ↓
Responsive testing
    ↓
Role/permission verification
```

This keeps the Admin Panel aligned with the existing Niramaya full-stack
architecture.

---

## License / Project

Niramaya is an MCA final-year full-stack wellness application project.

The Admin Panel is an internal administration interface for the Niramaya
platform.
