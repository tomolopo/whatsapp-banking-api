# Configuration

The app relies on environment variables for database access, auth, storage, and external integrations.

## Core environment variables

### Database

- `DATABASE_URL`
- `DATABASE_CA_CERT`
- `DATABASE_SSL`

Used by [lib/db.ts](../lib/db.ts).

### JWT and tokens

- `JWT_SECRET`

Used by [lib/onboarding/token.ts](../lib/onboarding/token.ts) and [lib/adminAuth.ts](../lib/adminAuth.ts).

### Infobip / WhatsApp

- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_SENDER`
- `INFOBIP_SMS_SENDER`
- `INFOBIP_WEBHOOK_USER`
- `INFOBIP_WEBHOOK_PASS`

Used by [api/whatsapp/index.ts](../api/whatsapp/index.ts), [lib/otp.ts](../lib/otp.ts), and [lib/utils/webhookAuth.ts](../lib/utils/webhookAuth.ts).

### Public URLs

- `PUBLIC_BASE_URL`
- `NEXT_PUBLIC_API_URL`

Used for generated links and frontend API calls.

### Storage and cache

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_BUCKET`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Used by storage and Redis helpers.

### Behavior flags

- `DEFAULT_ACCOUNT_BALANCE`
- `ALLOWED_ORIGINS`

Used for account initialization and CORS.

## Recommended setup order

1. Database and JWT secrets
2. Infobip credentials
3. Storage credentials
4. Public base URL
5. Redis and optional behavior flags

## Where to look in code

- [lib/db.ts](../lib/db.ts)
- [lib/onboarding/token.ts](../lib/onboarding/token.ts)
- [lib/utils/webhookAuth.ts](../lib/utils/webhookAuth.ts)
- [api/generate-link.ts](../api/generate-link.ts)
- [api/generate-transfer-link.ts](../api/generate-transfer-link.ts)
- [api/whatsapp/index.ts](../api/whatsapp/index.ts)
