# 🛡️ PolicySphere — Comprehensive Insurance Management System

PolicySphere is a full-stack, enterprise-grade insurance management platform. It empowers customers to browse multi-category insurance policies, subscribe with automated payment handling, manage active policies, submit claim evidence documents, and track payouts. It also provides dedicated portals for Claims Advisors and System Administrators to review evidence, manage policy catalogs, and analyze business performance metrics.

---

## 🌟 Key Features

### 👤 Customer Portal
- **Insurance Marketplace**: Interactive catalog filtering across Health, Life, Motor, Travel, and Home insurance plans.
- **Instant Policy Purchase**: One-click subscription with automated monthly billing calculations.
- **User Dashboard**: Real-time overview of active policies, upcoming renewal dates, claim statuses, and total coverage.
- **Claims Evidence Submission**: Drag-and-drop file upload for uploading receipts and claim evidence (`PDF`, `JPG`, `PNG`, `WEBP`) up to 5MB.
- **Billing & Receipts**: Detailed payment history with receipt viewing and payment status tags.

### 🔍 Advisor Portal (`ADVISOR` & `ADMIN` Roles)
- **Claims Queue Management**: Filter claims by `PENDING`, `IN_REVIEW`, `APPROVED`, or `REJECTED`.
- **Interactive Evidence Viewer Modal**: Inspect customer-uploaded proof documents and PDFs directly inside the portal without downloading.
- **Claim Review Action**: Update claim status with custom reviewer notes and instant customer notifications.

### ⚙️ Admin & Executive Suite (`ADMIN` Role)
- **Catalog Policy Management**: Full CRUD operations to create, edit, or deactivate insurance policies.
- **Executive Analytics Dashboard**: Real-time revenue tracking, category breakdowns, claim approval rate stats, top-performing product rankings, and **Export CSV/JSON** reporting.
- **One-Click Demo Seeder**: Re-populate or reset demo catalog policies on demand.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Axios, React Icons, React Hot Toast, Vanilla CSS Design Tokens (Glassmorphism UI).
- **Backend**: Node.js, Express.js, Prisma ORM, Neon PostgreSQL, JWT Auth (`jsonwebtoken`), Bcrypt password hashing, Multer file upload, Zod schema validation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- PostgreSQL database (or Neon Serverless Postgres connection string)

### 1. Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@ep-sample.aws.neon.tech/policysphere?sslmode=require"
JWT_SECRET="your_jwt_secret_key"
FRONTEND_URL="http://localhost:5173"
```

Run database migrations & seed sample data & demo accounts:
```bash
npx prisma db push
node prisma/seed.js
node setupAdmin.js
```

Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🔑 Demo Account Credentials

The system includes pre-seeded demo accounts for testing all user roles:

| Role | Email | Password | Description |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@policysphere.com` | `admin123` | Full access to Policy Management, Analytics, and Seeding |
| **Advisor** | `advisor@policysphere.com` | `advisor123` | Access to Advisor Claims Queue & Evidence Inspection |
| **Customer** | `john.doe@example.com` | `user123` | Standard customer account with active policies & claims |

---

## 📡 API Reference Inventory

### Authentication (`/api/auth`)
- `POST /register`: Register new customer account.
- `POST /login`: Authenticate user & return JWT cookie/token.
- `GET /me`: Get current authenticated user profile.
- `POST /logout`: Invalidate session.

### Policies (`/api/policies`)
- `GET /`: Retrieve active insurance catalog with filtering and search.
- `GET /:id`: Fetch detailed policy breakdown.

### Subscriptions & Payments (`/api/policies` & `/api/payments`)
- `POST /subscribe`: Subscribe to an insurance policy.
- `GET /my-policies`: Fetch user's active & past subscriptions.
- `GET /history`: Fetch payment transactions history.

### Claims Management (`/api/claims`)
- `GET /`: Fetch customer claims list.
- `POST /`: Submit a new claim with attached evidence documents.
- `POST /upload`: Upload evidence documents via `multer`.

### Advisor Portal (`/api/advisor`)
- `GET /claims`: Retrieve all system claims for review.
- `PATCH /claims/:id/status`: Update claim status (`APPROVED`, `REJECTED`, `IN_REVIEW`) with reviewer notes.

### Admin Suite (`/api/admin`)
- `GET /stats`: Retrieve system summary stats.
- `GET /policies`: Retrieve full policy catalog (including deactivated policies).
- `POST /policies`: Create new policy plan.
- `PUT /policies/:id`: Edit existing policy.
- `DELETE /policies/:id`: Deactivate policy.
- `GET /analytics`: Retrieve executive analytics & financial metrics.
- `POST /seed-demo`: Re-seed sample catalog policies on demand.

---

## 📄 License
This project is open source and available under the [MIT License](LICENSE).
