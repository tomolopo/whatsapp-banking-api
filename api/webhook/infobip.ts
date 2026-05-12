import type { VercelRequest, VercelResponse } from "@vercel/node"
import { saveSession } from "../../lib/session/saveSession"
import { verifyInfobipBasicAuth } from "../../lib/utils/webhookAuth"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(req.method !== "POST"){
  return res.status(405).json({ success: false })
 }

 if(!verifyInfobipBasicAuth(req)){
  return res.status(401).json({ success: false })
 }

 try{
  const body = (req.body || {}) as { sessionId?: string; from?: string }
  const { sessionId, from } = body

  if(sessionId && from){
   await saveSession(from, sessionId)
  }

  return res.status(200).json({ success: true })

 }catch(err){
  console.error("Webhook error:", err)
  return res.status(500).json({ success: false })
 }
}
