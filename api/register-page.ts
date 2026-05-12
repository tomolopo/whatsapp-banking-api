import type { VercelRequest, VercelResponse } from "@vercel/node"
import fs from "fs"
import path from "path"
import { verifyToken } from "../lib/onboarding/token"
import { escapeHtml } from "../lib/utils/escape"

export default function handler(req: VercelRequest, res: VercelResponse){

 const token = req.query.token

 if(typeof token !== "string" || !token){
  return res.status(400).send("Invalid link")
 }

 if(!verifyToken(token)){
  return res.status(400).send("Invalid or expired token")
 }

 const filePath = path.join(process.cwd(), "frontend", "register.html")
 let html = fs.readFileSync(filePath, "utf8")

 const apiBase = process.env.PUBLIC_BASE_URL || "https://whatsapp-banking-api.vercel.app"

 html = html
  .replace("{{TOKEN}}", escapeHtml(token))
  .replace("{{API_BASE_URL}}", escapeHtml(apiBase))

 res.setHeader("Content-Type", "text/html; charset=utf-8")
 res.setHeader("Cache-Control", "no-store")
 res.status(200).send(html)
}
