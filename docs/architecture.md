# Architecture

This codebase is organized around a thin API layer and a shared business-logic layer.

## High-level layers

### API layer

Located under [api/](../api/).

Responsibilities:

- accept HTTP requests
- validate coarse request shape
- call library functions
- return JSON or HTML responses
- handle request/response boundaries

### Domain and service layer

Located under [lib/](../lib/).

Responsibilities:

- account operations
- authentication and PIN logic
- transfer orchestration
- ledger writes
- fraud checks
- OTP and idempotency
- PDF generation
- storage uploads
- WhatsApp and webhook helpers

### Data layer

- PostgreSQL is accessed via [lib/db.ts](../lib/db.ts)
- Redis is available via [lib/redis.ts](../lib/redis.ts)
- Supabase storage is used via [lib/storage/upload.ts](../lib/storage/upload.ts)

## Key patterns

### Action router pattern

[api/whatsapp/index.ts](../api/whatsapp/index.ts) uses `action` as a dispatcher key instead of defining many separate endpoints.
That keeps the WhatsApp integration simple for chatbot flows.

### Token-based handoff

[lib/onboarding/token.ts](../lib/onboarding/token.ts) signs short-lived JWTs for registration and transfer flows.
This lets the HTML pages work as trusted confirmation steps without exposing raw state.

### Transaction safety

Transfer and purchase flows use database transactions and account locking to avoid partial updates.
Important examples:

- [lib/transfers/internal.ts](../lib/transfers/internal.ts)
- [lib/transfers/transfers.ts](../lib/transfers/transfers.ts)
- [lib/auth/registerUser.ts](../lib/auth/registerUser.ts)

### Best-effort side effects

Some actions are intentionally non-blocking:

- welcome WhatsApp messages after registration
- receipt creation after transfer
- event logging

This keeps core banking operations resilient even if a side channel fails.

## Main entry points

- [BankIB.md](../BankIB.md)
- [docs/how-it-works.md](how-it-works.md)
- [docs/whatsapp-integration.md](whatsapp-integration.md)
- [docs/configuration.md](configuration.md)
