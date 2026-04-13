import { pool } from "../db"

export async function getSessionIdByPhone(phone: string){

 const result = await pool.query(
  `SELECT session_id FROM sessions WHERE phone=$1`,
  [phone]
 )

 if(!result.rows.length){
  return null
 }

 return result.rows[0].session_id

}