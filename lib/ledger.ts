import { pool } from "./db";
import { v4 as uuid } from "uuid";

/*
Get balance from ledger
*/

export async function getAccountBalance(accountId: string){

 const result = await pool.query(
 `
 SELECT
 COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) AS balance
 FROM ledger_entries
 WHERE account_id=$1
 `,
 [accountId]
 );

 return result.rows[0].balance;

}

/*
Create ledger entries for transfer
*/

export async function postTransaction(
 fromAccountId: string,
 toAccountId: string,
 amount: number
){

 const txId = uuid();

 await pool.query("BEGIN");

 try{

  await pool.query(
   `
   INSERT INTO transactions(id,type,amount,status,reference)
   VALUES($1,$2,$3,$4,$5)
   `,
   [
    txId,
    "transfer",
    amount,
    "success",
    `TX-${Date.now()}`
   ]
  );

  // debit

  await pool.query(
   `
   INSERT INTO ledger_entries(id,account_id,debit,credit,transaction_id)
   VALUES($1,$2,$3,0,$4)
   `,
   [
    uuid(),
    fromAccountId,
    amount,
    txId
   ]
  );

  // credit

  await pool.query(
   `
   INSERT INTO ledger_entries(id,account_id,debit,credit,transaction_id)
   VALUES($1,$2,0,$3,$4)
   `,
   [
    uuid(),
    toAccountId,
    amount,
    txId
   ]
  );

  await pool.query("COMMIT");

  return txId;

 }catch(err){

  await pool.query("ROLLBACK");

  throw err;

 }

}