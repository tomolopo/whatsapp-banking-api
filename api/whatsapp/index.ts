import { VercelRequest, VercelResponse } from "@vercel/node"

import { checkUser } from "../../lib/auth/checkUser"
import { registerUser } from "../../lib/auth/registerUser"
import { createAccount } from "../../lib/accounts/createAccount"
import { getBalance } from "../../lib/accounts/balance"
import { internalTransfer } from "../../lib/transfers/internal"
import { getTransactionHistory } from "../../lib/transactions/history"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 res.setHeader("Access-Control-Allow-Origin","*")
 res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS")
 res.setHeader("Access-Control-Allow-Headers","Content-Type")

 if(req.method === "OPTIONS"){
  return res.status(200).end()
 }

 try{

  const action = req.query.action as string

  if(!action){
   return res.status(400).json({
    error:"action parameter required"
   })
  }

  const body = req.body || {}

  // CHECK USER
  if(action === "checkUser"){

   const result = await checkUser(body.phone)

   return res.json(result)

  }

  // REGISTER USER
  if(action === "register"){

   const result = await registerUser(
    body.phone,
    body.firstName,
    body.lastName,
    body.address,
    body.pin
   )

   return res.json(result)

  }

  // CREATE ACCOUNT
  if(action === "createAccount"){

   const result = await createAccount(body.phone)

   return res.json(result)

  }

  // BALANCE
  if(action === "balance"){

   const result = await getBalance(body.phone)

   return res.json(result)

  }

  // TRANSFER
  if(action === "transfer"){

   const result = await internalTransfer(
    body.fromAccount,
    body.toAccount,
    body.amount
    )

   return res.json(result)

  }

  // TRANSACTION HISTORY
  if(action === "transactions"){

   const result = await getTransactionHistory(body.phone)

   return res.json(result)

  }

  return res.status(404).json({
   error:"Unknown action"
  })

 }catch(err){

  console.error(err)

  return res.status(500).json({
   error:"internal server error"
  })

 }

}