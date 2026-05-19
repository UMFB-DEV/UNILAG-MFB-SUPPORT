# UNILAG MFB TICKETING SYSTEM

A modern helpdesk/ticketing system built with Next.js (App Router), React Query, Zustand, Zod, and TailwindCSS. It supports admin, agent, and user roles with real-time ticket management, assignments, comments, and department-based routing.

## Features

### Core
- **Authentication** (login/register/password reset) with role-based routing
- **Ticket Management** (create, view, assign, update status, delete)
- **Comments** (public and internal notes) with real-time refresh
- **Department-based routing** and filtering for agents
- **Admin Dashboard** with metrics and agent performance
- **User Management** (create agents, update roles/departments, delete users)
- **Assignee Dropdowns** filtered by ticket department
- **Delete User with Tickets** flow: shows modal with user’s tickets and requires deleting tickets before user can be deleted

### UI/UX
- Dark Obsidian theme with gold accent
- Responsive sidebar navigation
- Confirmation modals for sensitive actions
- Loading and error states
- Pagination and search
- Role/department change dropdowns with confirmation

## Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **State**: Zustand (auth), React Query (server state)
- **Validation**: Zod schemas for API inputs/outputs
- **Backend URL**: Render-hosted API (`https://unilag-mfb-support-backend.onrender.com`)

## Project Structure

```
/app
  /dashboard          # General/agent login and dashboard
  /helpdesk           # Admin panel and ticket management
    /components
      obsidian-shell.tsx        # Sidebar + navigation
      auth-tabs.tsx            # Login/register modal
      ticket-detail-modal.tsx    # Ticket view + comments
      ticket-table.tsx          # Tickets list with assignee dropdown
      admin-dashboard-canvas.tsx # Admin dashboard cards/charts
  /reset-password      # Password reset flow
/services
  /auth               # Auth API actions + hooks (login, register, me)
  /tickets            # Tickets API actions + hooks (CRUD, comments, assign)
  /users              # Users API actions + hooks (list, update, delete)
  /departments        # Departments API actions + hooks
/lib
  /helpdesk           # Demo data and types (for dev)
```

## Key API Endpoints (Backend)

- `POST /auth/login`, `POST /auth/register`, `POST /auth/register-agent`, `GET /auth/me`
- `GET /tickets`, `POST /tickets`, `PATCH /tickets/:id/assign`, `PATCH /tickets/:id/status`, `DELETE /tickets/:id`
- `GET /tickets/:id/comments`, `POST /tickets/:id/comments`
- `GET /users`, `PATCH /users/:id`, `DELETE /users/:id`
- `GET /departments`

## Setup

1. Clone the repo
2. Install dependencies: `npm install`
3. Create `.env.local` (optional) to override `BASE_URL` or `NODE_ENV`
4. Run dev server: `npm run dev`
5. Open http://localhost:3000

## Environment Variables

- `NEXT_PUBLIC_BACKEND_URL` (optional, defaults to `services/base-url.ts` value)
- `NODE_ENV` (controls dev-only console logs)

## Notes

- All API calls go through centralized action functions with consistent error handling.
- React Query is used for server state with automatic refetching on mutations.
- Zod validates API payloads and responses.
- Admin can delete users only after their created tickets are deleted (enforced in UI with modal).
- Assignee dropdowns are filtered by ticket department and show full agent names.
- Backend enforces `limit <= 100` on tickets pagination; frontend complies.
- Comments are tolerant to empty/non-JSON responses to avoid UI stuck in loading.

## Deploy

- Frontend is deployed to Vercel/Netlify (Next.js).
- Backend is deployed to Render (`https://unilag-mfb-support-backend.onrender.com`).
- Ensure `FRONTEND_URL` is set on backend for CORS if needed.
