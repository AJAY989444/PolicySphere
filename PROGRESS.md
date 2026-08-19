# PolicySphere — Build Progress

---

## Point 0: Project Scaffold
**Status:** Complete  
**Date:** 2026-08-18

### What was built
- Monorepo layout: `/frontend` (Vite + React 19), `/backend` (Express + Prisma ORM)
- Backend structure: `src/routes`, `src/controllers`, `src/services`, `src/middleware`, `src/config`, `prisma/schema.prisma`
- Frontend structure: `src/pages` (HomePage, NotFoundPage), `src/components/layout` (AppLayout, Navbar), `src/services/api` (Axios client), `src/context` (AuthContext)
- Complete design system in `src/index.css` with CSS custom properties, buttons, badges, cards, forms, animations, and font imports
- `.env.example` & `.env` in both frontend and backend
- Concurrent dev execution setup via root `package.json`

### What's still stubbed
- Real database connection (awaiting `DATABASE_URL` setup to run Prisma migration)

### Environment variables required
| Variable | Location | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | `/backend/.env` | PostgreSQL connection string |
| `JWT_SECRET` | `/backend/.env` | Secret key for signing JWTs |
| `JWT_REFRESH_SECRET` | `/backend/.env` | Secret key for refresh tokens |
| `VITE_API_URL` | `/frontend/.env` | Backend API base URL |

---

## Point 1: Authentication & Roles
**Status:** Complete  
**Date:** 2026-08-18

### What was built
- **Frontend UI**:
  - `LoginPage.jsx` & `SignupPage.jsx` with `react-hook-form` validation.
  - Role selection for new users.
  - `AuthContext.jsx` integrated with Axios for real backend communication.
  - `ProtectedRoute.jsx` for route guarding (role-based redirection).
  - Navigation bar dynamically updating based on auth state.
- **Backend API**:
  - `auth.service.js` with bcrypt hashing and JWT generation.
  - `auth.controller.js` handling register, login, refresh, and logout with `zod` validation and secure cookies.
  - `auth.js` middleware for JWT extraction and verification.
  - `roleGuard.js` middleware for enforcing Role Based Access Control (RBAC).
- **Database**:
  - Real DB operations mapping to `User` and `RefreshToken` Prisma models.

### What's still stubbed
- `/dashboard` route is a placeholder placeholder waiting for Point 2.

### Environment variables required
*(No new variables were required for this point)*

---

## Point 2: Customer Profile
**Status:** Complete  
**Date:** 2026-08-18

### What was built
- **Frontend UI**:
  - `ProfilePage.jsx` with `react-hook-form` and prepopulation of data.
  - Linked profile icon in `Navbar.jsx` to `/profile`.
  - Added `/profile` route protected by `ProtectedRoute.jsx`.
- **Backend API**:
  - `user.controller.js` and `user.service.js` for profile operations (`GET /profile`, `PUT /profile`).
  - Added Zod validation to ensure data integrity during profile updates.
  - Added `user.routes.js` and registered it under `/api/users`.

### What's still stubbed
- `/dashboard` route is a placeholder waiting for Point 3 (Policies/Dashboard).

### Environment variables required
*(No new variables were required for this point)*

---

## Point 3: Policy Catalog & Customer Dashboard
**Status:** Complete  
**Date:** 2026-08-18

### What was built
- **Frontend UI**:
  - `CatalogPage.jsx` with filtering and search.
  - `PolicyDetailPage.jsx` for viewing plan specifics and purchasing.
  - `DashboardPage.jsx` displaying user's purchased policies and statistics.
- **Backend API**:
  - `policy.controller.js` and `policy.service.js` for catalog listing, details, and purchase operations.
  - `policy.routes.js` registered under `/api/policies`.
- **Database**:
  - `InsurancePolicy` and `UserPolicy` models added.
  - 12 sample policies seeded.

### What's still stubbed
- Features beyond Point 4 (like advisor portals, admin dashboard).

### Environment variables required
*(No new variables were required for this point)*

---

## Point 4: Claims Management
**Status:** Complete  
**Date:** 2026-08-18

### What was built
- **Frontend UI**:
  - `ClaimsPage.jsx` displaying user's claims and status.
  - `SubmitClaimPage.jsx` form to file a new claim against active policies.
  - Claims link added to `Navbar.jsx`.
- **Backend API**:
  - `claim.controller.js` and `claim.service.js` to handle claim creation and retrieval securely.
  - `claim.routes.js` registered under `/api/claims`.
- **Database**:
  - Added `Claim` model and `ClaimStatus` enum.
  - Added `claims` relation to `UserPolicy`.

### What's still stubbed
- Claims documents currently accept an empty stubbed array instead of actual file uploads.
- Advisor portal for reviewing claims.

### Environment variables required
*(No new variables were required for this point)*
