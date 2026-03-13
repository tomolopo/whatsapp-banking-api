import { VercelRequest,VercelResponse } from "@vercel/node"
import { logEvent } from "../../lib/events"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const action = req.query.action

 try{

 if(action === "infobip"){

  const payload = req.body

  await logEvent("infobip.webhook",payload)

  return res.json({success:true})

 }

 if(action === "events"){

  const { type,data } = req.body

  await logEvent(type,data)

  return res.json({success:true})

 }

 if(action === "dispatch"){

  const { event,data } = req.body

  await logEvent(`dispatch.${event}`,data)

  return res.json({success:true})

 }

 res.status(400).json({
  error:"Invalid webhook action"
 })

 }catch(err){

 const msg =
  err instanceof Error ? err.message : "Unknown error"

 res.status(500).json({error:msg})

 }

}