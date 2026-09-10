import { VercelRequest, VercelResponse } from "@vercel/node"

const openapi = {
 openapi: "3.0.0",
 info: {
  title: "WhatsApp Banking API",
  version: "1.0.0",
  description: "API used by Infobip Answers chatbot"
 },
 servers: [
  {
   url: "https://whatsapp-banking-api.vercel.app"
  }
 ],
 paths: {
  "/api/whatsapp": {
   post: {
    summary: "WhatsApp Banking Router",
    description: "Action-based router used by the WhatsApp banking flow. initSession returns the total balance across all user accounts.",
    parameters: [
     {
      name: "action",
      in: "query",
      required: true,
      schema: {
       type: "string",
       enum: [
        "initSession",
        "checkUser",
        "register",
        "createAccount",
        "balance",
        "resolveAccount",
        "confirmTransferDetails",
        "transfer",
        "transactions",
        "addBeneficiary",
        "favoriteBeneficiary",
        "getBeneficiaries",
        "getAccounts",
        "changePin",
        "statement",
        "receipt",
        "airtime",
        "data",
        "resetPin"
       ]
      }
     }
    ],
    requestBody: {
     required: false,
     content: {
      "application/json": {
       schema: {
        type: "object",
        description: "Payload depends on the action query parameter.",
        properties: {
         phone: { type: "string", example: "2348012345678" },
         token: { type: "string", example: "signed-token" },
         firstName: { type: "string", example: "John" },
         lastName: { type: "string", example: "Doe" },
         address: { type: "string", example: "Lagos" },
         pin: { type: "string", example: "1234" },
         accountNumber: { type: "string", example: "0123456789" },
         fromAccount: { type: "string", example: "0123456789" },
         toAccount: { type: "string", example: "0987654321" },
         amount: { type: "number", example: 5000 },
         otp: { type: "string", example: "123456" },
         bankCode: { type: "string", example: "044" },
         name: { type: "string", example: "Jane Doe" },
         nickname: { type: "string", example: "Jane" },
         oldPin: { type: "string", example: "1234" },
         newPin: { type: "string", example: "5678" },
         network: { type: "string", example: "MTN" },
         plan: { type: "string", example: "2GB" },
         duration: { type: "string", example: "30d" },
         transactionId: { type: "string", example: "tx_001" }
        }
       }
      }
     }
    },
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "401": { description: "Unauthorized" },
     "402": { description: "Insufficient funds" },
     "403": { description: "Forbidden" },
     "404": { description: "Not found" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/admin": {
   get: {
    summary: "Admin API",
    description: "Read-only admin resource endpoint.",
    parameters: [
     {
      name: "resource",
      in: "query",
      required: true,
      schema: {
       type: "string",
       enum: ["customers", "accounts", "banks", "fraud", "transactions"]
      }
     },
     {
      name: "search",
      in: "query",
      schema: { type: "string" }
     },
     {
      name: "limit",
      in: "query",
      schema: { type: "integer", minimum: 1, maximum: 100, default: 10 }
     },
     {
      name: "offset",
      in: "query",
      schema: { type: "integer", minimum: 0, default: 0 }
     }
    ],
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "401": { description: "Unauthorized" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/webhook": {
   post: {
    summary: "Webhook Handler",
    description: "Receives Infobip webhook traffic and internal dispatch events.",
    parameters: [
     {
      name: "action",
      in: "query",
      schema: {
       type: "string",
       enum: ["infobip", "events", "dispatch"]
      }
     }
    ],
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/generate-link": {
   get: {
    summary: "Generate registration link",
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/register-page": {
   get: {
    summary: "Registration page",
    responses: {
     "200": { description: "HTML page" }
    }
   }
  },
  "/api/generate-transfer-link": {
   get: {
    summary: "Generate transfer link",
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/transfer-page": {
   get: {
    summary: "Transfer confirmation page",
    responses: {
     "200": { description: "HTML page" }
    }
   }
  },
  "/api/qr-register-page": {
   get: {
    summary: "QR registration page",
    responses: {
     "200": { description: "HTML page" }
    }
   }
  },
  "/api/qr-generate": {
   post: {
    summary: "Generate QR registration",
    responses: {
     "200": { description: "Successful response" },
     "400": { description: "Invalid request" },
     "405": { description: "Method not allowed" },
     "500": { description: "Server error" }
    }
   }
  },
  "/api/qr-profile-page": {
   get: {
    summary: "QR profile page",
    responses: {
     "200": { description: "HTML page" },
     "404": { description: "Profile unavailable" }
    }
   }
  },
  "/api/docs": {
   get: {
    summary: "Swagger UI and OpenAPI JSON",
    parameters: [
     {
      name: "format",
      in: "query",
      schema: { type: "string", enum: ["json"] }
     }
    ],
    responses: {
     "200": { description: "Swagger UI or OpenAPI JSON" }
    }
   }
  }
 }
} as const

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){
 const format = req.query.format

 if(format === "json"){
  return res.json(openapi)
 }

 res.setHeader("Content-Type", "text/html; charset=utf-8")

 return res.send(`
<!DOCTYPE html>
<html>
<head>
<link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist/swagger-ui.css"/>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist/swagger-ui-bundle.js"></script>
<script>
SwaggerUIBundle({
 url:"/api/docs?format=json",
 dom_id:"#swagger-ui"
})
</script>
</body>
</html>
 `)
}
