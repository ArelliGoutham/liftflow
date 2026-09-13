# LiftFlow — Claude Code Instructions

> This file guides Claude Code and AI agents when working on the LiftFlow codebase.

## Project Overview

LiftFlow is a multi-user workout plan and progress tracker. Users sign in with Google, create workout plans with scheduled days, add exercises (reps or duration tracking), log workout sessions, track progress, and chat with an AI exercise assistant.

## Quick Reference

- **Stack:** Next.js 14 + TypeScript + MongoDB/Mongoose + NextAuth + Tailwind + Gemini AI
- **Test command:** `npm test`
- **Build command:** `npm run build`
- **Dev command:** `npm run dev`
- **Port:** 3000

## Architecture Rules

### Layered MVC with Repository Pattern

1. **Routes (`app/api/`)** — Controllers. Validate auth, call services or repositories, return JSON. No Mongoose imports. No business logic. Max 80 lines.
2. **Services (`lib/services/`)** — Business logic. Orchestrate repositories, external APIs, data transformation. No Mongoose queries directly. Max 120 lines.
3. **Repositories (`lib/db/repositories/`)** — Data access layer. All Mongoose queries. Pure functions that return typed data. No response shaping. Max 100 lines per file.
4. **Models (`lib/db/models/`)** — Mongoose schemas. Define shape and field validation only. No query methods. Max 50 lines.
5. **Components (`components/`)** — Presentational. Props in, UI out. Fetch via `fetch('/api/...')`. No direct DB access. Max 200 lines.
6. **Types (`types/`)** — Shared interfaces. Single source of truth. No duplicate definitions.

### Data flow

```
User → Component → fetch() → Route handler → Repository → Model → MongoDB
                                                           ↓
                                            Route handler ← Repository
                                                 ↓
                                         JSON response → Component → UI
```

### External services

```
Exercise data: GitHub CDN (ArelliGoutham/exercise-database) → lib/exercises/externalExercises.ts
AI chat: Google Gemini → lib/ai/config.ts + app/api/chat/route.ts
Auth: Google OAuth via NextAuth → lib/auth.ts
```

## Coding Principles

### Design Patterns (LLD)
- **Strategy** — AI/CDN providers implement common interfaces; routes use factories, not hardcoded provider names
- **Repository** — all DB access through typed functions; no Mongoose outside `lib/db/`
- **Factory** — object creation based on config goes through factory functions
- **Adapter** — third-party SDKs wrapped in app-specific interfaces
- **Singleton** — only for expensive resources (DB connection, exercise cache)

### SOLID
- **S:** One responsibility per file — a repo handles one entity, a component renders one concern
- **O:** Extend through composition, not modification — add new files, don't bloat existing ones
- **L:** Repositories are replaceable with mocks implementing the same interface
- **I:** Small, focused type definitions — don't create one mega-interface
- **D:** Routes depend on repository/service abstractions, not Mongoose models directly

### DRY
- Never duplicate a Mongoose query, type definition, or UI pattern
- Extract shared logic to utilities or repositories
- Exception: test setup may repeat for clarity

### YAGNI
- No speculative schema fields, abstractions, or config options
- Delete dead code immediately
- Don't build generic frameworks when a specific function works

### KISS
- Prefer plain functions over classes
- Prefer explicit conditionals over clever ternaries
- Prefer readable code over clever code

## Function Standards

### Required for every exported function:
1. Explicit parameter types (no `any`)
2. Explicit return type
3. JSDoc with `@param` and `@returns`
4. Try/catch for external calls
5. Max 30 lines — extract helpers if longer

### Example:
```typescript
/**
 * Retrieves exercAises for a user with optional filtering.
 * @param userId - Authenticated user's MongoDB ObjectId as string
 * @param filter - Optional category, muscle, equipment filters
 * @returns Promise resolving to array of exercise documents
 */
export async function getUserExercises(
  userId: string,
  filter?: ExerciseFilter
): Promise<Exercise[]> {
  // implementation
}
```

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Component files | PascalCase | `ExerciseDetail.tsx` |
| Utility files | camelCase | `externalExercises.ts` |
| Functions | camelCase | `getUserPlans` |
| Types | PascalCase + `I` prefix | `IExercise` |
| Constants | UPPER_SNAKE | `CACHE_TTL_MS` |
| Env vars | UPPER_SNAKE | `GEMINI_API_KEY` |

## ESLint Rules

- No `any` (use `unknown` or typed interfaces)
- No `console.log` (use `console.error` only)
- No unused imports or variables
- React hooks rules enforced
- Exhaustive dependencies enforced
- Import order: external → `@/` internal → relative

## Testing

- **Unit tests** (`tests/unit/`): Pure logic — schedule math, validation, transformations
- **Component tests** (`tests/ui/`): React Testing Library — rendering, interactions, accessibility
- **Integration tests** (`tests/integration/`): API routes, repository operations
- Mock all external calls — tests must run offline
- One assertion per test
- Run `npm test` before every commit

## API Conventions

- `GET /api/resource` — list with optional query filters
- `POST /api/resource` — create
- `PUT /api/resource/:id` — update
- `DELETE /api/resource/:id` — delete
- Always check `getServerSession` for user-scoped routes
- Always filter by `session.user.id` — never trust client userId
- Error shape: `{ "error": "message" }`
- Success: raw document or array of documents

## File Size Limits

| Type | Max lines | Split strategy |
|---|---|---|
| Component | 200 | Sub-components |
| Route handler | 80 | Move to repository/service |
| Repository | 100 | Split by entity |
| Model | 50 | Rarely needed |
| Types | 150 | Split by domain |

## Git Workflow

- Branch: `feat/`, `fix/`, `docs/`, `refactor/` + description
- Commits: conventional — `feat:`, `fix:`, `docs:`, `refactor:`, `test:`
- Always PR — never push to main directly
- All tests must pass before merge
- Include `Co-authored-by: Copilot` trailer for AI-assisted commits

## Key Files

| File | Purpose |
|---|---|
| `lib/auth.ts` | NextAuth config with Google OAuth |
| `lib/db/connection.ts` | MongoDB connection with caching |
| `lib/schedule.ts` | Week schedule computation (date math, grace period) |
| `lib/exercises/externalExercises.ts` | Fetches 1,390 exercises from GitHub CDN |
| `lib/ai/config.ts` | Gemini model config and system prompt |
| `components/layout/AppShell.tsx` | App shell with sidebar, bottom nav, chat |
| `types/index.ts` | All shared TypeScript interfaces |

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Yes | NextAuth secret |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `NEXTAUTH_URL` | Yes | App URL |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (free tier) |
| `GEMINI_MODEL` | No | Model name (default: gemini-3.1-flash-lite) |

## Exercise Database

Exercises are NOT stored in MongoDB. They are fetched at runtime from:
- **Repo:** https://github.com/ArelliGoutham/exercise-database
- **CDN URL:** `https://raw.githubusercontent.com/ArelliGoutham/exercise-database/main/dist/exercises.json`
- **Count:** 1,376 unique exercises (merged from free-exercise-db + RepDB)
- **Cache:** 10-minute server-side cache in `lib/exercises/externalExercises.ts`
- **Images:** Self-hosted in the exercise-database repo under `/exercises/`

MongoDB only stores: users, plans, workout days, sessions, exercise logs, chat messages.
