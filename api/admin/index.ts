import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 // allow dashboard requests
 res.setHeader("Access-Control-Allow-Origin", "*");
 res.setHeader("Access-Control-Allow-Methods","GET,OPTIONS");
 res.setHeader("Access-Control-Allow-Headers","Content-Type");

 if(req.method === "OPTIONS"){
  return res.status(200).end();
 }

 const resource = req.query.resource;

 try{

  if(resource === "banks"){

   const result = await pool.query(
    "SELECT * FROM banks ORDER BY name ASC"
   );

   return res.json({banks:result.rows});
  }

  if(resource === "accounts"){

   const result = await pool.query(
    "SELECT * FROM accounts ORDER BY created_at DESC"
   );

   return res.json({accounts:result.rows});
  }

  if(resource === "customers"){

   const result = await pool.query(
    "SELECT * FROM users ORDER BY created_at DESC"
   );

   return res.json({customers:result.rows});
  }

  if(resource === "transactions"){

   const result = await pool.query(
    "SELECT * FROM transactions ORDER BY created_at DESC"
   );

   return res.json({transactions:result.rows});
  }

  if(resource === "fraud"){

   const result = await pool.query(
    "SELECT * FROM fraud_alerts ORDER BY created_at DESC"
   );

   return res.json({alerts:result.rows});
  }

  return res.status(400).json({
   error:"invalid resource"
  });

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"server error"
  });

 }

}