import { VercelRequest,VercelResponse } from "@vercel/node"

import { getBalance } from "../../lib/accounts/balance"
import { internalTransfer } from "../../lib/transfers/internal"
import { getTransactionHistory } from "../../lib/transactions/history"

export default async function handler(
 req:VercelRequest,
 res:VercelResponse
){

 const action = req.query.action

 try{

 if(action === "balance"){

  const { phone } = req.body

  return res.json(
   await getBalance(phone)
  )

 }

 if(action === "transfer"){

  const { fromAccount,toAccount,amount } = req.body

  return res.json(
   await internalTransfer(
    fromAccount,
    toAccount,
    amount
   )
  )

 }

 if(action === "history"){

  const { account } = req.body

  return res.json(
   await getTransactionHistory(account)
  )

 }

 res.status(400).json({
  error:"Invalid WhatsApp action"
 })

 }catch(err){

 const msg =
  err instanceof Error ? err.message : "Unknown error"

 res.status(500).json({error:msg})

 }

}