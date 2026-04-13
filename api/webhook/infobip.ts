import { VercelRequest, VercelResponse } from "@vercel/node"
import { saveSession } from "../../lib/session/saveSession"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const body = req.body

  /*
   Example Infobip payload:
  */
  const sessionId = body.sessionId
  const phone = body.from

  if(sessionId && phone){
   await saveSession(phone, sessionId)
  }

  return res.status(200).json({
   success: true
  })

 }catch(err:any){

  console.error("Webhook error:", err)

  return res.status(500).json({
   success: false
  })

 }

}