import { pool } from "../db"
import { v4 as uuid } from "uuid"

import { createLedgerEntry } from "../ledger/ledger"
import { checkIdempotency, saveIdempotency } from "../idempotency"
import { runFraudChecks } from "../fraud"
import { validatePin } from "../auth/validatePin"
import { AppError } from "../utils/errors"

import { generateReceiptPDF } from "../pdf/receipt"
import { uploadToSupabase } from "../storage/upload"
import fs from "fs"

export async function internalTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string
){

 if(!fromAccountNumber || !toAccountNumber){
  throw new AppError("BAD_REQUEST", "Account numbers required", 400)
 }

 if(!Number.isFinite(amount) || amount <= 0){
  throw new AppError("BAD_REQUEST", "Invalid amount", 400)
 }

 const existing = await checkIdempotency(idempotencyKey)
 if(existing) return existing

 // PIN check first — owner verification happens via the join below
 await validatePin(phone, pin)

 const client = await pool.connect()

 try{
  await client.query("BEGIN")

  // Source account MUST belong to the caller's phone
  const from = await client.query(
   `
   SELECT a.id, a.balance
   FROM accounts a
   JOIN users u ON u.id = a.user_id
   WHERE a.account_number=$1 AND u.phone=$2
   FOR UPDATE
   `,
   [fromAccountNumber, phone]
  )

  if(!from.rows.length){
   throw new AppError(
    "FORBIDDEN",
    "Source account not found or not owned by this user",
    403
   )
  }

  const to = await client.query(
   `SELECT id FROM accounts WHERE account_number=$1 FOR UPDATE`,
   [toAccountNumber]
  )

  if(!to.rows.length){
   throw new AppError("NOT_FOUND", "Destination account not found", 404)
  }

  if(Number(from.rows[0].balance) < amount){
   throw new AppError("INSUFFICIENT_FUNDS", "Insufficient funds", 402)
  }

  const fraudResult = await runFraudChecks(client, from.rows[0].id, amount)

  if(fraudResult.riskScore >= 90){
   throw new AppError("FRAUD_BLOCKED", "Transaction blocked: fraud risk", 403)
  }

  const txId = uuid()

  await client.query(
   `
   INSERT INTO transactions(id, amount, status, type, reference, from_account, to_account)
   VALUES($1,$2,$3,$4,$5,$6,$7)
   `,
   [txId, amount, "completed", "transfer", `TX-${Date.now()}`, fromAccountNumber, toAccountNumber]
  )

  await client.query(
   `UPDATE accounts SET balance = balance - $1 WHERE id=$2`,
   [amount, from.rows[0].id]
  )

  await client.query(
   `UPDATE accounts SET balance = balance + $1 WHERE id=$2`,
   [amount, to.rows[0].id]
  )

  await createLedgerEntry(client, from.rows[0].id, amount, 0, txId)
  await createLedgerEntry(client, to.rows[0].id, 0, amount, txId)

  await client.query("COMMIT")

  // Receipt is best-effort; do not fail the transfer if it fails
  let receiptUrl: string | null = null
  let receiptStatus: "ok" | "failed" = "ok"
  let filePath: string | null = null

  try{
   const fileName = `receipts/receipt-${txId}-${Date.now()}.pdf`
   const transaction = {
    id: txId,
    amount,
    status: "completed",
    from_account: fromAccountNumber,
    to_account: toAccountNumber,
    created_at: new Date().toISOString()
   }
   filePath = await generateReceiptPDF(transaction) as string
   receiptUrl = await uploadToSupabase(filePath, fileName)
  }catch(e){
   receiptStatus = "failed"
   console.error("Receipt generation failed:", e)
  }finally{
   if(filePath){
    try{ fs.unlinkSync(filePath) }catch{ /* ignore */ }
   }
  }

  const response = {
   success: true,
   transactionId: txId,
   amount,
   fromAccount: fromAccountNumber,
   toAccount: toAccountNumber,
   receiptUrl,
   receiptStatus,
   fraudScore: fraudResult.riskScore
  }

  await saveIdempotency(idempotencyKey, response)

  return response

 }catch(err){
  await client.query("ROLLBACK")
  throw err
 }finally{
  client.release()
 }
}
