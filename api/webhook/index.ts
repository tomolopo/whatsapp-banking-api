import type { VercelRequest, VercelResponse } from "@vercel/node"
import { logEvent } from "../../lib/events"
import { verifyInfobipBasicAuth } from "../../lib/utils/webhookAuth"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(req.method !== "POST"){
  return res.status(405).json({ error: "Method not allowed" })
 }

 if(!verifyInfobipBasicAuth(req)){
  return res.status(401).json({ error: "Unauthorized" })
 }

 const action = req.query.action

 try{
  if(action === "infobip"){
   await logEvent("infobip.webhook", req.body)
   return res.json({ success: true })
  }

  if(action === "events"){
   const { type, data } = (req.body || {}) as { type?: string; data?: unknown }
   if(!type){
    return res.status(400).json({ error: "type required" })
   }
   await logEvent(type, data)
   return res.json({ success: true })
  }

  if(action === "dispatch"){
   const { event, data } = (req.body || {}) as { event?: string; data?: unknown }
   if(!event){
    return res.status(400).json({ error: "event required" })
   }
   await logEvent(`dispatch.${event}`, data)
   return res.json({ success: true })
  }

  return res.status(400).json({ error: "Invalid webhook action" })

 }catch(err){
  console.error("Webhook handler error:", err)
  return res.status(500).json({ error: "Internal server error" })
 }
}
