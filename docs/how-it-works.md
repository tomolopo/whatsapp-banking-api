# How it works

This project is a WhatsApp-first banking demo built as a set of Vercel API routes and shared `lib/` modules.

## User journey

### 1. Start with onboarding

- [api/generate-link.ts](../api/generate-link.ts) creates a registration link for a phone number.
- [api/register-page.ts](../api/register-page.ts) serves the HTML registration page.
- [lib/onboarding/token.ts](../lib/onboarding/token.ts) signs and validates short-lived registration tokens.
- [lib/auth/registerUser.ts](../lib/auth/registerUser.ts) creates the user and the first account.

### 2. Continue in WhatsApp

- [api/whatsapp/index.ts](../api/whatsapp/index.ts) receives all banking actions through the `action` query parameter.
- The handler routes requests to account, transfer, statement, beneficiary, airtime, data, and PIN-related functions.
- After registration, the handler can send a welcome WhatsApp message through Infobip.

### 3. QR registration flow

- [api/qr-generate.ts](../api/qr-generate.ts) stores the submitted registration in Supabase and creates a unique QR code.
- [lib/qr/registrations.ts](../lib/qr/registrations.ts) handles token generation, inserts, and QR profile lookups.
- [api/qr-profile-page.ts](../api/qr-profile-page.ts) renders the public profile page when the QR is scanned.
- The public profile shows First Name, Last Name, Job Title, MDA Sector, Registration Status, and Organization.

### 4. Perform banking actions

Common actions include:

- checking whether a user exists
- initializing a session
- reading balances and accounts
- listing transaction history
- resolving destination accounts
- confirming transfer details
- sending money internally or interbank
- generating statement and receipt PDFs
- adding and favoriting beneficiaries
- buying airtime or data
- resetting or changing PINs

### 4. Return results

- Responses are normalized with [lib/utils/response.ts](../lib/utils/response.ts).
- Errors are mapped through [lib/utils/errors.ts](../lib/utils/errors.ts).
- Audit-like logs are written by [lib/logger.ts](../lib/logger.ts).
- Additional event data is stored with [lib/events.ts](../lib/events.ts).

## Transfer flow

Transfers are the most structured flow in the app:

1. A transfer link may be generated with [api/generate-transfer-link.ts](../api/generate-transfer-link.ts).
2. The user opens [api/transfer-page.ts](../api/transfer-page.ts) and confirms the operation.
3. The signed token from [lib/onboarding/token.ts](../lib/onboarding/token.ts) becomes the source of truth.
4. [lib/transfers/transfers.ts](../lib/transfers/transfers.ts) decides whether the transfer is internal or interbank.
5. [lib/transfers/internal.ts](../lib/transfers/internal.ts) handles same-bank movement.
6. [lib/transfers/interbank.ts](../lib/transfers/interbank.ts) simulates the external network path.

## Statement and receipt flow

- Statement generation uses [lib/pdf/statement.ts](../lib/pdf/statement.ts).
- Receipt generation uses [lib/pdf/receipt.ts](../lib/pdf/receipt.ts).
- Files are uploaded by [lib/storage/upload.ts](../lib/storage/upload.ts).
- Temporary files are removed after upload.

## Security and validation

Important validation helpers include:

- [lib/auth/validatePin.ts](../lib/auth/validatePin.ts) for PIN checks and lockout
- [lib/otp.ts](../lib/otp.ts) for OTP flows
- [lib/idempotency.ts](../lib/idempotency.ts) for duplicate request protection
- [lib/fraud.ts](../lib/fraud.ts) for risk checks
- [lib/utils/webhookAuth.ts](../lib/utils/webhookAuth.ts) for webhook authentication

## Data layer

- PostgreSQL access goes through [lib/db.ts](../lib/db.ts).
- Account creation and balance handling live in [lib/accounts/](../lib/accounts/).
- Ledger writes live in [lib/ledger/](../lib/ledger/).
- Session data is stored with [lib/session/](../lib/session/).
- Redis is available for fast ephemeral state via [lib/redis.ts](../lib/redis.ts).

## Documentation entry points

- [BankIB.md](../BankIB.md)
- [API endpoints](api-endpoints.md)
- [Architecture](architecture.md)
- [WhatsApp integration](whatsapp-integration.md)
- [Configuration](configuration.md)
