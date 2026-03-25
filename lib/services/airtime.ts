import { pool } from "../db"
import { v4 as uuid } from "uuid"
import { createLedgerEntry } from "../ledger/ledger"

export async function purchaseAirtime(
 client: any,
 accountId: string,
 amount: number,
 phone: string,
 network: string
){

 const txId = uuid()

 // 🧾 TRANSACTION
 await client.query(
 `
 INSERT INTO transactions(id, amount, status, type, reference)
 VALUES($1,$2,$3,$4,$5)
 `,
 [txId, amount, "completed", "airtime", `AIR-${Date.now()}`]
 )

 // 💸 DEBIT
 await client.query(
 `UPDATE accounts SET balance = balance - $1 WHERE id=$2`,
 [amount, accountId]
 )

 // 📒 LEDGER
 await createLedgerEntry(client, accountId, amount, 0, txId)

 return {
  success: true,
  type: "airtime",
  amount,
  phone,
  network,
  transactionId: txId,
  message: `₦${amount} airtime sent to ${phone} (${network})`
 }

}