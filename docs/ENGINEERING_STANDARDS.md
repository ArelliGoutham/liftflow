# LiftFlow — Engineering Standards & Coding Principles

## Architecture

### Pattern: Layered MVC with Repository abstraction

```
┌──────────────────────────────────────────────┐
│                  Routes / Pages               │  Next.js App Router
│              (Controllers — thin)             │  app/api/*/route.ts
├──────────────────────────────────────────────┤
│              Repositories                     │  Data access layer
│         (lib/db/repositories/)                │  No business logic here
├──────────────────────────────────────────────┤
│               Models                          │  Mongoose schemas
│           (lib/db/models/)                    │  Shape + validation only
├──────────────────────────────────────────────┤
│              Components                       │  Presentational layer
│            (components/)                      │  UI only — no DB calls
├──────────────────────────────────────────────┤
│               Types                           │  Shared interfaces
│              (types/)                         │  Single source of truth
└──────────────────────────────────────────────┘
```

### Rules

1. **Routes are controllers** — they validate input, call repositories, and return responses. No business logic in route handlers.
2. **Repositories own data access** — all Mongoose queries live in `lib/db/repositories/`. Routes and components never call Mongoose directly.
3. **Models define shape only** — Mongoose schemas in `lib/db/models/` define document structure and field validation. No query methods on models.
4. **Components are presentational** — React components in `components/` receive props and render UI. They call API routes via `fetch()`, never the database directly.
5. **Types are shared** — all interfaces live in `types/index.ts`. No duplicate type definitions across files.
6. **External services are isolated** — third-party integrations (Gemini AI, exercise CDN) live in `lib/ai/` and `lib/exercises/` with clear boundaries.

---

## Coding Principles

### SOLID

- **Single Responsibility:** Each file has one reason to change. A repository handles one entity. A component renders one UI concern.
- **Open/Closed:** Extend behavior through composition, not modification. Add new repositories or components rather than editing existing ones for new features.
- **Liskov Substitution:** Any repository can be replaced with a mock that implements the same interface. Components accept props, not concrete dependencies.
- **Interface Segregation:** Types in `types/index.ts` are small and focused. Don't create one giant `Entity` interface — split by concern.
- **Dependency Inversion:** Routes depend on repository functions (abstractions), not Mongoose models directly. Repositories depend on model interfaces, not concrete implementations.

### DRY (Don't Repeat Yourself)

- Never duplicate a Mongoose query across two files — extract to repository.
- Never duplicate a type definition — define once in `types/`.
- Never duplicate a UI pattern — extract to a component.
- Never duplicate an API response shape — define a type and reuse.
- **Exception:** Test setup code may repeat for clarity. Don't over-abstract test fixtures.

### YAGNI (You Aren't Gonna Need It)

- Don't add fields to schemas "for future use."
- Don't create abstractions until you have 2+ concrete implementations.
- Don't add configuration options until there's a real consumer.
- Don't build generic frameworks when a specific function works.
- Delete dead code. If a function is unused, remove it.

### KISS (Keep It Simple, Stupid)

- Prefer plain functions over classes.
- Prefer explicit conditionals over clever ternary chains.
- Prefer readable code over clever code.
- A 20-line file that does one thing is better than a 200-line file that does five.

---

## Function Standards

### Every function must have:

1. **Explicit parameter types** — no `any` in function signatures (except API route handlers where Next.js types apply).
2. **Explicit return type** — for exported functions, always declare the return type.
3. **JSDoc comment** — for exported functions, include a brief description, `@param`, and `@returns`.
4. **Error handling** — wrap external calls (DB, API, CDN) in try/catch. Never let an unhandled error reach the user.
5. **Single responsibility** — if a function has more than 3 levels of nesting, extract a helper.

### Example

```typescript
/**
 * Retrieves all exercises for a user with optional filtering.
 * @param userId - The authenticated user's MongoDB ObjectId as a string
 * @param filter - Optional category, muscle, equipment, and level filters
 * @returns Array of exercise documents matching the filter, sorted by name
 */
export async function getUserExercises(
  userId: string,
  filter?: ExerciseFilter
): Promise<Exercise[]> {
  await connectToDatabase();
  const query = buildQuery(userId, filter);
  return Exercise.find(query).sort({ name: 1 }).lean() as unknown as Promise<Exercise[]>;
}
```

### Forbidden patterns

- `async function foo() { ... }` without a return type on exported functions
- `function foo(data: any)` — use a typed interface
- `catch {}` with no logging or error propagation — at minimum log the error
- Functions longer than 30 lines — extract helpers

