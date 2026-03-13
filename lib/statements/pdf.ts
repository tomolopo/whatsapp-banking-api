import { VercelRequest, VercelResponse } from "@vercel/node"
import { generatePdf } from "../../lib/pdf"

export default async function handler(
 req: VercelRequest,
 res: VercelResponse
){

 try{

  const data = req.body

  const pdf = await generatePdf(data)

  res.setHeader("Content-Type","application/pdf")

  res.send(pdf)

 }catch(err){

  const msg =
   err instanceof Error ? err.message : "Unknown error"

  res.status(500).json({ error: msg })

 }

}