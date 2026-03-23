import { PoolClient } from "pg"
import { v4 as uuid } from "uuid"

/*
 PRODUCTION FRAUD ENGINE
 - Uses transaction client (NOT pool)
 - Supports scoring + blocking
*/

export async function runFraudChecks(
 client: PoolClient,
 accountId: string,
 amount: number
){

 let riskScore = 0

 /*
 RULE 1: Velocity
 */

 const velocity = await client.query(
 `
 SELECT COUNT(*)
 FROM transactions
 JOIN ledger_entries
 ON transactions.id = ledger_entries.transaction_id
 WHERE ledger_entries.account_id=$1
 AND transactions.created_at > NOW() - INTERVAL '1 minute'
 `,
 [accountId]
 )

 if(parseInt(velocity.rows[0].count) > 5){

  await flagFraud(client, accountId, "too_many_transfers", "high")

  riskScore += 90

  throw new Error("Fraud: velocity limit exceeded")

 }

 /*
 RULE 2: Large transaction
 */

 if(amount > 1000000){

  await flagFraud(client, accountId, "large_transaction", "medium")

  riskScore += 40

 }

 /*
 RULE 3: New account draining
 */

 const accountAge = await client.query(
 `
 SELECT created_at
 FROM accounts
 WHERE id=$1
 `,
 [accountId]
 )

 const created = new Date(accountAge.rows[0].created_at)

 const ageMinutes = (Date.now() - created.getTime()) / 60000

 if(ageMinutes < 5 && amount > 200000){

  await flagFraud(client, accountId, "new_account_large_transfer", "high")

  riskScore += 80

  throw new Error("Fraud: suspicious new account activity")

 }

 /*
 RULE 4: Suspicious thresholds
 */

 if(amount > 500000){
  riskScore += 20
 }

 /*
 RETURN STRUCTURE (IMPORTANT)
 */

 return {
  passed: true,
  riskScore
 }

}

/*
 HELPER FUNCTION
*/

async function flagFraud(
 client: PoolClient,
 accountId: string,
 reason: string,
 severity: string
){

 await client.query(
 `
 INSERT INTO fraud_flags(id,account_id,reason,severity)
 VALUES($1,$2,$3,$4)
 `,
 [
  uuid(),
  accountId,
  reason,
  severity
 ]
 )

}