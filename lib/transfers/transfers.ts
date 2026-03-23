import { pool } from "../db"
import { v4 as uuid } from "uuid"
import { createLedgerEntry } from "../ledger/ledger"
import { checkIdempotency, saveIdempotency } from "../idempotency"
import { runFraudChecks } from "../fraud"
import { validatePin } from "../auth/validatePin"

export async function executeTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string
){

 // ✅ IDEMPOTENCY
 const existing = await checkIdempotency(idempotencyKey)
 if(existing){
  return existing
 }

 const client = await pool.connect()

 try{

 await client.query("BEGIN")

 // 🔍 GET ACCOUNTS
 const from = await client.query(
 `SELECT id,balance FROM accounts WHERE account_number=$1`,
 [fromAccountNumber]
 )

 const to = await client.query(
 `SELECT id FROM accounts WHERE account_number=$1`,
 [toAccountNumber]
 )

 if(!from.rows.length || !to.rows.length){
  throw new Error("Invalid account")
 }

 if(from.rows[0].balance < amount){
  throw new Error("Insufficient funds")
 }

 // 🔐 PIN VALIDATION
 const validPin = await validatePin(phone,pin)

 if(!validPin){
  throw new Error("Invalid PIN")
 }

 // 🚨 FRAUD CHECK (UPDATED VERSION)
 const fraudResult = await runFraudChecks(
  client,
  from.rows[0].id,
  amount
 )

 const txId = uuid()

 // 💸 DEBIT
 await client.query(
 `UPDATE accounts SET balance=balance-$1 WHERE id=$2`,
 [amount, from.rows[0].id]
 )

 // 💰 CREDIT
 await client.query(
 `UPDATE accounts SET balance=balance+$1 WHERE id=$2`,
 [amount, to.rows[0].id]
 )

 // 📒 LEDGER
 await createLedgerEntry(from.rows[0].id,amount,0,txId)
 await createLedgerEntry(to.rows[0].id,0,amount,txId)

 // 🧾 TRANSACTION
 await client.query(
 `
 INSERT INTO transactions(id,amount,status,type,reference)
 VALUES($1,$2,$3,$4,$5)
 `,
 [txId,amount,"completed","transfer",`TX-${Date.now()}`]
 )

 await client.query("COMMIT")

 const response = {
  success:true,
  transactionId:txId,
  fraudScore: fraudResult.riskScore
 }

 // ✅ SAVE IDEMPOTENCY
 await saveIdempotency(idempotencyKey,response)

 return response

 }catch(err){

 await client.query("ROLLBACK")
 throw err

 }finally{

 client.release()

 }

}