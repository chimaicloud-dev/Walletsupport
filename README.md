# Wallet Support ExPJdev

A professional live customer support chat platform for crypto exchange users. Agents get shareable chat links, visitors chat in real time, and admins manage conversations in a full inbox dashboard.

## Tech Stack

- **Frontend**: React 19 + Vite + Tailwind CSS v4
- **Backend**: Express.js (Node.js) via Vercel Serverless Functions
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Clerk
- **Monorepo**: pnpm workspaces

---

## Deploy to Vercel (One Click)

### Prerequisites

1. A PostgreSQL database — [Neon](https://neon.tech) (free tier works great)
2. A [Clerk](https://clerk.com) account and application

### Steps

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

2. **Import on Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel will auto-detect the `vercel.json` configuration

3. **Set Environment Variables** in the Vercel dashboard (Settings → Environment Variables):

   | Variable | Description |
   |----------|-------------|
   | `DATABASE_URL` | PostgreSQL connection string (e.g. from Neon) |
   | `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (`pk_live_...`) |
   | `CLERK_SECRET_KEY` | Clerk secret key (`sk_live_...`) |
   | `VITE_CLERK_PUBLISHABLE_KEY` | Same as `CLERK_PUBLISHABLE_KEY` |
   | `VITE_CLERK_PROXY_URL` | `https://YOUR-APP.vercel.app/api/__clerk` |

4. **Run database migrations** — after first deploy, push the schema:
   ```bash
   DATABASE_URL=your_db_url pnpm --filter @workspace/db run push
   ```
   Or use the Drizzle Studio / your Neon dashboard to run the SQL.

5. **Deploy** — click Deploy on Vercel. Your app will be live at `https://your-app.vercel.app`.

---

## Local Development

```bash
# Install dependencies
pnpm install

# Copy env file and fill in values
cp .env.example .env

# Push database schema
pnpm --filter @workspace/db run push

# Start API server (terminal 1)
cd artifacts/api-server
PORT=3001 pnpm run dev

# Start frontend (terminal 2)
cd artifacts/support-chat
PORT=5173 pnpm run dev
```

---

## Project Structure

```
├── artifacts/
│   ├── api-server/       # Express.js REST API
│   └── support-chat/     # React + Vite frontend
├── lib/
│   ├── db/               # Drizzle ORM schema + client
│   ├── api-spec/         # OpenAPI specification
│   ├── api-zod/          # Zod validation schemas
│   └── api-client-react/ # Generated React Query hooks
├── api/
│   └── index.js          # Vercel serverless entry point
└── vercel.json           # Vercel deployment configuration
```

---

## Required Environment Variables

See `.env.example` for the full list with descriptions.

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | PostgreSQL URL |
| `CLERK_PUBLISHABLE_KEY` | Yes | Used by API server |
| `CLERK_SECRET_KEY` | Yes | Used by API server |
| `VITE_CLERK_PUBLISHABLE_KEY` | Yes | Used by frontend (build time) |
| `VITE_CLERK_PROXY_URL` | Yes | e.g. `https://yourapp.vercel.app/api/__clerk` |
