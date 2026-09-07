# WhatsApp integration

This project integrates with Infobip for WhatsApp messaging and webhook callbacks.

## Outbound messages

[api/whatsapp/index.ts](../api/whatsapp/index.ts) contains a helper named `sendWhatsAppText`.
It uses these environment variables:

- `INFOBIP_BASE_URL`
- `INFOBIP_API_KEY`
- `INFOBIP_SENDER`

The helper posts to Infobip's WhatsApp text endpoint and is used for the post-registration welcome message.

## Webhooks

[api/webhook/index.ts](../api/webhook/index.ts) accepts authenticated webhook calls.
It supports three modes:

- `action=infobip` for raw Infobip payloads
- `action=events` for structured events with `type` and `data`
- `action=dispatch` for grouped dispatch events

Authentication is handled by [lib/utils/webhookAuth.ts](../lib/utils/webhookAuth.ts).

## Session and conversation flow

The WhatsApp flow is designed to work alongside the user session state returned by:

- [lib/session/initSession.ts](../lib/session/initSession.ts)
- [lib/session/saveSession.ts](../lib/session/saveSession.ts)

These helpers keep track of the user state that the chatbot can use between turns.

## Practical flow examples

### Registration

1. User gets a tokenized registration link.
2. User submits details on the HTML page.
3. [lib/auth/registerUser.ts](../lib/auth/registerUser.ts) writes the user and account.
4. A welcome WhatsApp message is sent if Infobip config is present.

### Transfer confirmation

1. A transfer link is generated.
2. The confirmation page validates the signed token.
3. The WhatsApp router or HTML flow submits the transfer.
4. [lib/transfers/transfers.ts](../lib/transfers/transfers.ts) executes the operation.

## Related files

- [api/whatsapp/index.ts](../api/whatsapp/index.ts)
- [api/webhook/index.ts](../api/webhook/index.ts)
- [lib/otp.ts](../lib/otp.ts)
- [lib/onboarding/token.ts](../lib/onboarding/token.ts)
- [lib/utils/webhookAuth.ts](../lib/utils/webhookAuth.ts)