---

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| Files (components) | PascalCase | `ExerciseDetail.tsx` |
| Files (utilities) | camelCase | `externalExercises.ts` |
| Files (models) | PascalCase | `WorkoutDay.ts` |
| Functions | camelCase | `getUserPlans` |
| Types/Interfaces | PascalCase, prefix `I` | `IExercise`, `IPlan` |
| Constants | UPPER_SNAKE | `SYSTEM_PROMPT`, `CACHE_TTL_MS` |
| React components | PascalCase | `ExerciseList` |
| API routes | kebab-case in URL | `/api/workout-days` |
| Environment variables | UPPER_SNAKE | `GEMINI_API_KEY` |

---

## Lint Rules (ESLint + Next.js)

### Must-follow rules

1. **No `any` type** — use `unknown` and narrow, or define a proper interface. `any` is only allowed in:
   - Next.js route handler signatures (`request: NextRequest`)
   - Test mocks (`jest.fn() as any`)

2. **No `console.log` in production code** — use `console.error` for error logging only. Debug logs must be removed before commit.

3. **No unused imports** — remove them. ESLint will flag.

4. **No unused variables** — prefix with `_` if intentionally unused (e.g., `_request` in route handlers).

5. **React hooks rules** — hooks must be at top level, not in conditionals or loops.

6. **Exhaustive dependencies** — `useEffect` must declare all dependencies. Use `useCallback` for function deps.

7. **Accessible interactive elements** — all buttons must have `aria-label` if no text. All images must have `alt`.

8. **Import order** — external packages first, then `@/` internal imports, then relative imports.

### Recommended ESLint config

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "no-explicit-any": "warn",
    "no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error"] }],
    "react-hooks/exhaustive-deps": "error",
    "react-hooks/rules-of-hooks": "error"
  }
}
```

---

## Testing Standards

### What to test

| Layer | Test type | What to verify |
|---|---|---|
| **Schedule logic** | Unit | Date math, completion checks, grace period, catch-up eligibility |
| **Components** | Integration (RTL) | Rendering, user interactions, accessibility (aria) |
| **API routes** | Integration | Auth checks, response shapes, error handling |
| **Repositories** | Integration (with test DB) | CRUD operations, query filters, user isolation |

### Test principles

1. **Test behavior, not implementation** — don't assert on internal state, assert on observable output.
2. **One assertion per test** — each test verifies one thing. Name tests descriptively: `it('marks past uncompleted workouts as missed')`.
3. **No network calls in tests** — mock `fetch`, Mongoose, and external APIs. Tests must run offline.
4. **Arrange-Act-Assert** — set up state, perform action, verify result. Keep these sections visually separated.
5. **Realistic test data** — use data that resembles production shapes, not empty strings.
6. **Don't test the framework** — don't test that React renders or that Mongoose connects. Test your logic.

---

## API Design Standards

### Route conventions

- `GET /api/resource` — list resources (with query params for filtering)
- `POST /api/resource` — create a resource
- `GET /api/resource/:id` — get single resource
- `PUT /api/resource/:id` — update a resource
- `DELETE /api/resource/:id` — delete a resource

### Response shapes

```typescript
// Success — single resource
{ "_id": "abc123", "name": "Test", ... }

// Success — collection
[{ "_id": "abc123", ... }, { "_id": "def456", ... }]

// Error
{ "error": "Human-readable message" }
```

### Status codes

| Code | When to use |
|---|---|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad request — missing required fields |
| 401 | Unauthorized — not signed in |
| 404 | Not found — resource doesn't exist for this user |
| 500 | Server error — catch-all for unexpected failures |

### Auth rules

- Every route that touches user data must call `getServerSession(authOptions)` first.
- User-scoped queries must filter by `session.user.id` — never trust client input for user identity.
- Public routes (like GET exercises) may skip auth.

---

## File Size Limits

| File type | Max lines | Action if exceeded |
|---|---|---|
| Component (.tsx) | 200 | Split into sub-components |
| Route handler | 80 | Move logic to repository or service |
| Repository | 100 | Split by entity or concern |
| Model | 50 | Should rarely exceed this |
| Type file | 150 | Split by domain if larger |

---

## Git Conventions

### Branch names

```
feat/description       — new features
fix/description        — bug fixes
docs/description       — documentation only
refactor/description   — code restructuring, no behavior change
```

### Commit messages

```
type: concise description

Optional body explaining why (not what).
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`

### PR rules

- One feature/fix per PR
- PR description must include: what changed, why, how to test
- All tests must pass before merge
- No direct pushes to main — always via PR
