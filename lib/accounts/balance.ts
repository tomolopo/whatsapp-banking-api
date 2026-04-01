import { pool } from "../db"

export async function getBalance(
 phone: string,
 accountNumber: string
){

 if(!phone){
  throw new Error("Phone is required")
 }

 if(!accountNumber){
  throw new Error("Account number is required")
 }

 // 🔍 GET USER
 const userRes = await pool.query(
  `SELECT id FROM users WHERE phone=$1`,
  [phone]
 )

 if(!userRes.rows.length){
  throw new Error("User not found")
 }

 const userId = userRes.rows[0].id

 // 🔍 GET ACCOUNT (WITH OWNERSHIP CHECK)
 const accRes = await pool.query(
  `
  SELECT account_number, balance, account_type
  FROM accounts
  WHERE account_number=$1
  AND user_id=$2
  `,
  [accountNumber, userId]
 )

 if(!accRes.rows.length){
  throw new Error("Account not found for this user")
 }

 const account = accRes.rows[0]

 return {
  accountNumber: account.account_number,
  accountType: account.account_type,
  balance: account.balance
 }

}