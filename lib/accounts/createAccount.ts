import { pool } from "../db"
import { v4 as uuid } from "uuid"

/*
 BANK-IB CODE (DEMO BANK)
*/
const BANK_CODE = "999"

/*
 GENERATE ACCOUNT NUMBER (10 digits)
 Later can upgrade to real NUBAN
*/
function generateAccountNumber(){
 return Math.floor(
  1000000000 + Math.random() * 9000000000
 ).toString()
}

/*
 CREATE ACCOUNT (MULTI-ACCOUNT SUPPORTED)
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

  // 🔢 CHECK ACCOUNT LIMIT (MAX 5)
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
    0,
    type,
    BANK_CODE // 👈 Bank-IB
   ]
  )

  await client.query("COMMIT")

  return {
   success: true,
   account: {
    accountId,
    accountNumber,
    accountType: type,
    bankCode: BANK_CODE,
    bankName: "Bank-IB",
    balance: 0
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