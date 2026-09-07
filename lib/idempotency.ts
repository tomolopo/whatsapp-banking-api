import { pool } from "./db"
import { AppError } from "./utils/errors"

const PENDING_RESPONSE = { __pending: true }

function parseResponse(response: unknown){
 if(typeof response === "string"){
  try{
   return JSON.parse(response)
  }catch{
   return response
  }
 }

 return response
}

function isPending(response: unknown){
 return Boolean(response && typeof response === "object" && (response as { __pending?: boolean }).__pending)
}

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
  const response = parseResponse(existing.rows[0].response)
  if(isPending(response)) return null
  return response
 }

 return null
}

export async function claimIdempotency(key: string){
 if(!key){
  return { claimed: true, cached: null as unknown }
 }

 const inserted = await pool.query(
  `
  INSERT INTO idempotency_keys(key,response)
  VALUES($1,$2)
  ON CONFLICT (key) DO NOTHING
  RETURNING key
  `,
  [key, JSON.stringify(PENDING_RESPONSE)]
 )

 if(inserted.rowCount){
  return { claimed: true, cached: null as unknown }
 }

 const cached = await checkIdempotency(key)
 if(cached !== null){
  return { claimed: false, cached }
 }

 throw new AppError("CONFLICT", "Request already in progress", 409)
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
 ON CONFLICT (key) DO UPDATE SET response = EXCLUDED.response
 `,
 [key, JSON.stringify(response)]
 )
}

export async function clearIdempotency(key: string){
 if(!key){
  return
 }

 await pool.query(
  `
  DELETE FROM idempotency_keys
  WHERE key=$1
  `,
  [key]
 )
}
