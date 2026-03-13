import { pool } from "./db"

export async function checkDailyLimit(
 account:string,
 amount:number
){

 const result = await pool.query(
 `
 SELECT SUM(amount) total
 FROM transactions
 WHERE account_number=$1
 AND created_at >= CURRENT_DATE
 `,
 [account]
 )

 const total = result.rows[0].total || 0

 const DAILY_LIMIT = 500000

 if(total + amount > DAILY_LIMIT){

  throw new Error("Daily transfer limit exceeded")

 }

}