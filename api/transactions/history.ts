import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(req: VercelRequest, res: VercelResponse) {

 const account = req.query.account;

 const result = await pool.query(
 `
 SELECT *
 FROM transactions
 ORDER BY created_at DESC
 LIMIT 50
 `
 );

 res.json(result.rows);

}