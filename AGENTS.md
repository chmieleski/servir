# Servir Agent Guide

## Project Overview

- This repository is `@servir/source`, a `pnpm` + `nx` TypeScript monorepo.
- `apps/api` is a NestJS 11 API with `nestjs-zod` validation/serialization and Swagger docs.
- `apps/web` is a Next.js 16 web app that consumes API endpoints.
- `apps/api-e2e` contains API integration tests (Jest + Axios).
- `apps/web-e2e` contains browser tests (Playwright).
- `libs/shared/contracts` defines shared Zod schemas and TypeScript types used by API and web.
- `libs/shared/config` defines environment schemas and parsing helpers.
- `libs/server/core` contains shared server concerns (for example global filters/interceptors).
- `libs/server/feature-health` contains the health feature module/controller/service.
- `libs/web/feature-home` and `libs/web/ui` contain web feature and UI libraries.

## Agent Rules

- Always use Context7 tools for library/framework documentation, API references, setup steps, and configuration guidance.
- Context7 workflow is required: resolve the library ID first, then query docs. Only use other sources if Context7 is insufficient.
- Edit source files under `src/` and config files; do not hand-edit generated outputs under `dist/`.
- Keep cross-app API contracts in `@servir/contracts`. If payloads change, update schemas/types and all consumers.
- Keep environment variables centralized in `libs/shared/config/src/lib/config.ts`; add new env vars to the schema before use.
- Follow Nx module boundaries and tags (`scope:web`, `scope:api`, `scope:shared`); do not introduce forbidden cross-scope imports.
- Prefer workspace package imports (`@servir/...`) instead of deep relative imports across projects.
- Use repo scripts for consistency: `pnpm dev`, `pnpm dev:api`, `pnpm dev:web`, `pnpm lint`, `pnpm test`, `pnpm build`, `pnpm check`.
- Validate changes with targeted Nx tasks for touched projects; run `pnpm check` when changes span multiple areas.

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
