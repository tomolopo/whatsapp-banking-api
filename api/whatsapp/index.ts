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

import { getAccounts } from "../../lib/accounts/getAccount"

import { addBeneficiary } from "../../lib/beneficiaries/addBeneficiary"
import { getBeneficiaries } from "../../lib/beneficiaries/getBeneficiaries"
import { favoriteBeneficiary } from "../../lib/beneficiaries/favoriteBeneficiary"

// ✅ NEW
import { sendSuccess, sendError } from "../../lib/utils/response"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 res.setHeader("Access-Control-Allow-Origin","*")
 res.setHeader("Access-Control-Allow-Methods","POST,GET,OPTIONS")
 res.setHeader("Access-Control-Allow-Headers","Content-Type, idempotency-key")

 if(req.method === "OPTIONS"){
  return res.status(200).end()
 }

 const requestId = (req.headers["x-request-id"] as string) || uuid()

 try{

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
   return sendError(res, requestId, {
    code: "BAD_REQUEST",
    message: "action parameter required"
   }, 400)
  }

  const body = req.method === "GET"
   ? req.query
   : req.body || {}

  let response:any

  // INIT SESSION
  if(action === "initSession"){
   response = await initSession(body.phone as string)
  }

  // CHECK USER
  else if(action === "checkUser"){
   response = await checkUser(body.phone as string)
  }

  // REGISTER
  else if(action === "register"){

   const result = await registerUser(
    body.token,
    body.phone,
    body.firstName,
    body.lastName,
    body.address,
    body.pin
   )

   response = result

   const data = result?.data || result

   const phone = data.phone

   try{
    const message = `🎉 Welcome ${data.firstName}!

Your Bank-IB account has been created successfully.

💳 Account Number: ${data.accountNumber}
💰 Balance: ₦${Number(data.balance).toLocaleString()}

Reply "Hi" to continue.`

    await fetch(`${process.env.INFOBIP_BASE_URL}/whatsapp/1/message/text`, {
     method: "POST",
     headers: {
      "Authorization": `App ${process.env.INFOBIP_API_KEY}`,
      "Content-Type": "application/json"
     },
     body: JSON.stringify({
      from: process.env.INFOBIP_SENDER,
      to: phone,
      content: { text: message }
     })
    })

   }catch(e){
    console.error("WhatsApp send failed:", e)
   }

  }

  // CREATE ACCOUNT
  else if(action === "createAccount"){
   response = await createAccount(body.phone)
  }

  // BALANCE
  else if(action === "balance"){
   response = await getBalance(body.phone, body.accountNumber)
  }

  // RESOLVE ACCOUNT
  else if(action === "resolveAccount"){
   response = await resolveAccount(body.accountNumber as string)
  }

  // CONFIRM TRANSFER
  else if(action === "confirmTransferDetails"){
   response = await confirmTransferDetails(
    body.accountNumber as string,
    Number(body.amount)
   )
  }

  // TRANSFER
  else if(action === "transfer"){

   const idempotencyKey =
    (req.headers["idempotency-key"] as string) || uuid()

   response = await executeTransfer(
    body.fromAccount,
    body.toAccount,
    Number(body.amount),
    body.phone,
    body.pin,
    idempotencyKey
   )
  }

  // TRANSACTIONS
  else if(action === "transactions"){
   response = await getTransactionHistory(body.phone)
  }

  // BENEFICIARIES
  else if(action === "addBeneficiary"){
   response = await addBeneficiary(
    body.phone,
    body.accountNumber,
    body.bankCode,
    body.name,
    body.nickname
   )
  }

  else if(action === "favoriteBeneficiary"){
   response = await favoriteBeneficiary(
    body.phone,
    body.accountNumber
   )
  }

  else if(action === "getBeneficiaries"){
   response = await getBeneficiaries(body.phone)
  }

  else if(action === "getAccounts"){
   response = await getAccounts(body.phone)
  }

  // CHANGE PIN
  else if(action === "changePin"){
   response = await changePin(
    body.phone,
    body.oldPin,
    body.newPin
   )
  }

  // AIRTIME
  else if(action === "airtime"){

   const acc = await pool.query(
    `SELECT id, balance FROM accounts WHERE account_number=$1`,
    [body.fromAccount]
   )

   if(!acc.rows.length){
    throw { code: "NOT_FOUND", message: "Account not found" }
   }

   if(acc.rows[0].balance < body.amount){
    throw { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds" }
   }

   const client = await pool.connect()
   await client.query("BEGIN")

   const result = await purchaseAirtime(
    client,
    acc.rows[0].id,
    Number(body.amount),
    body.phone,
    body.network
   )

   await client.query("COMMIT")
   client.release()

   response = result
  }

  // DATA
  else if(action === "data"){

   const acc = await pool.query(
    `SELECT id, balance FROM accounts WHERE account_number=$1`,
    [body.fromAccount]
   )

   if(!acc.rows.length){
    throw { code: "NOT_FOUND", message: "Account not found" }
   }

   if(acc.rows[0].balance < body.amount){
    throw { code: "INSUFFICIENT_FUNDS", message: "Insufficient funds" }
   }

   const client = await pool.connect()
   await client.query("BEGIN")

   const result = await purchaseData(
    client,
    acc.rows[0].id,
    Number(body.amount),
    body.phone,
    body.network,
    body.plan,
    body.duration
   )

   await client.query("COMMIT")
   client.release()

   response = result
  }

  // RESET PIN
  else if(action === "resetPin"){

   const bcrypt = require("bcryptjs")

   const hash = await bcrypt.hash(body.newPin, 10)

   await pool.query(
    `
    UPDATE users
    SET pin_hash=$1,
        pin_attempts=0,
        pin_locked_until=NULL
    WHERE phone=$2
    `,
    [hash, body.phone]
   )

   response = {
    message: "PIN reset successfully"
   }
  }

  else{
   return sendError(res, requestId, {
    code: "NOT_FOUND",
    message: "Unknown action"
   }, 404)
  }

  logResponse({ requestId, action, response })

  return sendSuccess(
   res,
   requestId,
   response?.data || response,
   response?.meta || null
  )

 }catch(err:any){

  console.error("❌ ERROR:", err)

  return sendError(res, requestId, err)
 }
}