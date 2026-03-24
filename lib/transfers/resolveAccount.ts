import { pool } from "../db"

export async function resolveAccount(accountNumber: string){

 if(!accountNumber){
  throw new Error("Account number required")
 }

 // 🔍 CHECK IF INTERNAL (Bank-IB)
 const internal = await pool.query(
 `
 SELECT 
  a.account_number,
  a.bank_code,
  u.first_name,
  u.last_name
 FROM accounts a
 JOIN users u ON a.user_id = u.id
 WHERE a.account_number=$1
 `,
 [accountNumber]
 )

 if(internal.rows.length){

  const acc = internal.rows[0]

  return {
   accountNumber,
   accountName: `${acc.first_name} ${acc.last_name}`,
   bankCode: acc.bank_code,
   bankName: "Bank-IB",
   type: "internal"
  }

 }

 // 🌍 SIMULATED EXTERNAL BANK
 return {
  accountNumber,
  accountName: "Demo Receiver",
  bankCode: "044",
  bankName: "Access Bank",
  type: "external"
 }

}