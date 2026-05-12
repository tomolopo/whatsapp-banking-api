import type { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"
import { generateTransferToken } from "../lib/onboarding/token"
import { sendError } from "../lib/utils/response"
import { AppError } from "../lib/utils/errors"

export default function handler(req: VercelRequest, res: VercelResponse){

 const requestId = uuid()

 try{
  const phone = req.query.phone as string | undefined
  const fromAccount = req.query.fromAccount as string | undefined
  const toAccount = req.query.toAccount as string | undefined
  const amount = Number(req.query.amount)

  if(!phone || !fromAccount || !toAccount || !req.query.amount){
   throw new AppError("BAD_REQUEST", "missing parameters", 400)
  }
  if(!/^\d{10,15}$/.test(phone)){
   throw new AppError("BAD_REQUEST", "invalid phone", 400)
  }
  if(!/^\d{6,12}$/.test(fromAccount) || !/^\d{6,12}$/.test(toAccount)){
   throw new AppError("BAD_REQUEST", "invalid account number", 400)
  }
  if(!Number.isFinite(amount) || amount <= 0){
   throw new AppError("BAD_REQUEST", "invalid amount", 400)
  }

  const token = generateTransferToken({ phone, fromAccount, toAccount, amount })

  const base =
   process.env.PUBLIC_BASE_URL ||
   "https://whatsapp-banking-api.vercel.app"

  const link = `${base}/api/transfer-page?token=${encodeURIComponent(token)}`

  return res.json({
   success: true,
   requestId,
   data: { transferLink: link, expiresIn: "10 minutes" }
  })

 }catch(err){
  return sendError(res, requestId, err)
 }
}
