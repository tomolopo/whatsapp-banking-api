import { pool } from "../db"
import { v4 as uuid } from "uuid"

import { createLedgerEntry } from "../ledger/ledger"
import { checkIdempotency, saveIdempotency } from "../idempotency"
import { runFraudChecks } from "../fraud"
import { validatePin } from "../auth/validatePin"

export async function internalTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string
){

 // 🛑 BASIC VALIDATION
 if(!fromAccountNumber || !toAccountNumber){
  throw new Error("Account numbers required")
 }

 if(amount <= 0){
  throw new Error("Invalid transfer amount")
 }

 if(!phone || !pin){
  throw new Error("Phone and PIN required")
 }

 if(!idempotencyKey){
  throw new Error("Idempotency key required")
 }

 // ✅ IDEMPOTENCY CHECK
 const existing = await checkIdempotency(idempotencyKey)
 if(existing){
  return existing
 }

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  // 🔍 FETCH ACCOUNTS
  const from = await client.query(
   `SELECT id, balance FROM accounts WHERE account_number=$1`,
   [fromAccountNumber]
  )

  const to = await client.query(
   `SELECT id FROM accounts WHERE account_number=$1`,
   [toAccountNumber]
  )

  if(!from.rows.length){
   throw new Error("Source account not found")
  }

  if(!to.rows.length){
   throw new Error("Destination account not found")
  }

  if(from.rows[0].balance < amount){
   throw new Error("Insufficient funds")
  }

  // 🔐 PIN VALIDATION (UPDATED STRUCTURE)
  const pinResult = await validatePin(phone, pin)

  if(!pinResult.valid){
   throw new Error("Invalid PIN")
  }

  const userId = pinResult.userId

  // 🚨 FRAUD CHECK (TRANSACTION SAFE)
  const fraudResult = await runFraudChecks(
   client,
   from.rows[0].id,
   amount
  )

  const fraudScore = fraudResult.riskScore

  // ⚠️ OPTIONAL: FRAUD ESCALATION (BANK-LEVEL)
  if(fraudScore >= 90){
   throw new Error("Transaction blocked: high fraud risk")
  }

  const txId = uuid()

  // 💸 DEBIT
  await client.query(
   `UPDATE accounts SET balance = balance - $1 WHERE id=$2`,
   [amount, from.rows[0].id]
  )

  // 💰 CREDIT
  await client.query(
   `UPDATE accounts SET balance = balance + $1 WHERE id=$2`,
   [amount, to.rows[0].id]
  )

  // 📒 LEDGER ENTRIES (DOUBLE ENTRY)
  await createLedgerEntry(from.rows[0].id, amount, 0, txId)
  await createLedgerEntry(to.rows[0].id, 0, amount, txId)

  // 🧾 TRANSACTION RECORD
  await client.query(
   `
   INSERT INTO transactions(id, amount, status, type, reference)
   VALUES($1,$2,$3,$4,$5)
   `,
   [txId, amount, "completed", "transfer", `TX-${Date.now()}`]
  )

  await client.query("COMMIT")

  const response = {
   success: true,
   transactionId: txId,
   amount,
   fraud: {
    score: fraudScore,
    passed: fraudResult.passed
   }
  }

  // ✅ SAVE IDEMPOTENCY RESULT
  await saveIdempotency(idempotencyKey, response)

  return response

 }catch(err:any){

  await client.query("ROLLBACK")

  // 🔥 CLEAN ERROR RESPONSE
  return {
   success: false,
   error: err.message || "Transfer failed"
  }

 }finally{

  client.release()

 }

}