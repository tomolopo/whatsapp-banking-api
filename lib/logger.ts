const SENSITIVE_KEYS = new Set([
 "pin",
 "oldpin",
 "newpin",
 "otp",
 "password",
 "pwd",
 "secret",
 "token",
 "authorization",
 "cookie",
 "x-admin-key",
 "pin_hash"
])

function redact(obj: unknown): unknown {
 if(!obj || typeof obj !== "object") return obj
 if(Array.isArray(obj)) return obj.map(redact)
 const out: Record<string, unknown> = {}
 for(const [k, v] of Object.entries(obj as Record<string, unknown>)){
  out[k] = SENSITIVE_KEYS.has(k.toLowerCase()) ? "***" : redact(v)
 }
 return out
}

interface RequestLog {
 requestId?: string
 method?: string
 url?: string
 query?: unknown
 body?: unknown
 headers?: Record<string, unknown>
}

export function logRequest(req: RequestLog){
 const headers = req?.headers || {}
 const idempotencyKey =
  headers["idempotency-key"] ||
  headers["Idempotency-Key"] ||
  null

 console.log("REQUEST:", {
  requestId: req?.requestId || null,
  method: req?.method || null,
  url: req?.url || null,
  query: redact(req?.query || {}),
  body: redact(req?.body || {}),
  idempotencyKey
 })
}

export function logResponse(data: unknown){
 console.log("RESPONSE:", redact(data))
}
