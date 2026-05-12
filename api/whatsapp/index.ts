import type { VercelRequest, VercelResponse } from "@vercel/node"
import { v4 as uuid } from "uuid"
import bcrypt from "bcryptjs"
import fs from "fs"

import { checkUser } from "../../lib/auth/checkUser"
import { registerUser } from "../../lib/auth/registerUser"
import { createAccount } from "../../lib/accounts/createAccount"
import { getBalance } from "../../lib/accounts/balance"
import { getTransactionHistory } from "../../lib/transactions/history"
import { initSession } from "../../lib/session/initSession"

import { executeTransfer } from "../../lib/transfers/transfers"
import { resolveAccount } from "../../lib/transfers/resolveAccount"
import { confirmTransferDetails } from "../../lib/transfers/confirmTransfer"
import { verifyTransferToken } from "../../lib/onboarding/token"

import { logRequest, logResponse } from "../../lib/logger"
import { changePin } from "../../lib/auth/changePin"
import { verifyOTP } from "../../lib/otp"
import { validatePin } from "../../lib/auth/validatePin"
import { checkIdempotency, saveIdempotency } from "../../lib/idempotency"
import { runFraudChecks } from "../../lib/fraud"

import { purchaseAirtime } from "../../lib/services/airtime"
import { purchaseData } from "../../lib/services/data"

import { pool } from "../../lib/db"
import { getAccounts } from "../../lib/accounts/getAccount"

import { addBeneficiary } from "../../lib/beneficiaries/addBeneficiary"
import { getBeneficiaries } from "../../lib/beneficiaries/getBeneficiaries"
import { favoriteBeneficiary } from "../../lib/beneficiaries/favoriteBeneficiary"

import { generateStatementPDF } from "../../lib/pdf/statement"
import { generateReceiptPDF } from "../../lib/pdf/receipt"
import { uploadToSupabase } from "../../lib/storage/upload"

import { sendSuccess, sendError } from "../../lib/utils/response"
import { AppError } from "../../lib/utils/errors"
import { applyCors } from "../../lib/utils/cors"

async function uploadAndCleanup(filePath: string, fileName: string): Promise<string> {
 try{
  return await uploadToSupabase(filePath, fileName)
 }finally{
  try{ fs.unlinkSync(filePath) }catch{ /* ignore */ }
 }
}

