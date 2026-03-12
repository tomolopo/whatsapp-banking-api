import { pool } from "./db";
import { v4 as uuid } from "uuid";

export async function runFraudChecks(
 accountId: string,
 amount: number
){

 /*
 RULE 1
 Velocity check
 */

 const velocity = await pool.query(
 `
 SELECT COUNT(*)
 FROM transactions
 JOIN ledger_entries
 ON transactions.id = ledger_entries.transaction_id
 WHERE ledger_entries.account_id=$1
 AND transactions.created_at > NOW() - INTERVAL '1 minute'
 `,
 [accountId]
 );

 if(parseInt(velocity.rows[0].count) > 5){

  await pool.query(
  `
  INSERT INTO fraud_flags(id,account_id,reason,severity)
  VALUES($1,$2,$3,$4)
  `,
  [
   uuid(),
   accountId,
   "too_many_transfers",
   "high"
  ]
  );

  throw new Error("Fraud check failed: velocity limit exceeded");

 }

 /*
 RULE 2
 Large transaction
 */

 if(amount > 1000000){

  await pool.query(
  `
  INSERT INTO fraud_flags(id,account_id,reason,severity)
  VALUES($1,$2,$3,$4)
  `,
  [
   uuid(),
   accountId,
   "large_transaction",
   "medium"
  ]
  );

 }

 /*
 RULE 3
 New account draining
 */

 const accountAge = await pool.query(
 `
 SELECT created_at
 FROM accounts
 WHERE id=$1
 `,
 [accountId]
 );

 const created = new Date(accountAge.rows[0].created_at);

 const ageMinutes =
 (Date.now() - created.getTime()) / 60000;

 if(ageMinutes < 5 && amount > 200000){

  await pool.query(
  `
  INSERT INTO fraud_flags(id,account_id,reason,severity)
  VALUES($1,$2,$3,$4)
  `,
  [
   uuid(),
   accountId,
   "new_account_large_transfer",
   "high"
  ]
  );

  throw new Error("Fraud check failed: suspicious account activity");

 }

 return true;

}