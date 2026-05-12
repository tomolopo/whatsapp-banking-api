import { pool } from "../db"
import { v4 as uuid } from "uuid"
import { randomInt } from "crypto"
import bcrypt from "bcryptjs"
import { verifyToken } from "../onboarding/token"
import { AppError } from "../utils/errors"

const DEFAULT_BALANCE = Number(process.env.DEFAULT_ACCOUNT_BALANCE || 1000000)
const BANK_CODE = "999"
const MAX_ACCOUNT_NUM_RETRIES = 5

function generateAccountNumber(): string {
 // 10-digit account number, crypto-random
 return randomInt(1_000_000_000, 10_000_000_000).toString()
}

export async function registerUser(
 token?: string,
 phone?: string,
 firstName?: string,
 lastName?: string,
 address?: string,
 pin?: string
){

 if(!firstName || !lastName || !address || !pin){
  throw new AppError("BAD_REQUEST", "All fields are required", 400)
 }

 if(!/^\d{4,}$/.test(pin)){
  throw new AppError("BAD_REQUEST", "PIN must be at least 4 digits", 400)
 }

 let resolvedPhone: string | null = null

 if(token){
  resolvedPhone = verifyToken(token)
  if(!resolvedPhone){
   throw new AppError("UNAUTHORIZED", "Invalid or expired token", 401)
  }
 } else if(phone){
  resolvedPhone = phone
 } else {
  throw new AppError("BAD_REQUEST", "Token or phone is required", 400)
 }

 const client = await pool.connect()

 try{
  await client.query("BEGIN")

  const existing = await client.query(
   `SELECT id FROM users WHERE phone=$1`,
   [resolvedPhone]
  )

  if(existing.rows.length){
   // Don't reveal whether the phone was already registered
   throw new AppError("REGISTRATION_FAILED", "Registration could not be completed", 409)
  }

  const pinHash = await bcrypt.hash(pin, 10)
  const userId = uuid()

  await client.query(
   `
   INSERT INTO users(id, phone, first_name, last_name, address, pin_hash)
   VALUES($1,$2,$3,$4,$5,$6)
   `,
   [userId, resolvedPhone, firstName, lastName, address, pinHash]
  )

  // Relies on a UNIQUE constraint on accounts.account_number.
  // Retry on conflict instead of pre-checking (avoids a race).
  let accountNumber: string | null = null
  const accountId = uuid()

  for(let attempt = 0; attempt < MAX_ACCOUNT_NUM_RETRIES; attempt++){
   const candidate = generateAccountNumber()
   try{
    await client.query(
     `
     INSERT INTO accounts(id, user_id, account_number, balance, account_type, bank_code)
     VALUES($1,$2,$3,$4,$5,$6)
     `,
     [accountId, userId, candidate, DEFAULT_BALANCE, "savings", BANK_CODE]
    )
    accountNumber = candidate
    break
   }catch(e: unknown){
    const err = e as { code?: string }
    if(err.code !== "23505") throw e // not a unique-violation
   }
  }

  if(!accountNumber){
   throw new AppError("CONFLICT", "Could not allocate account number", 503)
  }

  await client.query("COMMIT")

  return {
   success: true,
   data: {
    phone: resolvedPhone,
    firstName,
    lastName,
    accountNumber,
    accountType: "savings",
    bankCode: BANK_CODE,
    balance: DEFAULT_BALANCE
   }
  }
 }catch(err){
  await client.query("ROLLBACK")
  throw err
 }finally{
  client.release()
 }
}