async function sendWhatsAppText(to: string, text: string): Promise<void> {
 const base = process.env.INFOBIP_BASE_URL
 const apiKey = process.env.INFOBIP_API_KEY
 const sender = process.env.INFOBIP_SENDER

 if(!base || !apiKey || !sender) return

 const res = await fetch(`${base}/whatsapp/1/message/text`, {
  method: "POST",
  headers: {
   Authorization: `App ${apiKey}`,
   "Content-Type": "application/json"
  },
  body: JSON.stringify({
   from: sender,
   to,
   content: { text }
  })
 })

 if(!res.ok){
  const body = await res.text().catch(()=>"")
  console.error("WhatsApp send failed:", res.status, body)
 }
}

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 if(applyCors(req, res, ["POST", "GET", "OPTIONS"])) return

 const requestId = (req.headers["x-request-id"] as string) || uuid()

 try{
  logRequest({
   requestId,
   method: req.method,
   url: req.url,
   query: req.query || {},
   body: req.body || {},
   headers: req.headers as Record<string, unknown>
  })

  const action = req.query.action as string

  if(!action){
   return sendError(res, requestId, new AppError("BAD_REQUEST", "action parameter required", 400))
  }

  const body: Record<string, unknown> = req.method === "GET"
   ? (req.query as Record<string, unknown>)
   : (req.body || {})

  let response: unknown

  if(action === "initSession"){
   response = await initSession(body.phone as string)

  } else if(action === "checkUser"){
   response = await checkUser(body.phone as string)

  } else if(action === "register"){
   const result = await registerUser(
    body.token as string,
    body.phone as string,
    body.firstName as string,
    body.lastName as string,
    body.address as string,
    body.pin as string
   )

   response = result
   const data = result?.data

   if(data?.phone){
    const message = `Welcome ${data.firstName}!\n\nYour Bank-IB account has been created.\n\nAccount Number: ${data.accountNumber}\nBalance: ${Number(data.balance).toLocaleString()}\n\nReply "Hi" to continue.`
    sendWhatsAppText(data.phone, message).catch(e =>
     console.error("Welcome WhatsApp failed:", e)
    )
   }

  } else if(action === "createAccount"){
   response = await createAccount(body.phone as string)

  } else if(action === "balance"){
   response = await getBalance(body.phone as string, body.accountNumber as string)

  } else if(action === "resolveAccount"){
   response = await resolveAccount(body.accountNumber as string)

  } else if(action === "confirmTransferDetails"){
   response = await confirmTransferDetails(
    body.accountNumber as string,
    Number(body.amount)
   )

  } else if(action === "transfer"){
   const idempotencyKey =
    (req.headers["idempotency-key"] as string) || uuid()

   let fromAccount = body.fromAccount as string
   let toAccount = body.toAccount as string
   let amount = Number(body.amount)
   let phone = body.phone as string

   // If a signed token is supplied (from the confirm-transfer page),
   // it is the source of truth — ignore tampered body fields.
   if(typeof body.token === "string"){
    const tokenData = verifyTransferToken(body.token)
    if(!tokenData){
     throw new AppError("UNAUTHORIZED", "Invalid or expired transfer token", 401)
    }
    fromAccount = tokenData.fromAccount
    toAccount = tokenData.toAccount
    amount = tokenData.amount
    phone = tokenData.phone
   }

   response = await executeTransfer(
    fromAccount,
    toAccount,
    amount,
    phone,
    body.pin as string,
    idempotencyKey
   )

  } else if(action === "transactions"){
   response = await getTransactionHistory(body.phone as string)

  } else if(action === "addBeneficiary"){
   response = await addBeneficiary(
    body.phone as string,
    body.accountNumber as string,
    body.bankCode as string,
    body.name as string,
    body.nickname as string
   )

  } else if(action === "favoriteBeneficiary"){
   response = await favoriteBeneficiary(
    body.phone as string,
    body.accountNumber as string
   )

  } else if(action === "getBeneficiaries"){
   response = await getBeneficiaries(body.phone as string)

  } else if(action === "getAccounts"){
   response = await getAccounts(body.phone as string)

  } else if(action === "changePin"){
   response = await changePin(
    body.phone as string,
    body.oldPin as string,
    body.newPin as string
   )

  } else if(action === "statement"){
   response = await handleStatement(body)

  } else if(action === "receipt"){
   response = await handleReceipt(body)

  } else if(action === "airtime"){
   response = await handleAirtime(body, req.headers["idempotency-key"] as string)

  } else if(action === "data"){
   response = await handleData(body, req.headers["idempotency-key"] as string)

  } else if(action === "resetPin"){
   response = await handleResetPin(body)

  } else {
   return sendError(res, requestId, new AppError("NOT_FOUND", "Unknown action", 404))
  }

  logResponse({ requestId, action, response })

  const dataField =
   response && typeof response === "object" && "data" in (response as Record<string, unknown>)
    ? (response as Record<string, unknown>).data
    : response

  const metaField =
   response && typeof response === "object" && "meta" in (response as Record<string, unknown>)
    ? (response as Record<string, unknown>).meta
    : null

  return sendSuccess(res, requestId, dataField, metaField)

 }catch(err){
  console.error("Handler error:", err)
  return sendError(res, requestId, err)
 }
}

async function handleStatement(body: Record<string, unknown>){
 const accountNumber = body.accountNumber as string
 const fromDate = body.fromDate as string
 const toDate = body.toDate as string
 const phone = body.phone as string

 if(!accountNumber || !fromDate || !toDate || !phone){
  throw new AppError("BAD_REQUEST", "phone, accountNumber, fromDate and toDate are required", 400)
 }

 // Ownership check
 const owned = await pool.query(
  `
  SELECT a.id
  FROM accounts a
  JOIN users u ON u.id = a.user_id
  WHERE a.account_number=$1 AND u.phone=$2
  `,
  [accountNumber, phone]
 )

 if(!owned.rows.length){
  throw new AppError("FORBIDDEN", "Account not found for this user", 403)
 }

 const accountId = owned.rows[0].id

 const result = await pool.query(
  `
  SELECT t.id,
         t.amount,
         t.status,
         t.type,
         t.reference,
         t.created_at,
         CASE WHEN le.debit > 0 THEN 'debit' ELSE 'credit' END AS direction,
         le.debit,
         le.credit
  FROM transactions t
  JOIN ledger_entries le ON le.transaction_id = t.id
  WHERE le.account_id = $1
    AND t.created_at BETWEEN $2 AND $3
  ORDER BY t.created_at DESC
  `,
  [accountId, fromDate, toDate]
 )

 if(!result.rows.length){
  throw new AppError("NO_TRANSACTIONS", "No transactions found for this period", 404)
 }

 const fileName = `statements/statement-${accountNumber}-${Date.now()}.pdf`
 const filePath = await generateStatementPDF(accountNumber, result.rows) as string
 const fileUrl = await uploadAndCleanup(filePath, fileName)

 return {
  message: "Statement generated successfully",
  url: fileUrl,
  accountNumber,
  fromDate,
  toDate,
  totalTransactions: result.rows.length
 }
}

