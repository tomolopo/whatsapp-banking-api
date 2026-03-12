import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const accountNumber = req.query.account;

  const account = await pool.query(
   "SELECT id FROM accounts WHERE account_number=$1",
   [accountNumber]
  );

  const accountId = account.rows[0].id;

  const result = await pool.query(
   `
   SELECT
   t.id,
   t.type,
   t.amount,
   t.status,
   t.reference,
   t.created_at
   FROM transactions t
   JOIN ledger_entries l
   ON t.id = l.transaction_id
   WHERE l.account_id=$1
   ORDER BY t.created_at DESC
   LIMIT 50
   `,
   [accountId]
  );

  res.json(result.rows);

 }catch(err){

  console.error(err);

  res.status(500).json({error:"server error"});

 }

}