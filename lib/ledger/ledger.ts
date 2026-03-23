import { pool } from "../db"
import { v4 as uuid } from "uuid"

export async function createLedgerEntry(
 accountId:string,
 debit:number,
 credit:number,
 transactionId:string
){

 await pool.query(
 `
 INSERT INTO ledger_entries(id,account_id,debit,credit,transaction_id)
 VALUES($1,$2,$3,$4,$5)
 `,
 [uuid(),accountId,debit,credit,transactionId]
 )

}