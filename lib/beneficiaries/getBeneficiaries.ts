import { pool } from "../db"

export async function getBeneficiaries(phone: string){

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
  SELECT name, account_number, bank_code, nickname
  FROM beneficiaries
  WHERE user_id=$1
  ORDER BY created_at DESC
  `,
  [userId]
 )

 return {
  beneficiaries: result.rows.map(b => ({
    name: b.name,
    accountNumber: b.account_number,
    bankCode: b.bank_code,
    nickname: b.nickname,
    label: `${b.nickname || b.name} (${b.account_number})`
  }))
 }

}