import { pool } from "../db"
import { v4 as uuid } from "uuid"

import { createLedgerEntry } from "../ledger/ledger"
import { checkIdempotency, saveIdempotency } from "../idempotency"
import { runFraudChecks } from "../fraud"
import { validatePin } from "../auth/validatePin"

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
  throw new Error("Account numbers required")
 }

 if(amount <= 0){
  throw new Error("Invalid amount")
 }

 // ✅ IDEMPOTENCY
 const existing = await checkIdempotency(idempotencyKey)
 if(existing) return existing

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  // 🔍 ACCOUNTS
  const from = await client.query(
   `SELECT id, balance FROM accounts WHERE account_number=$1`,
   [fromAccountNumber]
  )

  const to = await client.query(
   `SELECT id FROM accounts WHERE account_number=$1`,
   [toAccountNumber]
  )

  if(!from.rows.length) throw new Error("Source account not found")
  if(!to.rows.length) throw new Error("Destination account not found")

  if(from.rows[0].balance < amount){
   throw new Error("Insufficient funds")
  }

  // 🔐 PIN
  const pinResult = await validatePin(phone, pin)
  if(!pinResult.valid){
   throw new Error("Invalid PIN")
  }

  // 🚨 FRAUD
  const fraudResult = await runFraudChecks(
   client,
   from.rows[0].id,
   amount
  )

  if(fraudResult.riskScore >= 90){
   throw new Error("Transaction blocked: fraud risk")
  }

  const txId = uuid()

  // ✅ CREATE TRANSACTION
  await client.query(
   `
   INSERT INTO transactions(id, amount, status, type, reference)
   VALUES($1,$2,$3,$4,$5)
   `,
   [txId, amount, "completed", "transfer", `TX-${Date.now()}`]
  )

  // ✅ UPDATE BALANCES
  await client.query(
   `UPDATE accounts SET balance = balance - $1 WHERE id=$2`,
   [amount, from.rows[0].id]
  )

  await client.query(
   `UPDATE accounts SET balance = balance + $1 WHERE id=$2`,
   [amount, to.rows[0].id]
  )

  // ✅ LEDGER
  await createLedgerEntry(client, from.rows[0].id, amount, 0, txId)
  await createLedgerEntry(client, to.rows[0].id, 0, amount, txId)

  await client.query("COMMIT")

  // 🧾 GENERATE RECEIPT (AFTER COMMIT)
  let receiptUrl: string | null = null

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

   const filePath: any = await generateReceiptPDF(transaction)

   receiptUrl = await uploadToSupabase(filePath, fileName)

   // 🧹 cleanup
   try{
    fs.unlinkSync(filePath)
   }catch(e){
    console.warn("Temp cleanup failed:", e)
   }

  }catch(e){
   console.error("❌ Receipt generation failed:", e)
  }

  const response = {
   success: true,
   transactionId: txId,
   amount,
   fromAccount: fromAccountNumber,
   toAccount: toAccountNumber,
   receiptUrl, // 👈 NEW
   fraudScore: fraudResult.riskScore
  }

  await saveIdempotency(idempotencyKey, response)

  return response

 }catch(err:any){

  await client.query("ROLLBACK")

  return {
   success: false,
   error: err.message
  }

 }finally{
  client.release()
 }
}