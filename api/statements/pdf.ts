import { VercelRequest,VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";
import { generateStatement } from "../../lib/pdf";

export default async function handler(req:VercelRequest,res:VercelResponse){

 const account = req.query.account;

 const result = await pool.query(
 `
 SELECT
 t.created_at,
 t.amount,
 t.type
 FROM transactions t
 JOIN ledger_entries l
 ON t.id = l.transaction_id
 WHERE l.account_id = $1
 `,
 [account]
 );

 const pdf = generateStatement(result.rows);

 res.setHeader("Content-Type","application/pdf");

 pdf.pipe(res);

}