import { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"

export default function handler(req: VercelRequest, res: VercelResponse){

 const requestId = uuid()

 try{

  const { phone, fromAccount, toAccount, amount } = req.query

  if(!phone || !fromAccount || !toAccount || !amount){
   return res.status(400).json({
    success:false,
    error:"missing parameters",
    requestId
   })
  }

  // encode payload securely
  const payload = JSON.stringify({
   phone,
   fromAccount,
   toAccount,
   amount,
   ts: Date.now()
  })

  const token = Buffer.from(payload).toString("base64")

  const link = `https://whatsapp-banking-api.vercel.app/api/transfer-page?token=${token}`

  return res.json({
   success:true,
   requestId,
   data:{
    transferLink: link
   }
  })

 }catch(err:any){
  return res.status(500).json({
   success:false,
   error:err.message,
   requestId
  })
 }

}