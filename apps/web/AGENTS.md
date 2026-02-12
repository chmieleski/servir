# @servir/web Agent Guide

## Project

- `apps/web` is the Next.js 16 App Router frontend application.
- Route entrypoints live under `apps/web/src/app`.
- The app should stay thin and compose behavior from web libraries like `@servir/feature-home`.

## Rules

- Always use Context7 first for Next.js, React, and Nx documentation.
- Keep feature logic in `libs/web/*`; keep `apps/web/src/app/*` focused on route composition.
- Use shared contracts and config helpers (`@servir/contracts`, `@servir/config`) for API integration expectations.
- Prefer server-safe data fetching patterns used in this app (for example `fetch` with explicit cache behavior).
- Do not edit generated build artifacts such as `.next` output.
- Validate web changes with targeted checks, typically `pnpm nx run @servir/web:build` and `pnpm nx run @servir/web:test`.
