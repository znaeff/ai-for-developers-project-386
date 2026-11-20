# AGENTS.md

## Toolchain

- `mise.toml` pins **both Node 22 and pnpm 12.18.0**. Run `mise install` first and use `mise exec -- <cmd>` (or a `mise run` task); a globally installed pnpm/Node may differ.
- The verification gate is `mise run check` — `pnpm lint` → `pnpm typecheck` → `pnpm test`, strictly in that order (`mise.toml`). Run it before finishing a change; CI runs the same command after `pnpm install --frozen-lockfile`.
- Focused checks: `mise exec -- pnpm --filter @app/backend test -- src/app.test.ts`, `mise exec -- pnpm --filter @app/backend typecheck`, `mise exec -- pnpm --filter @app/frontend typecheck`.

## Layout and wiring

- pnpm workspaces contain only `apps/backend` (`@app/backend`) and `apps/frontend` (`@app/frontend`); there is no shared package. Scope package commands with `pnpm --filter @app/<name> ...`.
- Backend: `src/index.ts` is the process entrypoint (`PORT`, default 3000) and passes optional `staticDir`, `apiPrefix` and `allowTestReset` (from `E2E_RESET === '1'`) to `createServer()`; `src/app.ts` exports `createServer()` and is the seam imported by tests. No HTTP framework. Routes: `GET/POST /meeting-types`, `GET /meeting-types/:id/slots`, `GET/POST /bookings`; legacy `GET /reserve` → `200 text/plain Reserved`; unknown paths → 404. With `staticDir` set, non-API GET/HEAD requests serve the built frontend and `/api/*` is normalized before routing. `now`, `staticDir`, `apiPrefix` and `allowTestReset` are internal options, not part of the public API — see `docs/adr/0003-api-contract.md` and `docs/adr/0004-slot-rules.md`.
- Backend is ESM with `module: NodeNext`: local TS imports must keep the `.js` extension (`./app.js`) even though the file is `.ts`. Do not "fix" it to an extensionless import.
- Backend tsconfigs are split: `tsconfig.json` is for typechecking and includes tests; `tsconfig.build.json` extends it and excludes `src/**/*.test.ts`. Keep that exclusion — otherwise compiled tests land in `dist/` and Vitest executes them twice.
- Frontend dev server is Vite on 5173. It proxies `/api` → `http://localhost:3000` and strips the `/api` prefix. `/guest` and `/owner` are real API-backed pages: the guest page lists meeting types, shows free slots and creates bookings; the owner page creates meeting types and lists bookings (refreshing on button click and on window focus/visibility). The landing page links to both; navigation is handled by `window.location.pathname`, without a router.
- shadcn/ui artifacts are `apps/frontend/components.json`, `src/components/ui/button.tsx`, `src/lib/utils.ts`. Dependencies `shadcn`, `cn`, `radix-ui`, `tw-animate-css`, `@fontsource-variable/geist` are deliberate (CSS imports in `src/index.css`), not unused cruft.
- The `@/*` alias is defined in both `vite.config.ts` and `tsconfig.json`; `tsconfig.json` intentionally omits `baseUrl` (deprecated in TypeScript 6).
- `Dockerfile` is multi-stage: Node 22 + Corepack/pnpm build the workspace, the runtime stage contains only `apps/backend/dist`, `apps/frontend/dist`, and minimal `package.json` files. Build and run with `mise run docker:build` and `mise run docker:run`; see `docs/adr/0002-docker-image.md`.

## Tests and CI

- Vitest exists only in the backend. Tests start the server in-process on port 0 and close it in `afterEach` — no running backend, fixtures, or external services are required.
- `POST /__test__/reset` (through Vite: `/api/__test__/reset`) clears meeting types and bookings and returns `204`. It exists only when `createServer({ allowTestReset: true })` is used; `index.ts` enables it for `E2E_RESET=1`.
- Playwright e2e tests live in `e2e-tests/` with the root `playwright.config.ts`. They run against the real Vite dev server and a real backend, both started via `webServer` (the backend with `E2E_RESET=1`). Tests run with `workers: 1` and `fullyParallel: false`, and `e2e-tests/fixtures.ts` resets backend state before each test; run them with `mise run test:e2e` (separate from `mise run check`).
- `.github/workflows/hexlet-check.yml` is auto-generated: do not edit, rename, or delete it (see `.github/workflows/README.md`). Hexlet checks run on every push.
- `.github/workflows/ci.yml` mirrors the local gate on push and pull request; keep it in sync if check steps change. `.github/workflows/playwright.yml` runs e2e separately on the same triggers. `.github/workflows/docker.yml` builds the image and smoke-tests a running container.

## Conventions

- Commit messages follow Conventional Commits: `<type>(<scope>): <description>`. Scope is optional; use `api`, `backend`, `frontend`, `build`, `docker`, or `deps` when useful.
- Types: `feat`, `fix`, `refactor`, `test`, `docs`, `style`, `build`, `ci`, `chore`. Use `build(deps)` for dependency updates; `style` means code formatting, not UI styling.

## Agent skills

### Issue tracker

Issues and specs for this repo live in GitHub Issues (`znaeff/ai-for-developers-project-386`). See `docs/agents/issue-tracker.md`.

### Triage labels

Triage roles map to GitHub labels `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context domain docs: root `GLOSSARY.md` and `docs/adr/`. See `docs/agents/domain.md`.
