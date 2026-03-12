import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { getAccountBalance } from "../../lib/ledger";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const accountNumber = req.query.account;

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

  const balance = await getAccountBalance(accountId);

  res.json({
   account: accountNumber,
   balance
  });

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"server error"
  });

 }

}