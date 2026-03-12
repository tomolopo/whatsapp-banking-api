import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const tx = await pool.query(
 `
 SELECT
 id,
 type,
 amount,
 status,
 reference,
 created_at
 FROM transactions
 ORDER BY created_at DESC
 `
 );

 res.json(tx.rows);

}