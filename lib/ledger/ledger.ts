import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function createLedgerEntry(
 client: any,
 accountId: string,
 debit: number,
 credit: number,
 transactionId: string
){

 await client.query(
 `
 INSERT INTO ledger_entries(account_id,debit,credit,transaction_id)
 VALUES($1,$2,$3,$4)
 `,
 [accountId, debit, credit, transactionId]
 )

}