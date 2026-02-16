# Billing Operations

## Clerk Dashboard Setup

1. Enable Clerk Billing for organization plans.
2. Create plans and features for org payer type.
3. Add webhook destination:
- URL: `<api-base>/api/v1/internal/webhooks/clerk`
4. Copy webhook signing secret into:
- `CLERK_WEBHOOK_SIGNING_SECRET`

## Runtime Config

Required environment variables:

- `CLERK_WEBHOOK_SIGNING_SECRET`
- `BILLING_ENFORCEMENT_ENABLED`
- `BILLING_ALLOWED_PATHS`
- `BILLING_ACTIVE_STATUSES`
- `BILLING_INACTIVE_GRACE_DAYS`

## Monitoring

Track:

1. Count of `BillingWebhookEvent.status = failed`.
2. Count of duplicate events.
3. Billing guard block rates by error code.
4. Projection staleness (`OrganizationBilling.updatedAt`).

## Failure Recovery

1. If webhook failures spike, validate secret and endpoint reachability.
2. Re-deliver failed events from Clerk dashboard.
3. Confirm event idempotency prevents duplicate side effects.
4. Validate projection values with `GET /api/v1/platform/billing/subscriptions`.

## Rollout

1. Deploy with `BILLING_ENFORCEMENT_ENABLED=false`.
2. Validate webhook processing in staging.
3. Backfill projections if needed.
4. Enable enforcement in staging then production.

