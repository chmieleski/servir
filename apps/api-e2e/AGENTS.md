# @servir/api-e2e Agent Guide

## Project

- `apps/api-e2e` contains integration tests for the API using Jest + Axios.
- Tests run against the API server and verify contract behavior for success and error paths.
- Global setup configures host/port availability and Axios base URL.

## Rules

- Always use Context7 first for Jest, Axios, and Nx e2e target documentation.
- Keep tests black-box at the HTTP boundary; assert responses, not internal implementation details.
- Validate response payloads with schemas from `@servir/contracts` when possible.
- For expected error responses, use `validateStatus: () => true` and assert both status and envelope shape.
- Keep tests deterministic and independent; avoid hidden ordering dependencies.
- Run API e2e checks with `pnpm nx run @servir/api-e2e:e2e`.
