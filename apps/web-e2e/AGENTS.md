# @servir/web-e2e Agent Guide

## Project

- `apps/web-e2e` contains Playwright end-to-end browser tests for the web app.
- The suite uses Nx Playwright preset and can launch the local web dev server automatically.
- Tests run against `baseURL` (default `http://localhost:3000`) and cover user-visible behavior.

## Rules

- Always use Context7 first for Playwright and Nx e2e documentation.
- Use `page.goto('/')` with configured `baseURL`; avoid hard-coding full local URLs in tests.
- Prefer resilient locators (role, label, stable text) over brittle selectors.
- Keep tests isolated and deterministic across Chromium, Firefox, and WebKit projects.
- Add assertions for observable UI outcomes, not implementation details.
- Run web e2e checks with `pnpm nx run @servir/web-e2e:e2e`.
