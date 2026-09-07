import { pool } from "../db"
import { internalTransfer } from "./internal"
import { interbankTransfer } from "./interbank"
import { resolveAccount } from "./resolveAccount"
import { validatePin } from "../auth/validatePin"
import { claimIdempotency, saveIdempotency, clearIdempotency } from "../idempotency"
import { runFraudChecks } from "../fraud"
import { createLedgerEntry } from "../ledger/ledger"
import { AppError } from "../utils/errors"

export async function executeTransfer(
 fromAccountNumber: string,
 toAccountNumber: string,
 amount: number,
 phone: string,
 pin: string,
 idempotencyKey: string,
 bankCodeOverride?: string
){

 if(!fromAccountNumber || !toAccountNumber){
  throw new AppError("BAD_REQUEST", "Account numbers required", 400)
 }
 if(!Number.isFinite(amount) || amount <= 0){
  throw new AppError("BAD_REQUEST", "Invalid amount", 400)
 }

 const resolved = await resolveAccount(toAccountNumber)
 const destinationBank = bankCodeOverride || resolved.bankCode

 if(destinationBank === "999"){
  return internalTransfer(
   fromAccountNumber,
   toAccountNumber,
   amount,
   phone,
   pin,
   idempotencyKey
  )
 }

 const idempotency = await claimIdempotency(idempotencyKey)
 if(!idempotency.claimed) return idempotency.cached

 // Interbank path
 await validatePin(phone, pin)

 const client = await pool.connect()
 try{
  await client.query("BEGIN")

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

  const source = from.rows[0]
  if(Number(source.balance) < amount){
   throw new AppError("INSUFFICIENT_FUNDS", "Insufficient funds", 402)
  }

  const fraud = await runFraudChecks(client, source.id, amount)
  if(fraud.riskScore >= 90){
   throw new AppError("FRAUD_BLOCKED", "Transaction blocked: fraud risk", 403)
  }

  await client.query(
   `UPDATE accounts SET balance = balance - $1 WHERE id=$2`,
   [amount, source.id]
  )

  const result = await interbankTransfer(
   client,
   source.id,
   toAccountNumber,
   destinationBank,
   amount
  )

  await createLedgerEntry(client, source.id, amount, 0, result.transactionId)

  await client.query("COMMIT")

  const response = {
   success: true,
   type: "interbank",
   bankName: resolved.bankName,
   accountName: resolved.accountName,
   reference: result.reference,
   transactionId: result.transactionId,
   amount,
   fromAccount: fromAccountNumber,
   toAccount: toAccountNumber,
   message: `${amount} sent to ${resolved.accountName} (${resolved.bankName})`
  }

  await saveIdempotency(idempotencyKey, response)
  return response

 }catch(err){
  await client.query("ROLLBACK")
  await clearIdempotency(idempotencyKey).catch(() => undefined)
  throw err
 }finally{
  client.release()
 }
}
