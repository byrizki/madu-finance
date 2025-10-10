# byMADU Finance App (English)

## Overview
byMADU is a personal finance dashboard built with Next.js that helps individuals and shared teams keep track of wallets, transactions, budgets, and installments in a single workspace. The app blends modern authentication, collaborative account management, and responsive UI patterns to deliver real-time financial insights.

## Key Features
- **Adaptive dashboard summary**: `DashboardClient` in `app/dashboard/dashboard/rcc/dashboard-client.tsx` aggregates wallet balances, monthly activity, and installment exposure with the option to mask values via `ShowValuesProvider`.
- **Granular transaction control**: `TransactionsClient` in `app/dashboard/transactions/rcc/transactions-client.tsx` exposes multi-tab analytics, saved filters, and quick actions for new transactions and budgets.
- **Inline transaction logging**: `QuickTransactionSheet` (`components/transactions/quick-transaction-sheet.tsx`) enables fast income/expense capture without navigating away.
- **Shared account collaboration**: `MemberProvider` (`components/context/member-context.tsx`) coordinates shared accounts, member roles, and switching between active members.
- **Integrated authentication**: `lib/auth/index.ts` configures `better-auth` for email/password and Google Sign-In, while `middleware.ts` gates `/dashboard` routes for authenticated sessions only.

## Tech Stack
- **Framework**: Next.js 15 App Router, React 19, TypeScript.
- **UI & styling**: Tailwind CSS 4, Radix UI primitives, shadcn/ui components, `motion`, and `embla-carousel` animations.
- **State & data**: `@tanstack/react-query` for fetching/caching, Zustand for lightweight state, React Context providers for theme and value visibility.
- **Database**: PostgreSQL orchestrated via Drizzle ORM (`lib/db/schema.ts`; migration files in `drizzle/`).
- **Authentication**: `better-auth` with Drizzle adapter, Google OAuth, and Supabase Postgres.
- **Utilities**: `date-fns` for dates, `zod` validation schemas, `react-hook-form`-based forms, `sonner` toasts.

## Project Structure
```text
app/
  layout.tsx                  # Root providers (theme, auth, query, show-values)
  page.tsx                    # Landing page with rotating hero
  login/page.tsx              # Email & Google One Tap authentication flow
  dashboard/
    page.tsx                  # Entry point rendering the dashboard client
    dashboard/rcc/            # Dashboard-specific client components & utilities
    transactions/rcc/         # Transaction analytics, filters, quick actions
components/
  dashboard/                  # Shared dashboard widgets and masked value UI
  transactions/               # Transaction sheets and forms
  providers/                  # Cross-cutting providers (auth, query, theme)
hooks/                        # Data hooks (wallets, budgets, installments, etc.)
lib/
  auth/                       # better-auth initialization
  db/                         # Drizzle client and schema definitions
middleware.ts                 # Route protection and login redirect handling
```

## Getting Started
### 1. Prerequisites
- Node.js 22 (see `.nvmrc`).
- pnpm (`npm install -g pnpm`).
- Reachable PostgreSQL instance (Supabase or self-hosted).

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Environment Variables
Create `.env.local` with the following keys:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string used by Drizzle and the runtime app. |
| `NEXT_PUBLIC_APP_URL` | Public origin for the deployed app (e.g. `https://app.example.com`). |
| `NEXT_PUBLIC_SITE_URL` | Optional fallback origin if `NEXT_PUBLIC_APP_URL` is empty. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID for One Tap and popup login. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret used server-side. |
| `NEXT_PUBLIC_ENABLE_DEVTOOLS` | Set to `true` to enable React Query Devtools in `components/providers/query-provider.tsx`. |

### 4. Database Migrations
Generate and push Drizzle migrations once `DATABASE_URL` is configured:
```bash
pnpm db:generate
pnpm db:push
```

### 5. Available Scripts
```bash
pnpm dev        # Start Next.js dev server on http://localhost:5000
pnpm lint       # Run ESLint checks
pnpm build      # Create production build
pnpm start      # Serve the production build
```

## Application Workflows
- **Authentication lifecycle**: `AuthProvider` in `components/providers/auth-provider.tsx` wires `better-auth` session hooks, default account resolution via `useDefaultAccount`, and exposes helpers to refresh or sign out.
- **Data fetching**: Hooks such as `useWallets`, `useTransactions`, and `useBudgets` under `hooks/` leverage React Query for caching, while raising toast errors through `sonner`.
- **UI composition**: `AdaptiveLayout` (`components/layout/adaptive-layout.tsx`) and `ThemeProvider` coordinate responsive design and theming for dashboard routes.
- **Access control**: `middleware.ts` redirects anonymous users to `/login` and packs the intended target into `redirectTo` for a smooth post-auth experience.

## Development Guidelines
- **Forms**: Implemented with `react-hook-form` to preserve local form state and testability per the repository guide.
- **File naming**: Follow kebab-case for new files in line with `code-style-guide.md`.
- **Component placement**: Put route-specific client components inside `app/<route>/rcc/`; shareable components belong in `components/`.
- **Visibility toggles**: Respect `ShowValuesProvider` when introducing new financial summaries so masking remains consistent.

## Deployment Checklist
- Ensure `DATABASE_URL` points to the production database with the latest migrations applied.
- Set `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_SITE_URL` to production domains.
- Configure Google OAuth credentials (`NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) for the production origin.
- Run `pnpm build` locally or in CI to validate the production bundle.
- Align hosting platform settings (Vercel, Fly.io, etc.) with Next.js requirements, especially around Edge/Node runtimes.

## Troubleshooting
- **"SUPABASE_DB_URL environment variable is required"**: Thrown by `drizzle.config.ts`; confirm `DATABASE_URL` exists before executing Drizzle CLI commands.
- **Empty dashboard data**: Default account initialization occurs via `/api/profile/init` in `app/login/page.tsx`; ensure the call succeeds immediately after login.
- **Unauthorized access dialogs**: Errors from `isUnauthorizedAccountError` indicate the session lacks access to the requested account slug; refresh the session and verify membership.

For additional improvements, document new endpoints, hooks, or components here so the rest of the team can ramp up quickly.
