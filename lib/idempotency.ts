import { pool } from "./db"

export async function checkIdempotency(key: string){

 if(!key){
  return null // ✅ DO NOT CRASH
 }

 const existing = await pool.query(
 `
 SELECT response
 FROM idempotency_keys
 WHERE key=$1
 `,
 [key]
 )

 if(existing.rows.length){
  return existing.rows[0].response
 }

 return null
}

export async function saveIdempotency(
 key: string,
 response: any
){

 if(!key){
  return // ✅ skip silently
 }

 await pool.query(
 `
 INSERT INTO idempotency_keys(key,response)
 VALUES($1,$2)
 `,
 [key, JSON.stringify(response)]
 )
}