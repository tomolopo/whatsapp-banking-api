import type { VercelRequest, VercelResponse } from "@vercel/node"

export function applyCors(
 req: VercelRequest,
 res: VercelResponse,
 methods: string[]
): boolean {

 const allowed = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean)

 const origin = req.headers.origin as string | undefined

 if(origin && allowed.includes(origin)){
  res.setHeader("Access-Control-Allow-Origin", origin)
  res.setHeader("Vary", "Origin")
 }

 res.setHeader("Access-Control-Allow-Methods", methods.join(","))
 res.setHeader(
  "Access-Control-Allow-Headers",
  "Content-Type, Authorization, idempotency-key, x-request-id"
 )

 if(req.method === "OPTIONS"){
  res.status(204).end()
  return true
 }

 return false
}
