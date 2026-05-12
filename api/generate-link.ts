import type { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"
import { generateToken } from "../lib/onboarding/token"
import { sendError } from "../lib/utils/response"
import { AppError } from "../lib/utils/errors"

export default function handler(req: VercelRequest, res: VercelResponse){

 const requestId = uuid()

 try{
  const phone = req.query.phone as string | undefined

  if(!phone){
   throw new AppError("BAD_REQUEST", "phone required", 400)
  }
  if(!/^234\d{9,10}$/.test(phone)){
   throw new AppError("BAD_REQUEST", "invalid phone format", 400)
  }

  const token = generateToken(phone)
  const base =
   process.env.PUBLIC_BASE_URL ||
   "https://whatsapp-banking-api.vercel.app"
  const link = `${base}/api/register-page?token=${encodeURIComponent(token)}`

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
 }catch(err){
  return sendError(res, requestId, err)
 }
}
