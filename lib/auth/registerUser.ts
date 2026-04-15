import { pool } from "../db"
import { v4 as uuid } from "uuid"
import bcrypt from "bcryptjs"
import { verifyToken } from "../onboarding/token"

/*
 CONFIG
*/
const DEFAULT_BALANCE = Number(
 process.env.DEFAULT_ACCOUNT_BALANCE || 1000000
)

const BANK_CODE = "999"

/*
 GENERATE UNIQUE ACCOUNT NUMBER
*/
function generateAccountNumber(){
 return Math.floor(
  1000000000 + Math.random() * 9000000000
 ).toString()
}

/*
 REGISTER USER + CREATE ACCOUNT (ATOMIC)
 NOW SUPPORTS:
 1. TOKEN FLOW (WEB)
 2. DIRECT PHONE FLOW (WHATSAPP)
*/
export async function registerUser(
 token?: string,
 phone?: string,
 firstName?: string,
 lastName?: string,
 address?: string,
 pin?: string
){

 if(!firstName || !lastName || !address || !pin){
  throw new Error("All fields are required")
 }

 if(pin.length < 4){
  throw new Error("PIN must be at least 4 digits")
 }

 let resolvedPhone:string | null = null

 // 🔐 TOKEN FLOW (WEB)
 if(token){
  resolvedPhone = verifyToken(token)

  if(!resolvedPhone){
   throw new Error("Invalid or expired token")
  }
 }

 // 📱 DIRECT FLOW (WHATSAPP)
 else if(phone){
  resolvedPhone = phone
 }

 else{
  throw new Error("Token or phone is required")
 }

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  // ❗ CHECK IF USER EXISTS
  const existing = await client.query(
   `SELECT id FROM users WHERE phone=$1`,
   [resolvedPhone]
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
    resolvedPhone,
    firstName,
    lastName,
    address,
    pinHash
   ]
  )

  // 🔁 GENERATE UNIQUE ACCOUNT NUMBER
  let accountNumber = generateAccountNumber()

  let existsAccount = await client.query(
   `SELECT id FROM accounts WHERE account_number=$1`,
   [accountNumber]
  )

  while(existsAccount.rows.length){
   accountNumber = generateAccountNumber()

   existsAccount = await client.query(
    `SELECT id FROM accounts WHERE account_number=$1`,
    [accountNumber]
   )
  }

  const accountId = uuid()

  // 🏦 CREATE ACCOUNT
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
    DEFAULT_BALANCE,
    "savings",
    BANK_CODE
   ]
  )

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

 }catch(err:any){

  await client.query("ROLLBACK")
  throw new Error(err.message)

 }finally{

  client.release()

 }
}