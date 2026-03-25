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

import { resolveAccount } from "../../lib/transfers/resolveAccount"
import { confirmTransferDetails } from "../../lib/transfers/confirmTransfer"

import { logRequest, logResponse } from "../../lib/logger"

import { changePin } from "../../lib/auth/changePin"

import { purchaseAirtime } from "../../lib/services/airtime"
import { purchaseData } from "../../lib/services/data"

import { pool } from "../../lib/db"

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

 // 🔗 CORRELATION ID
 const requestId = (req.headers["x-request-id"] as string) || uuid()

 try{

  // 📥 SAFE LOGGING
  logRequest({
   requestId,
   method: req.method,
   url: req.url,
   query: req.query || {},
   body: req.body || {},
   headers: req.headers || {}
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
   response = await initSession(body.phone as string)
  }

  // 👤 CHECK USER
  else if(action === "checkUser"){
   response = await checkUser(body.phone as string)
  }

  // 📝 REGISTER USER
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

  // 🔍 RESOLVE ACCOUNT (NEW)
  else if(action === "resolveAccount"){
   response = await resolveAccount(
    body.accountNumber as string
   )
  }

  // 🧠 CONFIRM TRANSFER DETAILS (NEW)
  else if(action === "confirmTransferDetails"){
   response = await confirmTransferDetails(
    body.accountNumber as string,
    Number(body.amount)
   )
  }

  // 💸 DIRECT TRANSFER
  else if(action === "transfer"){

   const { fromAccount, toAccount, amount, phone, pin } = body

   const idempotencyKey =
    (req.headers["idempotency-key"] ||
     req.headers["Idempotency-Key"]) as string || uuid()

   response = await executeTransfer(
    fromAccount,
    toAccount,
    Number(amount),
    phone,
    pin,
    idempotencyKey
   )
  }

  // 🔐 INITIATE TRANSFER (OTP)
  else if(action === "initiateTransfer"){
   response = await initiateTransfer(body)
  }

  // 🔐 CONFIRM TRANSFER (OTP)
  else if(action === "confirmTransfer"){
   response = await confirmTransfer(body)
  }

  // 📜 TRANSACTION HISTORY
  else if(action === "transactions"){
   response = await getTransactionHistory(body.phone)
  }

  // CHANGE PIN
  else if(action === "changePin"){

 response = await changePin(
  body.phone,
  body.oldPin,
  body.newPin
 )

}

//AIRTIME PURCHASE

else if(action === "airtime"){

 const { phone, amount, network, fromAccount } = body

 const acc = await pool.query(
 `SELECT id, balance FROM accounts WHERE account_number=$1`,
 [fromAccount]
 )

 if(!acc.rows.length){
  throw new Error("Account not found")
 }

 if(acc.rows[0].balance < amount){
  throw new Error("Insufficient funds")
 }

 const client = await pool.connect()
 await client.query("BEGIN")

 const result = await purchaseAirtime(
  client,
  acc.rows[0].id,
  Number(amount),
  phone,
  network
 )

 await client.query("COMMIT")
 client.release()

 response = result
}

//DATA PURCHASE

else if(action === "data"){

 const {
  phone,
  amount,
  network,
  fromAccount,
  plan,
  duration
 } = body

 const acc = await pool.query(
 `SELECT id, balance FROM accounts WHERE account_number=$1`,
 [fromAccount]
 )

 if(!acc.rows.length){
  throw new Error("Account not found")
 }

 if(acc.rows[0].balance < amount){
  throw new Error("Insufficient funds")
 }

 const client = await pool.connect()
 await client.query("BEGIN")

 const result = await purchaseData(
  client,
  acc.rows[0].id,
  Number(amount),
  phone,
  network,
  plan,
  duration
 )

 await client.query("COMMIT")
 client.release()

 response = result
}

//RESET PIN

else if(action === "resetPin"){

 const bcrypt = require("bcryptjs")

 const { phone, newPin } = body

 if(!phone || !newPin){
  throw new Error("phone and newPin required")
 }

 const hash = await bcrypt.hash(newPin, 10)

 await pool.query(
 `
 UPDATE users
 SET pin_hash=$1,
     pin_attempts=0,
     pin_locked_until=NULL
 WHERE phone=$2
 `,
 [hash, phone]
 )

 response = {
  success: true,
  message: "PIN reset successfully"
 }

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