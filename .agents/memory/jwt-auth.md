---
name: JWT Auth Architecture
description: Clerk fully removed; email/password JWT auth replaces it. Key decisions and file locations.
---

# JWT Auth Architecture

Clerk has been fully removed and replaced with simple email/password JWT authentication.

## Key decisions

- **bcryptjs** (not bcrypt) — pure-JS, no native build scripts needed in Replit sandbox.
- **jsonwebtoken** for signing/verifying. JWT payload: `{ sub: userId (number), email }`, 30-day expiry.
- Token stored in **localStorage** as `auth_token`. User object stored as `auth_user`.
- `setAuthTokenGetter` from `@workspace/api-client-react` is called on auth context mount so all generated API client calls include the `Authorization: Bearer` header automatically.
- `req.userId` (number) set by requireAuth middleware — routes use it directly as the DB user ID (no extra lookup needed).

**Why:** Removed dependency on Clerk's service, external API keys, and proxy middleware. Simple self-hosted auth is sufficient.

## DB schema change (applied 2026-07-18)
- Dropped: `clerk_id text NOT NULL UNIQUE`
- Added: `email text NOT NULL UNIQUE`, `password_hash text NOT NULL`
- Applied via raw SQL (drizzle-kit push requires interactive TTY in Replit).

## Backend files
- `artifacts/api-server/src/middlewares/requireAuth.ts` — JWT verify, sets `req.userId`
- `artifacts/api-server/src/routes/auth.ts` — POST /api/auth/register, POST /api/auth/login
- `artifacts/api-server/src/routes/index.ts` — authRouter added at `/auth`

## Frontend files
- `artifacts/support-chat/src/context/auth.tsx` — AuthProvider + useAuth hook
- `artifacts/support-chat/src/pages/sign-in.tsx` — email/password sign-in form
- `artifacts/support-chat/src/pages/sign-up.tsx` — email/password + handle + displayName registration form
- `artifacts/support-chat/src/App.tsx` — replaced ClerkProvider/Show with AuthProvider/ProtectedRoute/GuestOnlyRoute

## Env var
- `JWT_SECRET` — falls back to `"dev-secret-change-in-production"` if not set.
