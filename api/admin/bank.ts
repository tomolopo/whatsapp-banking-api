import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const banks = await pool.query(
 `
 SELECT *
 FROM banks
 `
 );

 res.json(banks.rows);

}