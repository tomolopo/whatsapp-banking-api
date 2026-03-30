import { pool } from "../db"
import { v4 as uuid } from "uuid"
import bcrypt from "bcryptjs"
import { verifyToken } from "../onboarding/token"

/*
 REGISTER USER + CREATE ACCOUNT (ATOMIC)
*/
export async function registerUser(
 token: string,
 firstName: string,
 lastName: string,
 address: string,
 pin: string
){

 if(!token){
  throw new Error("Token is required")
 }

 // 🔐 VERIFY TOKEN → GET PHONE
 const phone = verifyToken(token)

 if(!phone){
  throw new Error("Invalid or expired token")
 }

 if(!firstName || !lastName || !address || !pin){
  throw new Error("All fields are required")
 }

 if(pin.length < 4){
  throw new Error("PIN must be at least 4 digits")
 }

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  // ❗ CHECK IF USER EXISTS
  const existing = await client.query(
   `SELECT id FROM users WHERE phone=$1`,
   [phone]
  )

  if(existing.rows.length){
   throw new Error("User already exists")
  }

  // 🔐 HASH PIN
  const pinHash = await bcrypt.hash(pin, 10)

  const userId = uuid()

  // 👤 CREATE USER
  await client.query(
   `
   INSERT INTO users(
    id,
    phone,
    first_name,
    last_name,
    address,
    pin_hash
   )
   VALUES($1,$2,$3,$4,$5,$6)
   `,
   [
    userId,
    phone,
    firstName,
    lastName,
    address,
    pinHash
   ]
  )

  // 🏦 CREATE ACCOUNT (AUTO)
  const accountNumber = Math.floor(
   1000000000 + Math.random() * 9000000000
  ).toString()

  const accountId = uuid()

  await client.query(
   `
   INSERT INTO accounts(
    id,
    user_id,
    account_number,
    balance,
    account_type,
    bank_code
   )
   VALUES($1,$2,$3,$4,$5,$6)
   `,
   [
    accountId,
    userId,
    accountNumber,
    0,
    "savings",
    "999" // Bank-IB
   ]
  )

  await client.query("COMMIT")

  return {
   success: true,
   phone,
   firstName,
   lastName,
   accountNumber
  }

 }catch(err:any){

  await client.query("ROLLBACK")
  throw new Error(err.message)

 }finally{

  client.release()

 }

}