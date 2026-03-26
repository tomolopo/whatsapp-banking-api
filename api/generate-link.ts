import { VercelRequest, VercelResponse } from "@vercel/node"
import { generateToken } from "../lib/onboarding/token"

export default function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const { phone } = req.query

 if(!phone){
  return res.status(400).json({
   error: "phone required"
  })
 }

 const token = generateToken(phone as string)

 const link = `https://whatsapp-banking-api.vercel.app/api/register-page?token=${token}`

 return res.json({
  link
 })

}