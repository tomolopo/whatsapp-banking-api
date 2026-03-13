import { VercelRequest, VercelResponse } from "@vercel/node"
import { logEvent } from "../../lib/events"

/*
Webhook Router

Handles:
- Infobip webhooks
- internal event dispatch
- system events
*/

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const action = req.query.action

 try{

/*
-----------------------------------
INFOBIP WEBHOOK
-----------------------------------
*/

 if(action === "infobip"){

  const payload = req.body

  await logEvent("infobip.webhook.received",payload)

  if(payload?.results){

   for(const result of payload.results){

    await logEvent("infobip.message.status",{
     messageId:result.messageId,
     status:result.status?.name,
     to:result.to
    })

   }

  }

  return res.json({
   success:true
  })

 }

/*
-----------------------------------
EVENTS LOGGER
-----------------------------------
*/

 if(action === "events"){

  const { type,data } = req.body

  await logEvent(type,data)

  return res.json({
   success:true
  })

 }

/*
-----------------------------------
DISPATCH EVENT
-----------------------------------
*/

 if(action === "dispatch"){

  const { event,data } = req.body

  await logEvent(`dispatch.${event}`,data)

  return res.json({
   success:true
  })

 }

 /*
-----------------------------------
DEFAULT RESPONSE
-----------------------------------
*/

 return res.status(400).json({
  error:"Invalid webhook action"
 })

 }catch(err){

  const msg =
   err instanceof Error ? err.message : "Unknown error"

  return res.status(500).json({
   error:msg
  })

 }

}