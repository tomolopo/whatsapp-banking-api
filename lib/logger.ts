// lib/logger.ts

export function logRequest(req: any){

 // 🛡️ SAFE FALLBACKS (VERY IMPORTANT)
 const headers = req?.headers || {}
 const body = req?.body || {}
 const query = req?.query || {}

 // 🔐 MASK SENSITIVE DATA
 const safeBody = { ...body }

 if(safeBody.pin) safeBody.pin = "***"
 if(safeBody.otp) safeBody.otp = "***"

 // 🔑 SAFE HEADER ACCESS (NO CRASH)
 const idempotencyKey =
  headers?.["idempotency-key"] ||
  headers?.["Idempotency-Key"] ||
  null

 console.log("📥 REQUEST:", {
  requestId: req?.requestId || null,
  method: req?.method || null,
  url: req?.url || null,
  query,
  body: safeBody,
  idempotencyKey
 })

}

export function logResponse(data: any){

 console.log("📤 RESPONSE:", data)

}