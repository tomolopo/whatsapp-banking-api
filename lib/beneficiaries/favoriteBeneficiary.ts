import { pool } from "../db"

export async function favoriteBeneficiary(
 phone: string,
 accountNumber: string
){

 if(!phone || !accountNumber){
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

 const result = await pool.query(
  `
  UPDATE beneficiaries
  SET is_favorite = TRUE
  WHERE user_id=$1 AND account_number=$2
  RETURNING *
  `,
  [userId, accountNumber]
 )

 if(!result.rows.length){
  throw new Error("Beneficiary not found")
 }

 return {
  message: "Beneficiary marked as favorite"
 }

}