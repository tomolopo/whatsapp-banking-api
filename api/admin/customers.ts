import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const users = await pool.query(
 `
 SELECT id,name,phone,created_at
 FROM users
 ORDER BY created_at DESC
 `
 );

 res.json(users.rows);

}