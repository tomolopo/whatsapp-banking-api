import { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"

import { checkUser } from "../../lib/auth/checkUser"
import { registerUser } from "../../lib/auth/registerUser"
import { createAccount } from "../../lib/accounts/createAccount"
import { getBalance } from "../../lib/accounts/balance"
import { getTransactionHistory } from "../../lib/transactions/history"
import { initSession } from "../../lib/session/initSession"

import { executeTransfer } from "../../lib/transfers/transfers"
import { initiateTransfer, confirmTransfer } from "../../lib/transfers/transferWithOTP"

import { logRequest, logResponse } from "../../lib/logger"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 // 🌍 CORS
 res.setHeader("Access-Control-Allow-Origin","*")
 res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS")
 res.setHeader("Access-Control-Allow-Headers","Content-Type, idempotency-key")

 if(req.method === "OPTIONS"){
  return res.status(200).end()
 }

 // 🔗 CORRELATION ID (VERY IMPORTANT)
 const requestId = (req.headers["x-request-id"] as string) || uuid()

 try{

  // 📥 LOG REQUEST
  logRequest({
   ...req,
   requestId
  })

  const action = req.query.action as string

  if(!action){
   return res.status(400).json({
    success:false,
    error:"action parameter required",
    requestId
   })
  }

  // ✅ HANDLE GET + POST
  const body = req.method === "GET"
   ? req.query
   : req.body || {}

  let response:any

  // 🧠 INIT SESSION
  if(action === "initSession"){
   response = await initSession(body.phone)
  }

  // 👤 CHECK USER
  else if(action === "checkUser"){
   response = await checkUser(body.phone)
  }

  // 📝 REGISTER
  else if(action === "register"){
   response = await registerUser(
    body.phone,
    body.firstName,
    body.lastName,
    body.address,
    body.pin
   )
  }

  // 🏦 CREATE ACCOUNT
  else if(action === "createAccount"){
   response = await createAccount(body.phone)
  }

  // 💰 BALANCE
  else if(action === "balance"){
   response = await getBalance(body.phone)
  }

  // 🚀 DIRECT TRANSFER (NO OTP)
  else if(action === "transfer"){
   const { fromAccount, toAccount, amount, phone, pin } = body

   const idempotencyKey = req.headers["idempotency-key"] as string

   response = await executeTransfer(
    fromAccount,
    toAccount,
    Number(amount),
    phone,
    pin,
    idempotencyKey
   )
  }

  // 🔐 INITIATE TRANSFER (WITH OTP)
  else if(action === "initiateTransfer"){
   response = await initiateTransfer(body)
  }

  // ✅ CONFIRM TRANSFER (OTP + EXECUTE)
  else if(action === "confirmTransfer"){
   response = await confirmTransfer(body)
  }

  // 📜 TRANSACTIONS
  else if(action === "transactions"){
   response = await getTransactionHistory(body.phone)
  }

  // ❌ UNKNOWN ACTION
  else{
   return res.status(404).json({
    success:false,
    error:"Unknown action",
    requestId
   })
  }

  // 📤 LOG RESPONSE
  logResponse({
   requestId,
   action,
   response
  })

  return res.status(200).json({
   success:true,
   requestId,
   data: response
  })

 }catch(err:any){

  console.error("❌ ERROR:", {
   requestId,
   message: err.message,
   stack: err.stack
  })

  return res.status(500).json({
   success:false,
   error: err.message || "internal server error",
   requestId
  })

 }

}