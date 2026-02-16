# Billing Webhooks

## Endpoint

- `POST /api/v1/internal/webhooks/clerk`
- Route is `@Public()` and `@BillingExempt()`, but signature verification is mandatory.

## Processing Sequence

```mermaid
sequenceDiagram
  participant C as Clerk
  participant A as API Webhook Controller
  participant S as BillingService
  participant DB as Postgres

  C->>A: Signed webhook request
  A->>S: handleClerkWebhook(request)
  S->>S: verify signature
  alt invalid signature
    S-->>A: 401 WEBHOOK_SIGNATURE_INVALID
  else valid signature
    S->>DB: check existing provider+eventId
    alt duplicate
      S-->>A: 200 duplicate
    else first seen
      S->>S: infer org + status + plan fields
      alt unsupported payload
        S->>DB: insert BillingWebhookEvent status=ignored
        S-->>A: 200 ignored
      else supported
        S->>DB: upsert OrganizationBilling + insert BillingWebhookEvent processed
        alt db failure
          S->>DB: insert BillingWebhookEvent failed
          S-->>A: 500 (retry)
        else success
          S-->>A: 200 processed
        end
      end
    end
  end
```

## Event State

```mermaid
stateDiagram-v2
  [*] --> processed
  [*] --> ignored
  [*] --> failed
```

## Operational Notes

1. Idempotency key: `provider + eventId`.
2. `eventId` source: `svix-id` header.
3. Keep webhook responses fast; no external side effects in the critical path.
4. Fail closed on signature verification.

