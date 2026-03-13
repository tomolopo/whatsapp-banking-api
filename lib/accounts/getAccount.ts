import { pool } from "../db"

export async function getAccount(userId:string){

 const result = await pool.query(
 `
 SELECT *
 FROM accounts
 WHERE user_id=$1
 `,
 [userId]
 )

 if(!result.rows.length){
  return null
 }

 return result.rows[0]

}