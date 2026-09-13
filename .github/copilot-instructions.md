# LiftFlow — Copilot Instructions

> This file guides GitHub Copilot and AI coding assistants when working on the LiftFlow codebase.

## Project Overview

LiftFlow is a multi-user workout plan and progress tracker built with Next.js 14, TypeScript, MongoDB Atlas, and Google Gemini AI. It provides an exercise library of 1,390+ exercises, workout plan scheduling, progress tracking, and an AI chat assistant.

## Tech Stack

- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript 5.5 (strict mode)
- **Database:** MongoDB Atlas + Mongoose 8
- **Auth:** NextAuth.js 4 with Google OAuth
- **AI:** Vercel AI SDK v7 + Google Gemini
- **Styling:** Tailwind CSS 3
- **Testing:** Jest 29 + React Testing Library
- **Deployment:** Vercel

## Project Structure

```
liftflow/
├── app/                    # Next.js App Router — pages and API routes
│   ├── api/               # API route handlers (controllers)
│   │   ├── chat/          # AI chat endpoint
│   │   ├── dashboard/     # Dashboard data aggregation
│   │   ├── exercises/     # Exercise CRUD
│   │   ├── plans/         # Plan CRUD
│   │   ├── sessions/      # Workout session CRUD
│   │   ├── workout-days/  # Workout day CRUD
│   ├── dashboard/         # Dashboard page
│   ├── exercises/         # Exercise library pages
│   ├── login/            # Login page
│   ├── plans/            # Plan management pages
│   ├── workout/          # Workout session page
│   └── ...
├── components/            # React components (presentational only)
│   ├── auth/             # Sign-in, user menu, sign-out
│   ├── chat/             # AI chat assistant
│   ├── dashboard/        # Week strip, schedule display
│   ├── exercises/        # Exercise list, detail, filter
│   ├── layout/           # AppShell, navigation
│   ├── plans/            # Plan cards, forms, day editor
│   └── workout/          # Exercise log form
├── lib/                   # Business logic and infrastructure
│   ├── ai/               # AI config and prompts
│   ├── db/               # Database layer
│   │   ├── models/       # Mongoose schemas (shape only)
│   │   └── repositories/ # Data access functions
│   ├── exercises/        # External exercise data fetching
│   └── ...
├── types/                 # Shared TypeScript interfaces
├── tests/                 # Test suites
│   ├── integration/      # API and data layer tests
│   ├── ui/               # Component tests
│   └── unit/             # Pure logic tests
└── docs/                  # Documentation
```

## Coding Standards

Read `docs/ENGINEERING_STANDARDS.md` for the full specification. Key rules:

### Architecture
- **Routes = controllers** — validate input, call repositories, return responses. No business logic.
- **Repositories = data access** — all Mongoose queries. No business logic, no response shaping.
- **Components = presentational** — receive props, render UI, call APIs via `fetch()`. Never touch Mongoose.
- **Types = shared** — all interfaces in `types/index.ts`.

### Principles
- **SOLID** — single responsibility per file, dependency inversion via repositories
- **DRY** — no duplicated queries, types, or UI patterns
- **YAGNI** — no speculative fields, abstractions, or config options
- **KISS** — plain functions over classes, explicit over clever

### Function Rules
- Explicit parameter and return types on all exported functions
- JSDoc comments on exported functions (`@param`, `@returns`)
- No `any` in signatures — use `unknown` or typed interfaces
- Max 30 lines per function — extract helpers if longer
- Try/catch around all external calls (DB, API, CDN)

### Naming
- Files (components): PascalCase — `ExerciseDetail.tsx`
- Files (utils): camelCase — `externalExercises.ts`
- Functions: camelCase — `getUserPlans`
- Types: PascalCase with `I` prefix — `IExercise`
- Constants: UPPER_SNAKE — `CACHE_TTL_MS`

## When Generating Code

### Do
- Follow the layered architecture: route → repository → model
- Add TypeScript types for all function parameters and return values
- Include JSDoc on exported functions
- Use `console.error` for error logging (never `console.log`)
- Add `aria-label` to interactive elements without visible text
- Add `role="alert"` to error messages
- Handle loading, error, and empty states in every data-fetching component
- Use `AbortController` for client-side fetch cleanup
- Validate API responses before using them (check `Array.isArray`, field types)
- Use Tailwind utility classes — no custom CSS unless necessary
- Use `next/link` for internal navigation
- Use `next/image` or `<img>` with `loading="lazy"` for images

### Don't
- Call Mongoose directly from components or route handlers — use repositories
- Use `any` type (except Next.js route handler params and test mocks)
- Leave `console.log` in committed code
- Create files longer than 200 lines — split them
- Add unused imports or variables
- Hardcode values that should be environment variables
- Fetch user data without checking `getServerSession` first
- Trust client-provided `userId` — always use `session.user.id`
- Add dependencies without updating `package.json` and testing the build

## Testing

- Write tests for new logic before or alongside implementation
- Use `tests/unit/` for pure functions (schedule math, validation)
- Use `tests/ui/` for component tests (React Testing Library)
- Use `tests/integration/` for API and repository tests
- Mock all external calls (`fetch`, Mongoose, Gemini API) — tests run offline
- One assertion per test — name tests descriptively
- Run `npm test` before every commit

## Environment Variables

```bash
MONGODB_URI          # MongoDB Atlas connection string
NEXTAUTH_SECRET      # NextAuth.js secret
GOOGLE_CLIENT_ID     # Google OAuth client ID
GOOGLE_CLIENT_SECRET # Google OAuth client secret
NEXTAUTH_URL         # App URL (localhost:3000 or production domain)
GEMINI_API_KEY       # Google Gemini API key (free tier)
GEMINI_MODEL         # Optional: model name (default: gemini-3.1-flash-lite)
```

## Common Tasks

### Add a new API endpoint
1. Create route handler in `app/api/<resource>/route.ts`
2. Add repository functions in `lib/db/repositories/<resource>Repository.ts`
3. Add Mongoose model in `lib/db/models/<Resource>.ts` if new entity
4. Add types in `types/index.ts`
5. Write tests
6. Update this file if structure changes

### Add a new page
1. Create page in `app/<route>/page.tsx`
2. Create components in `components/<area>/`
3. Fetch data via `fetch('/api/<resource>')`
4. Handle loading, error, and empty states
5. Ensure responsive (mobile + desktop)
6. Write component tests

### Add a new exercise data source
1. Update `lib/exercises/externalExercises.ts` to fetch from the new source
2. Update the build script in the `exercise-database` repo
3. No changes to MongoDB — exercises are fetched at runtime

## Git Workflow

- Create a branch: `feat/<description>` or `fix/<description>`
- Commit with conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
- Open a PR — never push directly to main
- All tests must pass before merge
- Use the `Co-authored-by` trailer for AI-assisted commits
