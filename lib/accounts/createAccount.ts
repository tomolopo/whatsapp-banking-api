import { pool } from "../db"
import { v4 as uuid } from "uuid"

function generateAccountNumber(){
 return Math.floor(
  1000000000 + Math.random() * 9000000000
 ).toString()
}

export async function createAccount(
 phone: string,
 type = "savings"
){

 // 🔍 GET USER
 const user = await pool.query(
 `SELECT id FROM users WHERE phone=$1`,
 [phone]
 )

 if(!user.rows.length){
  throw new Error("User not found")
 }

 const userId = user.rows[0].id

 // 🚫 PREVENT DUPLICATE ACCOUNT TYPE
 const existing = await pool.query(
 `
 SELECT id FROM accounts
 WHERE user_id=$1 AND account_type=$2
 `,
 [userId, type]
 )

 if(existing.rows.length){
  throw new Error(`${type} account already exists`)
 }

 const accountNumber = generateAccountNumber()

 // 🏦 CREATE ACCOUNT (WITH BANK-IB)
 await pool.query(
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
  uuid(),
  userId,
  accountNumber,
  0,
  type,
  "999" // ✅ Bank-IB
 ]
 )

 return {
  account_number: accountNumber,
  account_type: type,
  bank: "Bank-IB",
  balance: 0
 }

}