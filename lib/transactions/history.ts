import { pool } from "../db"
import { AppError } from "../utils/errors"

export async function getTransactionHistory(accountNumber: string){

 if(!accountNumber){
  throw new AppError("BAD_REQUEST", "accountNumber is required", 400)
 }

 // get account id
 const acc = await pool.query(
 `
 SELECT id
 FROM accounts
 WHERE account_number=$1
 `,
 [accountNumber]
 )

 if(!acc.rows.length){
  throw new AppError("NOT_FOUND", "Account not found", 404)
 }

 const accountId = acc.rows[0].id

 const result = await pool.query(
 `
 SELECT
  t.id,
  t.amount,
  t.type,
  t.status,
  t.reference,
  t.created_at
 FROM transactions t
 JOIN ledger_entries l
 ON t.id = l.transaction_id
 WHERE l.account_id=$1
 ORDER BY t.created_at DESC
 LIMIT 20
 `,
 [accountId]
 )

 return result.rows

}