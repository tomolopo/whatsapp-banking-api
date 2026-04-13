import { pool } from "../db"
import { v4 as uuid } from "uuid"

/*
 CONFIG
*/
const BANK_CODE = "999" // Bank-IB
const BANK_NAME = "Bank-IB"

const DEFAULT_BALANCE = Number(
 process.env.DEFAULT_ACCOUNT_BALANCE || 1000000
)

/*
 GENERATE ACCOUNT NUMBER (10 digits)
*/
function generateAccountNumber(){
 return Math.floor(
  1000000000 + Math.random() * 9000000000
 ).toString()
}

/*
 CREATE ACCOUNT (PRODUCTION READY)
*/
export async function createAccount(
 phone: string,
 type: string = "savings"
){

 if(!phone){
  throw new Error("Phone is required")
 }

 const client = await pool.connect()

 try{

  await client.query("BEGIN")

  // 🔍 GET USER
  const userRes = await client.query(
   `SELECT id FROM users WHERE phone=$1`,
   [phone]
  )

  if(!userRes.rows.length){
   throw new Error("User not found")
  }

  const userId = userRes.rows[0].id

  // 🔢 ACCOUNT LIMIT (MAX 5)
  const countRes = await client.query(
   `SELECT COUNT(*) FROM accounts WHERE user_id=$1`,
   [userId]
  )

  const totalAccounts = parseInt(countRes.rows[0].count)

  if(totalAccounts >= 5){
   throw new Error("Maximum account limit reached (5)")
  }

  // 🔁 GENERATE UNIQUE ACCOUNT NUMBER
  let accountNumber = generateAccountNumber()

  let exists = await client.query(
   `SELECT id FROM accounts WHERE account_number=$1`,
   [accountNumber]
  )

  while(exists.rows.length){
   accountNumber = generateAccountNumber()

   exists = await client.query(
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
    type,
    BANK_CODE
   ]
  )

  await client.query("COMMIT")

  return {
   success: true,
   data: {
    accountId,
    accountNumber,
    accountType: type,
    bankCode: BANK_CODE,
    bankName: BANK_NAME,
    balance: DEFAULT_BALANCE
   }
  }

 }catch(err:any){

  await client.query("ROLLBACK")

  throw new Error(
   err.message || "Account creation failed"
  )

 }finally{

  client.release()

 }

}