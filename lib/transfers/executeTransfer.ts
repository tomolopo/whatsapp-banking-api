import { pool } from "../db"
import { internalTransfer } from "./internal"
import { interbankTransfer } from "./interbank"
import { validatePin } from "../auth/validatePin"
import { resolveAccount } from "./resolveAccount"

export async function executeTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string,
 bankCode?: string // optional override
){

 if(!fromAccountNumber || !toAccountNumber){
  throw new Error("Account numbers required")
 }

 if(!amount || amount <= 0){
  throw new Error("Invalid amount")
 }

 // 🔍 GET USER
 const userRes = await pool.query(
 `SELECT id FROM users WHERE phone=$1`,
 [phone]
 )

 if(!userRes.rows.length){
  throw new Error("User not found")
 }

 const userId = userRes.rows[0].id

 // 🔍 VALIDATE SOURCE ACCOUNT OWNERSHIP
 const fromAcc = await pool.query(
 `
 SELECT id, balance, bank_code
 FROM accounts
 WHERE account_number=$1 AND user_id=$2
 `,
 [fromAccountNumber, userId]
 )

 if(!fromAcc.rows.length){
  throw new Error("Invalid source account")
 }

 const source = fromAcc.rows[0]

 // 🔐 PIN VALIDATION
 const pinResult = await validatePin(phone, pin)

 if(!pinResult.valid){
  throw new Error("Invalid PIN")
 }

 // 🧠 AUTO RESOLVE DESTINATION
 const resolved = await resolveAccount(toAccountNumber)

 // 🔁 ALLOW MANUAL OVERRIDE (if provided)
 const destinationBank =
  bankCode || resolved.bankCode

 // 🏦 CASE 1: INTERNAL TRANSFER (Bank-IB → Bank-IB)
 if(destinationBank === "999"){

  return await internalTransfer(
   fromAccountNumber,
   toAccountNumber,
   amount,
   phone,
   pin,
   idempotencyKey
  )

 }

 // 🌍 CASE 2: INTERBANK TRANSFER

 if(source.balance < amount){
  throw new Error("Insufficient funds")
 }

 // 💸 DEBIT SOURCE ACCOUNT
 await pool.query(
 `
 UPDATE accounts
 SET balance = balance - $1
 WHERE id=$2
 `,
 [amount, source.id]
 )

 // 🌍 CALL INTERBANK (SIMULATED)
 const result = await interbankTransfer(
  source.id,
  toAccountNumber,
  destinationBank,
  amount
 )

 return {
  success: true,
  type: "interbank",
  bankName: resolved.bankName,
  accountName: resolved.accountName,
  reference: result.reference,
  message: `₦${amount} sent to ${resolved.accountName} (${resolved.bankName})`
 }

}