# Contributing to CatCare UTM

Thanks for contributing! This guide covers the workflow and conventions.

## Development setup

1. **Clone** the repo and `npm install --include=dev` in both `backend/` and
   `frontend/`.
2. **Copy** `backend/.env.example` → `backend/.env` and fill in your
   Supabase credentials.
3. **Initialize** the database with `catcare-full-setup.sql` then
   `seed-dev.sql` (for dev test data).
4. **Run** both:
   ```bash
   cd backend && npm run dev   # http://localhost:3001
   cd frontend && npm run dev  # http://localhost:3000
   ```

## Dev test accounts (seed-dev.sql)

| Email                          | Password     | Role    |
|--------------------------------|--------------|---------|
| `admin@utm.my`                 | `password123`| admin   |
| `manager@utm.my`               | `password123`| manager |
| `student@graduate.utm.my`      | `password123`| student |

> ⚠️ **Change these passwords in production!** The seed file is for dev only.

## Branch & PR workflow

1. **Branch** off `main`: `git checkout -b feat/your-feature`
2. **Commit** with conventional commits:
   - `feat:` new feature
   - `fix:` bug fix
   - `refactor:` code restructure (no behavior change)
   - `docs:` documentation only
   - `test:` test additions
   - `chore:` tooling, deps, config
3. **Push** and open a PR. CI must pass (TypeScript compiles + tests pass).
4. **Review** — at least one teammate approves before merge.

## Code style

### TypeScript
- **Strict mode** is on — no `any` unless absolutely necessary (and add a
  `// eslint-disable-next-line` comment explaining why).
- **Use `interface` for object shapes**, `type` for unions/intersections.
- **Always type function params and return values** — no implicit `any`.
- **Use `import type` for type-only imports** (smaller bundle).

### Backend (Express)
```
routes.ts    — Route + middleware chain + Zod schema binding
controller.ts — HTTP-only: parse params, call service, send response
service.ts    — Business rules + audit hooks
repository.ts — Pure data access (parameterized SQL)
```

- **Never** build SQL with string concatenation — always use `$1, $2, ...`
  parameterized queries.
- **Always** wrap route handlers in `try/catch` and call `next(error)`.
- **Always** call `audit(req, { ... })` for security-relevant actions.
- **Validate** every input with Zod — even trusted internal callers.

### Frontend (Next.js + React)
- **Server Components by default**; `'use client'` only when you need
  state, effects, or browser APIs.
- **Co-locate** state with the component that owns it; lift to Zustand only
  for truly global state (auth, theme).
- **Use shadcn/ui** primitives (`@/components/ui/...`) — don't reinvent
  buttons, dialogs, etc.
- **Always** show loading states (Skeleton) and error states (toast) for
  async operations.

### Naming
- **Files**: `kebab-case.ts` for modules, `PascalCase.tsx` for components.
- **Types/Interfaces**: `PascalCase` (e.g., `CreateCatInput`).
- **Variables/functions**: `camelCase`.
- **Constants**: `SCREAMING_SNAKE_CASE`.
- **DB tables/columns**: `snake_case` (Postgres convention).

## Database migrations

1. **Create** a new file: `migrations/0NN_description.sql` (next number in
   sequence).
2. **Make it idempotent** — use `CREATE TABLE IF NOT EXISTS`,
   `CREATE INDEX IF NOT EXISTS`, `ALTER TYPE ... ADD VALUE IF NOT EXISTS`.
3. **Test** it locally by running it twice — second run must succeed without
   changes.
4. **Update** `catcare-full-setup.sql` to mirror the migration (so fresh
   installs get the latest schema).
5. **Commit** the migration and the setup update together.

Migrations run automatically on backend startup.

## Testing

```bash
cd backend && npm test
```

- **Integration tests** live in `__tests__/api.test.ts` and use supertest
  against the real Express app (with a real test database).
- **Name tests** descriptively: `it('admin can change user role to manager')`.
- **Cover the happy path AND the failure modes** — bad input, missing auth,
  insufficient role, not-found, conflict.
- **Never** commit secrets or real credentials in tests.

## Security checklist for new features

Before opening a PR for a new endpoint or feature, verify:

- [ ] **Auth**: requires authentication where appropriate (`authMiddleware`)
- [ ] **RBAC**: uses the correct role gate (`requireRole('manager')` etc.)
- [ ] **CSRF**: protected by `csrfProtection` for state-changing methods
- [ ] **Validation**: Zod schema on every input (body, params, query)
- [ ] **SQL**: all queries use parameterized `$1, $2, ...` placeholders
- [ ] **Files**: magic-byte validation on uploads
- [ ] **Audit**: security-relevant action logged via `audit()`
- [ ] **Errors**: typed errors from `errors.ts`, never raw `new Error()`
- [ ] **Secrets**: nothing sensitive logged or returned in responses
- [ ] **Tests**: at least one happy-path test and one failure-mode test

## Frontend checklist

- [ ] Loading state (Skeleton) for async data
- [ ] Error state (toast) on API failure
- [ ] Form validation matches backend Zod schema
- [ ] Responsive on mobile (test at 375px width)
- [ ] Accessible: semantic HTML, `aria-label` on icon-only buttons, keyboard
      navigation works
- [ ] No `console.log` in committed code

## Reporting security issues

**Do not** open a public issue for security vulnerabilities. Email the team
lead directly. We'll acknowledge within 48 hours and coordinate a fix.

## License

By contributing, you agree that your contributions are licensed under the
same terms as the project (internal UTM academic use).
