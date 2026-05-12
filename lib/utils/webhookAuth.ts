import type { VercelRequest } from "@vercel/node"
import { timingSafeEqual } from "crypto"

function safeEqual(a: string, b: string): boolean {
 const ab = Buffer.from(a)
 const bb = Buffer.from(b)
 if(ab.length !== bb.length) return false
 return timingSafeEqual(ab, bb)
}

export function verifyInfobipBasicAuth(req: VercelRequest): boolean {

 const expectedUser = process.env.INFOBIP_WEBHOOK_USER
 const expectedPass = process.env.INFOBIP_WEBHOOK_PASS

 if(!expectedUser || !expectedPass) return false

 const header = req.headers.authorization
 if(!header || !header.startsWith("Basic ")) return false

 const decoded = Buffer.from(header.slice(6), "base64").toString("utf8")
 const idx = decoded.indexOf(":")
 if(idx < 0) return false

 const user = decoded.slice(0, idx)
 const pass = decoded.slice(idx + 1)

 return safeEqual(user, expectedUser) && safeEqual(pass, expectedPass)
}
