# BankIB

Central documentation hub for the WhatsApp banking API in this repository.

If you only read one page, start here.

## Quick links

- [How it works](docs/how-it-works.md)
- [API endpoints](docs/api-endpoints.md)
- [Architecture](docs/architecture.md)
- [WhatsApp integration](docs/whatsapp-integration.md)
- [Configuration](docs/configuration.md)

## Main source map

- [WhatsApp router](api/whatsapp/index.ts)
- [Webhook handler](api/webhook/index.ts)
- [Admin handler](api/admin/index.ts)
- [Registration link generator](api/generate-link.ts)
- [Registration page renderer](api/register-page.ts)
- [Transfer link generator](api/generate-transfer-link.ts)
- [Transfer page renderer](api/transfer-page.ts)
- [Swagger docs page](api/docs/index.ts)

## What this project does

BankIB is a serverless banking demo that uses WhatsApp as the main customer channel.
It supports:

- onboarding and account creation
- balance and transaction lookup
- internal and interbank transfers
- beneficiaries and favorites
- statement and receipt generation
- airtime and data purchases
- PIN reset and authentication flows
- admin and webhook event handling

## Core request flow

1. A user starts from a generated link or a WhatsApp action.
2. The router in [api/whatsapp/index.ts](api/whatsapp/index.ts) dispatches the request by `action`.
3. Domain logic lives in `lib/` modules.
4. Data is stored in PostgreSQL through [lib/db.ts](lib/db.ts).
5. Side effects such as PDFs, uploads, OTPs, and WhatsApp messages are handled by dedicated helpers.

## Important implementation files

- [lib/auth/registerUser.ts](lib/auth/registerUser.ts)
- [lib/transfers/transfers.ts](lib/transfers/transfers.ts)
- [lib/transfers/internal.ts](lib/transfers/internal.ts)
- [lib/transfers/interbank.ts](lib/transfers/interbank.ts)
- [lib/pdf/statement.ts](lib/pdf/statement.ts)
- [lib/pdf/receipt.ts](lib/pdf/receipt.ts)
- [lib/ledger/ledger.ts](lib/ledger/ledger.ts)
- [lib/fraud.ts](lib/fraud.ts)
- [lib/idempotency.ts](lib/idempotency.ts)
- [lib/otp.ts](lib/otp.ts)
- [lib/onboarding/token.ts](lib/onboarding/token.ts)

## Related docs

- Next: [How it works](docs/how-it-works.md)
- See also: [Architecture](docs/architecture.md) and [API endpoints](docs/api-endpoints.md)
