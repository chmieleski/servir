# @servir/api Agent Guide

## Project

- `apps/api` is the NestJS API application for Servir.
- App bootstrap is in `apps/api/src/main.ts`, with module wiring in `apps/api/src/app/app.module.ts`.
- The API uses `nestjs-zod` for validation/serialization and exposes Swagger docs.
- Most feature logic should live in libraries (for example `@servir/feature-health`) and be composed by this app.

## Rules

- Always use Context7 first for NestJS, `nestjs-zod`, Nx, and Swagger documentation.
- Keep `main.ts` as the bootstrap/composition layer. Put business behavior in `libs/server/*` libraries.
- Configure environment loading in `AppModule` with `ConfigModule.forRoot(...)`, including `.env` loading and Zod validation via `@servir/config`.
- Keep global validation/serialization/filter setup intact unless explicitly changing API behavior.
- Any request/response shape changes must be reflected in `@servir/contracts` and consumed consistently.
- Read runtime env values through Nest `ConfigService` (typed with `Env` from `@servir/config`); do not read `process.env` directly in API runtime code.
- Add or change env variables only in `libs/shared/config/src/lib/config.ts`, then consume them through `ConfigService`.
- Do not edit `apps/api/dist/*` directly.
- Validate API changes with targeted checks, typically `pnpm nx run @servir/api:build` and `pnpm nx run @servir/api-e2e:e2e`.
