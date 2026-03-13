import { pool } from "../db"

export async function getTransactionHistory(account:string){

 const result = await pool.query(`
  SELECT
   id,
   amount,
   status,
   created_at
  FROM transactions
  WHERE account_number=$1
  ORDER BY created_at DESC
 `,
 [account]
 )

 return result.rows
}