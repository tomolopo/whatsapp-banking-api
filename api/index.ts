import { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
 req: VercelRequest,
 res: VercelResponse
) {

 res.json({
  service: "WhatsApp Banking API",
  status: "running",
  version: "1.0"
 });

}