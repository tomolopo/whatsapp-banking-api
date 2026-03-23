import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function createAccount(phone: string){

 // 1️⃣ GET USER ID FROM PHONE
 const userResult = await pool.query(
 `
 SELECT id
 FROM users
 WHERE phone=$1
 `,
 [phone]
 )

 if(userResult.rows.length === 0){
  throw new Error("User not found")
 }

 const userId = userResult.rows[0].id

 // 2️⃣ GENERATE ACCOUNT NUMBER
 const accountNumber = Math.floor(
  1000000000 + Math.random() * 9000000000
 ).toString()

 // 3️⃣ CREATE ACCOUNT USING UUID (NOT PHONE)
 await pool.query(
 `
 INSERT INTO accounts(id,user_id,account_number,balance)
 VALUES($1,$2,$3,$4)
 `,
 [uuid(), userId, accountNumber, 0]
 )

 return {
  account_number: accountNumber,
  balance: 0
 }

}