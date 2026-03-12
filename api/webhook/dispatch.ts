import { VercelRequest, VercelResponse } from "@vercel/node";
import { pool } from "../../lib/db";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const webhookUrl = process.env.WEBHOOK_URL;

  if(!webhookUrl){
   return res.status(500).json({
    error:"WEBHOOK_URL not configured"
   });
  }

  /*
  Get pending events
  */

  const events = await pool.query(
   `
   SELECT *
   FROM events
   WHERE status='pending'
   LIMIT 10
   `
  );

  for(const event of events.rows){

   try{

    await fetch(webhookUrl,{
     method:"POST",
     headers:{
      "Content-Type":"application/json"
     },
     body: JSON.stringify({
      type: event.type,
      payload: event.payload
     })
    });

    /*
    Mark event as sent
    */

    await pool.query(
     `
     UPDATE events
     SET status='sent'
     WHERE id=$1
     `,
     [event.id]
    );

   }catch(err){

    console.error("Webhook delivery failed:",err);

   }

  }

  res.json({
   processed: events.rows.length
  });

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"dispatch failed"
  });

 }

}