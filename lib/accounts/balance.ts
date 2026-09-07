import { pool } from "../db"
import { AppError } from "../utils/errors"

export async function getBalance(
 phone: string,
 accountNumber: string
){

 if(!phone){
  throw new AppError("BAD_REQUEST", "Phone is required", 400)
 }

 if(!accountNumber){
  throw new AppError("BAD_REQUEST", "Account number is required", 400)
 }

 // 🔍 GET USER
 const userRes = await pool.query(
  `SELECT id FROM users WHERE phone=$1`,
  [phone]
 )

 if(!userRes.rows.length){
  throw new AppError("NOT_FOUND", "User not found", 404)
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
  throw new AppError("FORBIDDEN", "Account not found for this user", 403)
 }

 const account = accRes.rows[0]

 return {
  accountNumber: account.account_number,
  accountType: account.account_type,
  balance: account.balance
 }

}
