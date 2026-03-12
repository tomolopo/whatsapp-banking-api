import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 const resource = req.query.resource;

 try{

  if(resource === "accounts"){

   const result = await pool.query(
    "SELECT * FROM accounts ORDER BY created_at DESC"
   );

   res.json({accounts:result.rows});

  }

  else if(resource === "customers"){

   const result = await pool.query(
    "SELECT * FROM users ORDER BY created_at DESC"
   );

   res.json({customers:result.rows});

  }

  else if(resource === "transactions"){

   const result = await pool.query(
    "SELECT * FROM transactions ORDER BY created_at DESC"
   );

   res.json({transactions:result.rows});

  }

  else if(resource === "fraud"){

   const result = await pool.query(
    "SELECT * FROM fraud_alerts ORDER BY created_at DESC"
   );

   res.json({alerts:result.rows});

  }

  else if(resource === "banks"){

   const result = await pool.query(
    "SELECT * FROM banks ORDER BY name ASC"
   );

   res.json({banks:result.rows});

  }

  else{

   res.status(400).json({error:"invalid resource"});

  }

 }catch(err){

  console.error(err);
  res.status(500).json({error:"server error"});

 }

}