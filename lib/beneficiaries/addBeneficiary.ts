import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function addBeneficiary(
 phone: string,
 accountNumber: string,
 bankCode: string,
 name: string,
 nickname?: string
){

 if(!phone || !accountNumber || !bankCode || !name){
  throw new Error("Missing required fields")
 }

 const userRes = await pool.query(
  `SELECT id FROM users WHERE phone=$1`,
  [phone]
 )

 if(!userRes.rows.length){
  throw new Error("User not found")
 }

 const userId = userRes.rows[0].id

 // prevent duplicates
 const existing = await pool.query(
  `
  SELECT id FROM beneficiaries
  WHERE user_id=$1
  AND account_number=$2
  AND bank_code=$3
  `,
  [userId, accountNumber, bankCode]
 )

 if(existing.rows.length){
  throw new Error("Beneficiary already exists")
 }

 await pool.query(
  `
  INSERT INTO beneficiaries(
    id,
    user_id,
    name,
    account_number,
    bank_code,
    nickname
  )
  VALUES($1,$2,$3,$4,$5,$6)
  `,
  [
    uuid(),
    userId,
    name,
    accountNumber,
    bankCode,
    nickname || null
  ]
 )

 return {
  message: "Beneficiary added successfully"
 }

}