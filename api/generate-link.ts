import { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"
import { generateToken } from "../lib/onboarding/token"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const requestId = uuid()

 try{

  const { phone } = req.query

  if(!phone){
   return res.status(400).json({
    success: false,
    error: "phone required",
    requestId
   })
  }

  // basic validation
  if(!(phone as string).startsWith("234")){
   return res.status(400).json({
    success: false,
    error: "invalid phone format",
    requestId
   })
  }

  const token = generateToken(phone as string)

  const link = `https://whatsapp-banking-api.vercel.app/api/register-page?token=${token}`

  return res.status(200).json({
   success: true,
   requestId,
   data: {
    phone,
    token,
    registrationLink: link,
    expiresIn: "10 minutes"
   }
  })

 }catch(err:any){

  return res.status(500).json({
   success: false,
   error: err.message,
   requestId
  })

 }

}