async function handleReceipt(body: Record<string, unknown>){
 const transactionId = body.transactionId as string
 const phone = body.phone as string

 if(!transactionId || !phone){
  throw new AppError("BAD_REQUEST", "phone and transactionId are required", 400)
 }

 const tx = await pool.query(
  `
  SELECT t.*
  FROM transactions t
  JOIN ledger_entries le ON le.transaction_id = t.id
  JOIN accounts a ON a.id = le.account_id
  JOIN users u ON u.id = a.user_id
  WHERE t.id=$1 AND u.phone=$2
  LIMIT 1
  `,
  [transactionId, phone]
 )

 if(!tx.rows.length){
  throw new AppError("NOT_FOUND", "Transaction not found", 404)
 }

 const transaction = tx.rows[0]
 const fileName = `receipts/receipt-${transactionId}-${Date.now()}.pdf`
 const filePath = await generateReceiptPDF(transaction) as string
 const fileUrl = await uploadAndCleanup(filePath, fileName)

 return {
  message: "Receipt generated successfully",
  url: fileUrl,
  transactionId: transaction.id,
  amount: transaction.amount,
  status: transaction.status,
  createdAt: transaction.created_at
 }
}

async function purchaseService(
 body: Record<string, unknown>,
 idempotencyKey: string | undefined,
 runner: (client: import("pg").PoolClient, accountId: string, amount: number) => Promise<unknown>
){
 const phone = body.phone as string
 const fromAccount = body.fromAccount as string
 const pin = body.pin as string
 const amount = Number(body.amount)

 if(!phone || !fromAccount || !pin){
  throw new AppError("BAD_REQUEST", "phone, fromAccount and pin are required", 400)
 }
 if(!Number.isFinite(amount) || amount <= 0){
  throw new AppError("BAD_REQUEST", "Invalid amount", 400)
 }

 const key = idempotencyKey || uuid()
 const cached = await checkIdempotency(key)
 if(cached) return cached

 await validatePin(phone, pin)

 const client = await pool.connect()
 try{
  await client.query("BEGIN")

  const acc = await client.query(
   `
   SELECT a.id, a.balance
   FROM accounts a
   JOIN users u ON u.id = a.user_id
   WHERE a.account_number=$1 AND u.phone=$2
   FOR UPDATE
   `,
   [fromAccount, phone]
  )

  if(!acc.rows.length){
   throw new AppError("FORBIDDEN", "Account not found or not owned by this user", 403)
  }
  if(Number(acc.rows[0].balance) < amount){
   throw new AppError("INSUFFICIENT_FUNDS", "Insufficient funds", 402)
  }

  const fraud = await runFraudChecks(client, acc.rows[0].id, amount)
  if(fraud.riskScore >= 90){
   throw new AppError("FRAUD_BLOCKED", "Transaction blocked: fraud risk", 403)
  }

  const result = await runner(client, acc.rows[0].id, amount)

  await client.query("COMMIT")
  await saveIdempotency(key, result)
  return result

 }catch(err){
  await client.query("ROLLBACK")
  throw err
 }finally{
  client.release()
 }
}

async function handleAirtime(body: Record<string, unknown>, idempotencyKey: string | undefined){
 return purchaseService(body, idempotencyKey, (client, accountId, amount) =>
  purchaseAirtime(client, accountId, amount, body.phone as string, body.network as string)
 )
}

async function handleData(body: Record<string, unknown>, idempotencyKey: string | undefined){
 return purchaseService(body, idempotencyKey, (client, accountId, amount) =>
  purchaseData(
   client,
   accountId,
   amount,
   body.phone as string,
   body.network as string,
   body.plan as string,
   body.duration as string
  )
 )
}

async function handleResetPin(body: Record<string, unknown>){
 const phone = body.phone as string
 const otp = body.otp as string
 const newPin = body.newPin as string

 if(!phone || !otp || !newPin){
  throw new AppError("BAD_REQUEST", "phone, otp and newPin are required", 400)
 }
 if(!/^\d{4,}$/.test(newPin)){
  throw new AppError("BAD_REQUEST", "PIN must be at least 4 digits", 400)
 }

 await verifyOTP(phone, otp)

 const hash = await bcrypt.hash(newPin, 10)

 const result = await pool.query(
  `
  UPDATE users
  SET pin_hash=$1,
      pin_attempts=0,
      pin_locked_until=NULL
  WHERE phone=$2
  `,
  [hash, phone]
 )

 if(result.rowCount === 0){
  throw new AppError("NOT_FOUND", "No account associated with this phone", 404)
 }

 return { message: "PIN reset successfully" }
}
