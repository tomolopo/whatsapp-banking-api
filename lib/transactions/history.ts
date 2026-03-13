import { pool } from "../db"

export async function getTransactionHistory(
 accountNumber:string
){

 const result = await pool.query(
 `
 SELECT *
 FROM transactions
 WHERE account_number=$1
 ORDER BY created_at DESC
 LIMIT 10
 `,
 [accountNumber]
 )

 return result.rows

}