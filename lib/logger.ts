export function logRequest(req:any){

 const safeBody = { ...req.body }

 // 🔐 MASK SENSITIVE DATA
 if(safeBody.pin) safeBody.pin = "***"
 if(safeBody.otp) safeBody.otp = "***"

 console.log("📥 REQUEST:", {
  method: req.method,
  url: req.url,
  query: req.query,
  body: safeBody,
  headers: {
   "idempotency-key": req.headers["idempotency-key"]
  }
 })

}

export function logResponse(data:any){

 const safeData = { ...data }

 console.log("📤 RESPONSE:", safeData)

}