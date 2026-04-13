import { pool } from "../db"

/*
 SAVE OR UPDATE SESSION
*/
export async function saveSession(
 phone: string,
 sessionId: string
){

 if(!phone || !sessionId){
  return
 }

 await pool.query(
  `
  INSERT INTO sessions(phone, session_id)
  VALUES($1,$2)
  ON CONFLICT (phone)
  DO UPDATE SET session_id = $2
  `,
  [phone, sessionId]
 )

}