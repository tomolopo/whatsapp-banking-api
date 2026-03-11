import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
) {

 try {

  const accountNumber = req.query.account;

  if(!accountNumber){
   return res.status(400).json({
    error:"account number required"
   });
  }

  // Step 1 — find account UUID
  const account = await pool.query(
   `
   SELECT id
   FROM accounts
   WHERE account_number=$1
   `,
   [accountNumber]
  );

  if(account.rows.length === 0){
   return res.status(404).json({
    error:"account not found"
   });
  }

  const accountId = account.rows[0].id;

  // Step 2 — calculate balance from ledger
  const balance = await pool.query(
   `
   SELECT
   COALESCE(SUM(credit),0) - COALESCE(SUM(debit),0) AS balance
   FROM ledger_entries
   WHERE account_id=$1
   `,
   [accountId]
  );

  res.json({
   account: accountNumber,
   balance: balance.rows[0].balance
  });

 } catch(err){

  console.error(err);

  res.status(500).json({
   error:"server error"
  });

 }

}