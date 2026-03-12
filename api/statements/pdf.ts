import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { generateStatement } from "../../lib/pdf";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const accountNumber = req.query.account as string;

  const account = await pool.query(
   "SELECT id FROM accounts WHERE account_number=$1",
   [accountNumber]
  );

  const accountId = account.rows[0].id;

  const tx = await pool.query(
   `
   SELECT
   t.created_at,
   t.amount,
   t.type
   FROM transactions t
   JOIN ledger_entries l
   ON t.id = l.transaction_id
   WHERE l.account_id=$1
   `,
   [accountId]
  );

  const pdf = generateStatement(accountNumber,tx.rows);

  res.setHeader("Content-Type","application/pdf");

  pdf.pipe(res);

 }catch(err){

  console.error(err);

  res.status(500).json({error:"statement generation failed"});

 }

}