import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function createAccount(phone:string, type="savings"){

 const user = await pool.query(
 `SELECT id FROM users WHERE phone=$1`,
 [phone]
 )

 if(!user.rows.length){
  throw new Error("User not found")
 }

 const userId = user.rows[0].id

 // prevent duplicate same account type
 const existing = await pool.query(
 `
 SELECT id FROM accounts
 WHERE user_id=$1 AND account_type=$2
 `,
 [userId, type]
 )

 if(existing.rows.length){
  throw new Error("Account already exists")
 }

 const accountNumber = Math.floor(
 1000000000 + Math.random()*9000000000
 ).toString()

 await pool.query(
 `
 INSERT INTO accounts(id,user_id,account_number,balance,account_type)
 VALUES($1,$2,$3,$4,$5)
 `,
 [uuid(), userId, accountNumber, 0, type]
 )

 return {
  account_number: accountNumber,
  account_type: type,
  balance: 0
 }

}