import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const flags = await pool.query(
 `
 SELECT *
 FROM fraud_flags
 ORDER BY created_at DESC
 `
 );

 res.json(flags.rows);

}