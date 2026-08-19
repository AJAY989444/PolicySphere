# PolicySphere — Digital Insurance Marketplace

A full-stack digital insurance marketplace built with React (Vite) and Node.js (Express), backed by PostgreSQL via Prisma ORM.

## Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Frontend   | React.js (Vite), React Router, Axios, Recharts |
| Backend    | Node.js + Express                           |
| Database   | PostgreSQL via Prisma ORM                   |
| Auth       | JWT (access + refresh tokens), bcrypt       |
| Validation | zod (backend), react-hook-form (frontend)   |

## Project Structure

```
/frontend    — Vite + React client application
/backend     — Express + Prisma API server
README.md    — This file
PROGRESS.md  — Incremental build log
.gitignore   — Git ignore rules
```

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9
- PostgreSQL instance (local or cloud, e.g. Neon / Supabase)

### 1. Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

### 2. Configure Environment

Copy the example env files and fill in your values:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 3. Set Up the Database

```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Run Development Servers

```bash
# From the project root — starts both frontend and backend concurrently
npm run dev
```

- Frontend: http://localhost:5173
- Backend:  http://localhost:5000

## License

Private — All rights reserved.
