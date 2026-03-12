import { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const event = req.body;

  console.log("Webhook event received:", event);

  /*
  Here you could trigger things like:
  - WhatsApp notification
  - email alert
  - analytics
  - fraud review
  */

  res.json({
   received:true
  });

 }catch(err){

  console.error(err);

  res.status(500).json({
   error:"webhook failed"
  });

 }

}