import type { PoolClient } from "pg"
import { v4 as uuid } from "uuid"

export async function interbankTransfer(
 client: PoolClient,
 fromAccountId: string,
 toAccountNumber: string,
 bankCode: string,
 amount: number
){
 // simulate external network call
 await new Promise(res => setTimeout(res, 1200))

 const reference = "NIP-" + Date.now()
 const txId = uuid()

 await client.query(
  `
  INSERT INTO transactions(id, amount, type, status, reference, from_account, to_account)
  VALUES($1,$2,$3,$4,$5,$6,$7)
  `,
  [txId, amount, "interbank", "completed", reference, fromAccountId, toAccountNumber]
 )

 return {
  success: true,
  reference,
  bankCode,
  transactionId: txId,
  status: "completed"
 }
}
