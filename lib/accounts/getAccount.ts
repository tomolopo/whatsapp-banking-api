import { pool } from "../db"

export async function getAccounts(phone: string){

 if(!phone){
  throw new Error("Phone is required")
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

 // 🏦 GET ALL ACCOUNTS
 const accountsRes = await pool.query(
  `
  SELECT 
    account_number,
    account_type,
    balance,
    created_at
  FROM accounts
  WHERE user_id=$1
  ORDER BY created_at DESC
  `,
  [userId]
 )

 return {
  accounts: accountsRes.rows.map(acc => ({
    accountNumber: acc.account_number,
    accountType: acc.account_type,
    balance: acc.balance,
    createdAt: acc.created_at
  }))
 }

}