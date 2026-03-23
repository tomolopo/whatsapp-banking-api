import { pool } from "../db"

export async function getTransactionHistory(accountNumber: string){

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
  throw new Error("Account not found")
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