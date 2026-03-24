export function logRequest(req:any){

 const safeBody = { ...(req.body || {}) }

 // 🔐 MASK SENSITIVE DATA
 if(safeBody.pin) safeBody.pin = "***"
 if(safeBody.otp) safeBody.otp = "***"

 console.log("📥 REQUEST:", {
  requestId: req.requestId,
  method: req.method,
  url: req.url,
  query: req.query,
  body: safeBody,
  headers: {
   "idempotency-key": req.headers?.["idempotency-key"] || null
  }
 })

}

export function logResponse(data:any){

 console.log("📤 RESPONSE:", data)

}