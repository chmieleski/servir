# Clerk Settings Checklist

## Scope

This checklist covers Clerk settings required by the current API foundation in this repository.

Related implementation:

- `libs/server/core-auth/src/lib/clerk-auth.guard.ts`
- `libs/server/core-auth/src/lib/clerk-auth.service.ts`
- `libs/server/feature-access/src/lib/*.ts`

## 1. API Keys

Create or use your Clerk instance and configure:

- `CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

Map them into API environment files:

- `apps/api/.env`
- `apps/api/.env.test`
- `apps/api/.env.example`

Security notes:

- Do not commit real keys.
- Use development keys for local/dev and production keys for production.
- Rotate keys if exposed.

## 2. Organizations

Ensure Organizations are enabled in your Clerk instance.

This API uses only built-in org roles:

- `org:admin`
- `org:member`

No custom organization roles are required in this phase.

## 3. Platform Admin Metadata

Platform admin authorization is based on Clerk user private metadata:

- `privateMetadata.platformRole === "platform_admin"`

To grant platform admin:

1. Open the user in Clerk Dashboard.
2. Edit private metadata JSON.
3. Set:

```json
{
  "platformRole": "platform_admin"
}
```

To revoke platform admin, remove `platformRole` or set a different value.

## 4. Authorized Parties

Set `CLERK_AUTHORIZED_PARTIES` as a comma-separated list of trusted frontend origins.

Local example:

```bash
CLERK_AUTHORIZED_PARTIES=http://localhost:3000,http://localhost:3001
```

This is used by `authenticateRequest` to reduce token misuse across unexpected origins.

## 5. Session and Request Expectations

Protected endpoints require one of:

- `Authorization: Bearer <token>`
- Clerk session cookie (`__session=...`)

Organization-aware authorization expects Clerk auth context to carry active organization claims when applicable (`org_id`, `org_role`).

## 6. E2E Test Mode (Local/CI only)

For integration tests without live Clerk dependencies:

- `AUTH_E2E_TEST_MODE=true`
- `AUTH_E2E_TEST_SECRET=<shared test secret>`

When enabled, tests can send signed `x-servir-test-auth` headers and the API uses deterministic in-memory Clerk behavior.

Keep disabled outside tests:

- `AUTH_E2E_TEST_MODE=false` in production and regular development.

## 7. Quick Verification

After configuration:

1. Call `GET /api/v1/auth/me` with a valid user token -> `200`.
2. Call `GET /api/v1/platform/users` as non-platform user -> `403`.
3. Set `platformRole: "platform_admin"` on a user, call again -> `200`.
4. Submit and approve an org request to confirm org provisioning path.

## 8. Billing Webhook Setup

For billing projection sync:

1. In Clerk Dashboard, configure billing webhook destination:
- `<api-base>/api/v1/internal/webhooks/clerk`
2. Set signing secret in API config:
- `CLERK_WEBHOOK_SIGNING_SECRET`
3. Ensure runtime billing controls are set:
- `BILLING_ENFORCEMENT_ENABLED`
- `BILLING_ALLOWED_PATHS`
- `BILLING_ACTIVE_STATUSES`
- `BILLING_INACTIVE_GRACE_DAYS`

Reference docs:

- `docs/api/billing-architecture.md`
- `docs/api/billing-webhooks.md`
- `docs/api/billing-operations.md`
