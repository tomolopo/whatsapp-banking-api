# API endpoints

This project exposes several Vercel-style API routes. The main business router is `/api/whatsapp`.

## Common response envelope

Most JSON handlers use the shared response helpers from [lib/utils/response.ts](../lib/utils/response.ts):

```json
{
  "success": true,
  "requestId": "req_123",
  "data": {},
  "meta": null
}
```

Errors follow the same wrapper with `success: false` and an error object.

## WhatsApp router

### `/api/whatsapp`

Main banking router in [api/whatsapp/index.ts](../api/whatsapp/index.ts).
It accepts an `action` query parameter and a JSON body.

Supported actions in the live router:

- `initSession`
- `checkUser`
- `register`
- `createAccount`
- `balance`
- `resolveAccount`
- `confirmTransferDetails`
- `transfer`
- `transactions`
- `addBeneficiary`
- `favoriteBeneficiary`
- `getBeneficiaries`
- `getAccounts`
- `changePin`
- `statement`
- `receipt`
- `airtime`
- `data`
- `resetPin`

#### Request payloads by action

- `initSession` → `phone`
- `checkUser` → `phone`
- `register` → `token`, `phone`, `firstName`, `lastName`, `address`, `pin`
- `createAccount` → `phone`
- `balance` → `phone`, `accountNumber`
- `resolveAccount` → `accountNumber`
- `confirmTransferDetails` → `accountNumber`, `amount`
- `transfer` → `fromAccount`, `toAccount`, `amount`, `phone`, `pin`, optional signed `token`
- `transactions` → `accountNumber`
- `addBeneficiary` → `phone`, `accountNumber`, `bankCode`, `name`, `nickname`
- `favoriteBeneficiary` → `phone`, `accountNumber`
- `getBeneficiaries` → `phone`
- `getAccounts` → `phone`
- `changePin` → `phone`, `oldPin`, `newPin`
- `statement` → `phone`, `accountNumber`, `fromDate`, `toDate`
- `receipt` → `phone`, `transactionId`
- `airtime` → `phone`, `fromAccount`, `amount`, `network`
- `data` → `phone`, `fromAccount`, `amount`, `network`, `plan`, `duration`
- `resetPin` → `phone`, `otp`, `newPin`

#### Response shape

Success responses usually return the shared envelope with a `data` object. Representative payloads include:

- `initSession` → session summary with `balance` equal to the total across all accounts
- `register` → account and profile details
- `balance` → `accountNumber`, `accountType`, `balance` for the selected account only
- `resolveAccount` → destination account metadata
- `confirmTransferDetails` → confirmation text plus the transfer preview
- `transfer` → `transactionId`, `receiptUrl`, `receiptStatus`, `fraudScore`
- `transactions` → an array of transaction records
- `statement` → PDF URL and date range metadata
- `receipt` → PDF URL and transaction metadata
- `airtime` / `data` → purchase confirmation details
- `resetPin` → success message

## Admin route

### `/api/admin`

Admin read-only route in [api/admin/index.ts](../api/admin/index.ts).
Supported `resource` values:

- `customers`
- `accounts`
- `banks`
- `fraud`
- `transactions`

Query parameters:

- `resource` — required
- `search` — optional text filter used by `customers`
- `limit` — optional integer, 1 to 100
- `offset` — optional non-negative integer

The route returns direct JSON arrays keyed by resource name, for example:

```json
{
  "customers": []
}
```

## Webhook route

### `/api/webhook`

Webhook receiver in [api/webhook/index.ts](../api/webhook/index.ts).
Supported `action` values:

- `infobip`
- `events`
- `dispatch`

Webhook payloads are validated by the handler and normally return a compact JSON success response.

## Link generators

### `/api/generate-link`

Creates a registration link for a phone number. See [api/generate-link.ts](../api/generate-link.ts).
Typical response fields include `phone`, `token`, `registrationLink`, and `expiresIn`.

### `/api/generate-transfer-link`

Creates a signed transfer link. See [api/generate-transfer-link.ts](../api/generate-transfer-link.ts).
Typical response fields include `transferLink` and `expiresIn`.

## QR registration flow

### `/api/qr-register-page`

Serves the QR registration HTML form.

### `/api/qr-generate`

Accepts a completed QR registration, stores it in Supabase, and returns the generated QR payload.
Typical response fields include `profileUrl`, `qrDataUrl`, and the stored registration metadata.

### `/api/qr-profile-page`

Looks up the QR token and renders the public profile page.
The page displays First Name, Last Name, Job Title, MDA Sector, Registration Status, and Organization.

## Pages

### `/api/register-page`

Renders the registration page from [frontend/register.html](../frontend/register.html).
See [api/register-page.ts](../api/register-page.ts).

### `/api/transfer-page`

Renders the transfer confirmation page from [frontend/transfer.html](../frontend/transfer.html).
See [api/transfer-page.ts](../api/transfer-page.ts).

## Docs route

### `/api/docs`

Serves Swagger UI and the OpenAPI JSON.
Use `?format=json` for the JSON document.
See [api/docs/index.ts](../api/docs/index.ts).

## Notes

- The WhatsApp router is action-based, not REST-resource-based.
- `initSession.balance` is the summed balance across all of the user’s accounts.
- `/api/whatsapp?action=balance` remains account-specific and only returns one account’s balance.
- Validation errors are returned as structured `AppError` responses.
- Several actions depend on ownership checks against the `users` and `accounts` tables.
- Generated PDFs and transfer receipts are returned as URLs after upload.
- QR profile pages return a safe 404 response when the token is missing or unknown.
