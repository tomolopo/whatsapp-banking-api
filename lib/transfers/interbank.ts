import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function interbankTransfer(
 fromAccountId: string,
 toAccountNumber: string,
 bankCode: string,
 amount: number
){

 // simulate delay
 await new Promise(res => setTimeout(res, 1200))

 const reference = "NIP-" + Date.now()

 // 🧾 RECORD TRANSACTION
 await pool.query(
 `
 INSERT INTO transactions(id, amount, type, status, reference)
 VALUES($1,$2,$3,$4,$5)
 `,
 [
  uuid(),
  amount,
  "interbank",
  "completed",
  reference
 ]
 )

 return {
  success: true,
  reference,
  bankCode,
  status: "completed"
 }

}